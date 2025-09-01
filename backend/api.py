from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request, HTTPException, Response, Depends, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from services import redis
import sentry
from contextlib import asynccontextmanager
from agentpress.thread_manager import ThreadManager
from services.supabase import DBConnection
from datetime import datetime, timezone
from utils.config import config, EnvMode
import asyncio
from utils.logger import logger, structlog
import time
from collections import OrderedDict

from pydantic import BaseModel
import uuid

from agent import api as agent_api

from sandbox import api as sandbox_api
from services import billing as billing_api
from flags import api as feature_flags_api
from services import transcription as transcription_api
import sys
from services import email_api
from triggers import api as triggers_api
from services import api_keys_api


if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# Initialize managers
db = DBConnection()
instance_id = "single"

# Rate limiter state
ip_tracker = OrderedDict()
MAX_CONCURRENT_IPS = 25

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.debug(f"Starting up FastAPI application with instance ID: {instance_id} in {config.ENV_MODE.value} mode")
    try:
        await db.initialize()
        
        agent_api.initialize(
            db,
            instance_id
        )
        
        
        sandbox_api.initialize(db)
        
        # Initialize Redis connection
        from services import redis
        try:
            await redis.initialize_async()
            logger.debug("Redis connection initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Redis connection: {e}")
            # Continue without Redis - the application will handle Redis failures gracefully
        
        # Start background tasks
        # asyncio.create_task(agent_api.restore_running_agent_runs())
        
        triggers_api.initialize(db)
        pipedream_api.initialize(db)
        credentials_api.initialize(db)
        template_api.initialize(db)
        composio_api.initialize(db)
        
        yield
        
        # Clean up agent resources
        logger.debug("Cleaning up agent resources")
        await agent_api.cleanup()
        
        # Clean up Redis connection
        try:
            logger.debug("Closing Redis connection")
            await redis.close()
            logger.debug("Redis connection closed successfully")
        except Exception as e:
            logger.error(f"Error closing Redis connection: {e}")
        
        # Clean up database connection
        logger.debug("Disconnecting from database")
        await db.disconnect()
    except Exception as e:
        logger.error(f"Error during application startup: {e}")
        raise

app = FastAPI(lifespan=lifespan)

@app.middleware("http")
async def log_requests_middleware(request: Request, call_next):
    structlog.contextvars.clear_contextvars()

    request_id = str(uuid.uuid4())
    start_time = time.time()
    client_ip = request.client.host if request.client else "unknown"
    method = request.method
    path = request.url.path
    query_params = str(request.query_params)

    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        client_ip=client_ip,
        method=method,
        path=path,
        query_params=query_params
    )

    # Log the incoming request
    logger.debug(f"Request started: {method} {path} from {client_ip} | Query: {query_params}")
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.debug(f"Request completed: {method} {path} | Status: {response.status_code} | Time: {process_time:.2f}s")
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Request failed: {method} {path} | Error: {str(e)} | Time: {process_time:.2f}s")
        raise

# Define allowed origins based on environment
allowed_origins = ["https://www.he2.ai", "https://he2.ai", "http://localhost:3000"]
allow_origin_regex = None

# Add staging-specific origins
if config.ENV_MODE == EnvMode.LOCAL:
    allowed_origins.append("http://localhost:3000")

# Add staging-specific origins
if config.ENV_MODE == EnvMode.STAGING:
    allowed_origins.append("https://staging.suna.so")
    allowed_origins.append("http://localhost:3000")
    allow_origin_regex = r"https://suna-.*-prjcts\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Project-Id", "X-MCP-URL", "X-MCP-Type", "X-MCP-Headers", "X-Refresh-Token", "X-API-Key"],
)

# Create a main API router
api_router = APIRouter()

# Include all API routers without individual prefixes
api_router.include_router(agent_api.router)
api_router.include_router(sandbox_api.router)
api_router.include_router(billing_api.router)
api_router.include_router(feature_flags_api.router)
api_router.include_router(api_keys_api.router)

from mcp_module import api as mcp_api
from credentials import api as credentials_api
from templates import api as template_api

api_router.include_router(mcp_api.router)
api_router.include_router(credentials_api.router, prefix="/secure-mcp")
api_router.include_router(template_api.router, prefix="/templates")

api_router.include_router(transcription_api.router)
api_router.include_router(email_api.router)

from knowledge_base import api as knowledge_base_api
api_router.include_router(knowledge_base_api.router)

api_router.include_router(triggers_api.router)

from pipedream import api as pipedream_api
api_router.include_router(pipedream_api.router)

# MFA functionality moved to frontend

from admin import api as admin_api
api_router.include_router(admin_api.router)

from composio_integration import api as composio_api
api_router.include_router(composio_api.router)

# Add prompt generation API
from prompt_generation import api as prompt_generation_api
api_router.include_router(prompt_generation_api.router)

# Prompt improvement endpoint
@api_router.post("/improve-prompt")
async def improve_prompt(request: Request):
    """Improve a user prompt using OpenRouter models"""
    try:
        from services.llm import make_llm_api_call, setup_api_keys
        
        # Ensure API keys are set up
        setup_api_keys()
        
        body = await request.json()
        prompt = body.get('prompt', '').strip()
        model = body.get('model', 'openrouter/mistralai/mistral-small-3.2-24b-instruct:free')
        system_message = body.get('system_message', '')
        
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")
        
        # Prepare messages for the LLM
        messages = [
            {
                "role": "system",
                "content": system_message
            },
            {
                "role": "user", 
                "content": f"Improve this prompt: {prompt}"
            }
        ]
        
        logger.info(f"Improving prompt with model: {model}")
        logger.debug(f"Original prompt: {prompt}")
        logger.debug(f"System message: {system_message}")
        logger.debug(f"Messages: {messages}")
        
        # Make the API call to the selected model
        response = await make_llm_api_call(
            messages=messages,
            model_name=model,
            temperature=0.3,
            max_tokens=1000
        )
        
        logger.debug(f"Raw LLM response: {response}")
        
        # Extract the improved prompt from the response
        if hasattr(response, 'choices') and len(response.choices) > 0:
            improved_prompt = response.choices[0].message.content.strip()
            
            # Remove quotes from the beginning and end if they exist
            if improved_prompt.startswith('"') and improved_prompt.endswith('"'):
                improved_prompt = improved_prompt[1:-1].strip()
            elif improved_prompt.startswith("'") and improved_prompt.endswith("'"):
                improved_prompt = improved_prompt[1:-1].strip()
        else:
            logger.error(f"Unexpected response format: {response}")
            raise Exception("Invalid response format from LLM")
        
        logger.debug(f"Improved prompt: {improved_prompt}")
        
        return {
            "improved_prompt": improved_prompt,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Error improving prompt: {e}")
        logger.error(f"Error type: {type(e)}")
        
        # Provide more specific error messages for common issues
        error_message = str(e)
        if "openrouter" in error_message.lower():
            error_message = f"OpenRouter error: {error_message}"
        elif "authentication" in error_message.lower():
            error_message = f"Authentication error: {error_message}"
        elif "quota" in error_message.lower():
            error_message = f"API quota exceeded: {error_message}"
        
        raise HTTPException(status_code=500, detail=error_message)

@api_router.get("/health")
async def health_check():
    logger.debug("Health check endpoint called")
    return {
        "status": "ok", 
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "instance_id": instance_id
    }

@api_router.get("/health-docker")
async def health_check():
    logger.debug("Health docker check endpoint called")
    try:
        client = await redis.get_client()
        await client.ping()
        db = DBConnection()
        await db.initialize()
        db_client = await db.client
        await db_client.table("threads").select("thread_id").limit(1).execute()
        logger.debug("Health docker check complete")
        return {
            "status": "ok", 
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "instance_id": instance_id
        }
    except Exception as e:
        logger.error(f"Failed health docker check: {e}")
        raise HTTPException(status_code=500, detail="Health check failed")


app.include_router(api_router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    
    workers = 4
    
    logger.debug(f"Starting server on 0.0.0.0:8000 with {workers} workers")
    uvicorn.run(
        "api:app", 
        host="0.0.0.0", 
        port=8000,
        workers=workers,
        loop="asyncio"
    )