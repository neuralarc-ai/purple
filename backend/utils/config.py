"""
Configuration management.

This module provides a centralized way to access configuration settings and
environment variables across the application. It supports different environment
modes (development, staging, production) and provides validation for required
values.

Usage:
    from utils.config import config
    
    # Access configuration values
    api_key = config.OPENAI_API_KEY
    env_mode = config.ENV_MODE
"""

import os
from enum import Enum
from typing import Dict, Any, Optional, get_type_hints, Union
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

class EnvMode(Enum):
    """Environment mode enumeration."""
    LOCAL = "local"
    STAGING = "staging"
    PRODUCTION = "production"

class Configuration:
    """
    Centralized configuration for AgentPress backend.
    
    This class loads environment variables and provides type checking and validation.
    Default values can be specified for optional configuration items.
    """
    
    # Environment mode
    ENV_MODE: EnvMode = EnvMode.PRODUCTION
    
    # Subscription tier IDs - Production
    STRIPE_FREE_TIER_ID_PROD: str = 'price_1S1ud4AnxOD5rXBGNHW2yHp8'  # Free
    STRIPE_TIER_RIDICULOUSLY_CHEAP_ID_PROD: str = 'price_1S2VNiAnxOD5rXBGWs7gO2rv'  # $24.99/month
    STRIPE_TIER_SERIOUS_BUSINESS_ID_PROD: str = 'price_1S2VO6AnxOD5rXBGU5KcFi0O'  # $94.99/month
    
    # Yearly subscription tier IDs - Production (15% discount)
    STRIPE_TIER_RIDICULOUSLY_CHEAP_YEARLY_ID_PROD: str = 'price_1S2VOMAnxOD5rXBGOfBNWIe4'  # $254.89/year
    STRIPE_TIER_SERIOUS_BUSINESS_YEARLY_ID_PROD: str = 'price_1S2VOfAnxOD5rXBGI80iSxA5'  # $968.88/year

    # Subscription tier IDs - Staging
    STRIPE_FREE_TIER_ID_STAGING: str = 'price_1RIGvuG6l1KZGqIrw14abxeL'
    STRIPE_TIER_RIDICULOUSLY_CHEAP_ID_STAGING: str = 'price_1RIGvuG6l1KZGqIrCRu0E4Gi'  # $24.99/month
    STRIPE_TIER_SERIOUS_BUSINESS_ID_STAGING: str = 'price_1RIGvuG6l1KZGqIrvjlz5p5V'  # $94.99/month
    
    # Yearly subscription tier IDs - Staging (15% discount)
    STRIPE_TIER_RIDICULOUSLY_CHEAP_YEARLY_ID_STAGING: str = 'price_1ReGogG6l1KZGqIrEyBTmtPk'  # $254.89/year
    STRIPE_TIER_SERIOUS_BUSINESS_YEARLY_ID_STAGING: str = 'price_1ReGoJG6l1KZGqIr0DJWtoOc'  # $968.88/year
    
    # Credit package price IDs - Production
    STRIPE_CREDITS_TEST_ID_PROD: str = 'price_1S2n0LAnxOD5rXBGLplkdkq6'  # $1.00 - 500 credits (TESTING)


    STRIPE_CREDITS_SMALL_PRICE_ID_PROD: str = 'price_1S2VXvAnxOD5rXBGylPu8TTc'  # $9.99 - 5,000 credits
    STRIPE_CREDITS_MEDIUM_PRICE_ID_PROD: str = 'price_1S2VY6AnxOD5rXBGWs7gO2rv'  # $18.99 - 10,000 credits
    STRIPE_CREDITS_LARGE_PRICE_ID_PROD: str = 'price_1S2VYHAnxOD5rXBGIL73U202'  # $44.99 - 25,000 credits
    
    # Trial plan - Production
    STRIPE_TRIAL_PLAN_ID_PROD: str = 'price_1S6oPuAnxOD5rXBGc2TGjjXu'  # $1.99 - 1 week trial
    
    # Credit package price IDs - Staging  
    STRIPE_CREDITS_TEST_PRICE_ID_STAGING: str = 'price_1S2n0LAnxOD5rXBGLplkdkq6'  # $1.00 - 500 credits (TESTING)

    STRIPE_CREDITS_SMALL_PRICE_ID_STAGING: str = 'price_1RxXOvG6l1KZGqIrMqsiYQvk'  # $9.99 - 5,000 credits
    STRIPE_CREDITS_MEDIUM_PRICE_ID_STAGING: str = 'price_1RxXPNG6l1KZGqIrQprPgDme'  # $18.99 - 10,000 credits
    STRIPE_CREDITS_LARGE_PRICE_ID_STAGING: str = 'price_1RxXPYG6l1KZGqIrQprPgDme'  # $44.99 - 25,000 credits
    
    # Trial plan - Staging
    STRIPE_TRIAL_PLAN_ID_STAGING: str = 'price_1S6oPuAnxOD5rXBGc2TGjjXu'  # $1.99 - 1 week trial
    
    # Feature Flags - Environment Variable Configuration
    # These flags can be controlled via environment variables (e.g., ENABLE_CUSTOM_AGENTS=true)
    # If not set, they will fall back to Redis-based configuration
    
    # Custom agents feature flag
    ENABLE_CUSTOM_AGENTS: bool = True
    
    # MCP module feature flag
    ENABLE_MCP_MODULE: bool = True
    
    # Templates API feature flag
    ENABLE_TEMPLATES_API: bool = True
    
    # Triggers API feature flag
    ENABLE_TRIGGERS_API: bool = True
    
    # Workflows API feature flag
    ENABLE_WORKFLOWS_API: bool = True
    
    # Knowledge base feature flag
    ENABLE_KNOWLEDGE_BASE: bool = True
    
    # Pipedream integration feature flag
    ENABLE_PIPEDREAM: bool = True
    
    # Credentials API feature flag
    ENABLE_CREDENTIALS_API: bool = True
    
    # Helium default agent feature flag
    ENABLE_HELIUM_DEFAULT_AGENT: bool = True
    
    # Computed subscription tier IDs based on environment
    @property
    def STRIPE_FREE_TIER_ID(self) -> str:   
        if self.ENV_MODE == EnvMode.STAGING:
            return self.STRIPE_FREE_TIER_ID_STAGING
        return self.STRIPE_FREE_TIER_ID_PROD
    
    @property
    def STRIPE_TIER_RIDICULOUSLY_CHEAP_ID(self) -> str:
        if self.ENV_MODE == EnvMode.STAGING:
            return self.STRIPE_TIER_RIDICULOUSLY_CHEAP_ID_STAGING
        return self.STRIPE_TIER_RIDICULOUSLY_CHEAP_ID_PROD
    
    @property
    def STRIPE_TIER_SERIOUS_BUSINESS_ID(self) -> str:
        if self.ENV_MODE == EnvMode.STAGING:
            return self.STRIPE_TIER_SERIOUS_BUSINESS_ID_STAGING
        return self.STRIPE_TIER_SERIOUS_BUSINESS_ID_PROD
    
    # Yearly tier computed properties
    @property
    def STRIPE_TIER_RIDICULOUSLY_CHEAP_YEARLY_ID(self) -> str:
        if self.ENV_MODE == EnvMode.STAGING:
            return self.STRIPE_TIER_RIDICULOUSLY_CHEAP_YEARLY_ID_STAGING
        return self.STRIPE_TIER_RIDICULOUSLY_CHEAP_YEARLY_ID_PROD
    
    @property
    def STRIPE_TIER_SERIOUS_BUSINESS_YEARLY_ID(self) -> str:
        if self.ENV_MODE == EnvMode.STAGING:
            return self.STRIPE_TIER_SERIOUS_BUSINESS_YEARLY_ID_STAGING
        return self.STRIPE_TIER_SERIOUS_BUSINESS_YEARLY_ID_PROD
    
    # Credit package price ID properties
    @property
    def STRIPE_CREDITS_TEST_PRICE_ID(self) -> str:
        if self.ENV_MODE == EnvMode.STAGING:
            return self.STRIPE_CREDITS_TEST_PRICE_ID_STAGING
        return self.STRIPE_CREDITS_TEST_ID_PROD
    
    @property
    def STRIPE_CREDITS_SMALL_PRICE_ID(self) -> str:
        if self.ENV_MODE == EnvMode.STAGING:
            return self.STRIPE_CREDITS_SMALL_PRICE_ID_STAGING
        return self.STRIPE_CREDITS_SMALL_PRICE_ID_PROD
    
    @property
    def STRIPE_CREDITS_MEDIUM_PRICE_ID(self) -> str:
        if self.ENV_MODE == EnvMode.STAGING:
            return self.STRIPE_CREDITS_MEDIUM_PRICE_ID_STAGING
        return self.STRIPE_CREDITS_MEDIUM_PRICE_ID_PROD
    
    @property
    def STRIPE_CREDITS_LARGE_PRICE_ID(self) -> str:
        if self.ENV_MODE == EnvMode.STAGING:
            return self.STRIPE_CREDITS_LARGE_PRICE_ID_STAGING
        return self.STRIPE_CREDITS_LARGE_PRICE_ID_PROD
    
    @property
    def STRIPE_TRIAL_PLAN_ID(self) -> str:
        if self.ENV_MODE == EnvMode.STAGING:
            return self.STRIPE_TRIAL_PLAN_ID_STAGING
        return self.STRIPE_TRIAL_PLAN_ID_PROD
    
    # LLM API keys
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    OPENROUTER_API_KEY: Optional[str] = None
    XAI_API_KEY: Optional[str] = None
    MORPH_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    OPENROUTER_API_BASE: Optional[str] = "https://openrouter.ai/api/v1"
    
    # Google Vertex AI / Gemini via LiteLLM
    VERTEXAI_PROJECT: Optional[str] = None
    VERTEXAI_LOCATION: Optional[str] = None
    # Either a JSON string of the service account or a path to the json file
    VERTEXAI_CREDENTIALS: Optional[str] = None
    # Standard Google ADC file path; if set we propagate it as env for SDK auth
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    # Alternate env var names some users set
    GOOGLE_CLOUD_PROJECT_ID: Optional[str] = None
    GOOGLE_CLOUD_LOCATION: Optional[str] = None
    
    # Google OAuth configuration for backend authentication
    GOOGLE_OAUTH_CLIENT_ID: Optional[str] = None
    GOOGLE_OAUTH_CLIENT_SECRET: Optional[str] = None
    GOOGLE_OAUTH_REDIRECT_URI: Optional[str] = None
    
    # Frontend URL for OAuth redirects
    NEXT_PUBLIC_URL: Optional[str] = None
    
    # OpenRouter site metadata
    OR_SITE_URL: Optional[str] = "https://he2.ai"
    OR_APP_NAME: Optional[str] = "Helium AI"    
    
    # AWS Bedrock credentials
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION_NAME: Optional[str] = None
    

    
    # Supabase configuration
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    # Redis configuration
    REDIS_HOST: str
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_SSL: bool = True
    
    # Daytona sandbox configuration
    DAYTONA_API_KEY: str
    DAYTONA_SERVER_URL: str
    DAYTONA_TARGET: str
    
    # Search and other API keys
    TAVILY_API_KEY: str
    RAPID_API_KEY: str
    CLOUDFLARE_API_TOKEN: Optional[str] = None
    FIRECRAWL_API_KEY: str
    FIRECRAWL_URL: Optional[str] = "https://api.firecrawl.dev"
    
    # Stripe configuration
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_DEFAULT_PLAN_ID: Optional[str] = None
    STRIPE_DEFAULT_TRIAL_DAYS: int = 14
    
    # Stripe Product IDs
    STRIPE_SUBSCRIPTION_PRODUCT_ID: str = 'prod_your_subscription_product_id_here'  # For subscription plans
    STRIPE_CREDITS_PRODUCT_ID: str = 'prod_your_credits_product_id_here'  # For credit packages
    
    # Legacy support (keep for backward compatibility)
    STRIPE_PRODUCT_ID: str = 'prod_your_subscription_product_id_here'  # Default to subscription product
    
    # Sandbox configuration
    STRIPE_PRODUCT_ID_PROD: str = 'prod_SCl7AQ2C8kK1CD'
    STRIPE_PRODUCT_ID_STAGING: str = 'prod_SCgIj3G7yPOAWY'
    SANDBOX_IMAGE_NAME = "neuralarcai/he2:0.1.1"
    SANDBOX_SNAPSHOT_NAME = "neuralarcai/he2:0.1.1"
    SANDBOX_ENTRYPOINT = "/usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf"

    # LangFuse configuration
    LANGFUSE_PUBLIC_KEY: Optional[str] = None
    LANGFUSE_SECRET_KEY: Optional[str] = None
    LANGFUSE_HOST: str = "https://cloud.langfuse.com"

    # Admin API key for server-side operations
    KORTIX_ADMIN_API_KEY: Optional[str] = None

    # API Keys system configuration
    API_KEY_SECRET: str = "default-secret-key-change-in-production"
    API_KEY_LAST_USED_THROTTLE_SECONDS: int = 900
    
    # Agent execution limits (can be overridden via environment variable)
    _MAX_PARALLEL_AGENT_RUNS_ENV: Optional[str] = None
    
    # Agent limits per billing tier
    # Note: These limits are bypassed in local mode (ENV_MODE=local) where unlimited agents are allowed
    AGENT_LIMITS = {
        'free': 2,
        'tier_ridiculously_cheap': 5,
        'tier_serious_business': 100,
        # Yearly plans have same limits as monthly
        'tier_ridiculously_cheap_yearly': 5,
        'tier_serious_business_yearly': 100,
    }

    @property
    def MAX_PARALLEL_AGENT_RUNS(self) -> int:
        """
        Get the maximum parallel agent runs limit.
        
        Can be overridden via MAX_PARALLEL_AGENT_RUNS environment variable.
        Defaults:
        - Production: 3
        - Local/Staging: 999999 (effectively infinite)
        """
        # Check for environment variable override first
        if self._MAX_PARALLEL_AGENT_RUNS_ENV is not None:
            try:
                return int(self._MAX_PARALLEL_AGENT_RUNS_ENV)
            except ValueError:
                logger.warning(f"Invalid MAX_PARALLEL_AGENT_RUNS value: {self._MAX_PARALLEL_AGENT_RUNS_ENV}, using default")
        
        # Environment-based defaults
        if self.ENV_MODE == EnvMode.PRODUCTION:
            return 3
        else:
            # Local and staging: effectively infinite
            return 999999
    
    def __init__(self):
        """Initialize configuration by loading from environment variables."""
        # Load environment variables from .env file if it exists
        load_dotenv()
        
        # Set environment mode first
        env_mode_str = os.getenv("ENV_MODE", EnvMode.LOCAL.value)
        try:
            self.ENV_MODE = EnvMode(env_mode_str.lower())
        except ValueError:
            logger.warning(f"Invalid ENV_MODE: {env_mode_str}, defaulting to LOCAL")
            self.ENV_MODE = EnvMode.LOCAL
            
        logger.debug(f"Environment mode: {self.ENV_MODE.value}")
        
        # Load configuration from environment variables
        self._load_from_env()
        
        # Perform validation
        self._validate()
        
    def _load_from_env(self):
        """Load configuration values from environment variables."""
        for key, expected_type in get_type_hints(self.__class__).items():
            env_val = os.getenv(key)
            
            if env_val is not None:
                # Convert environment variable to the expected type
                if expected_type == bool:
                    # Handle boolean conversion
                    setattr(self, key, env_val.lower() in ('true', 't', 'yes', 'y', '1'))
                elif expected_type == int:
                    # Handle integer conversion
                    try:
                        setattr(self, key, int(env_val))
                    except ValueError:
                        logger.warning(f"Invalid value for {key}: {env_val}, using default")
                elif expected_type == EnvMode:
                    # Already handled for ENV_MODE
                    pass
                else:
                    # String or other type
                    setattr(self, key, env_val)
        
        # Custom handling for environment-dependent properties
        max_parallel_runs_env = os.getenv("MAX_PARALLEL_AGENT_RUNS")
        if max_parallel_runs_env is not None:
            self._MAX_PARALLEL_AGENT_RUNS_ENV = max_parallel_runs_env
    
    def _validate(self):
        """Validate configuration based on type hints."""
        # Get all configuration fields and their type hints
        type_hints = get_type_hints(self.__class__)
        
        # Find missing required fields
        missing_fields = []
        for field, field_type in type_hints.items():
            # Check if the field is Optional
            is_optional = hasattr(field_type, "__origin__") and field_type.__origin__ is Union and type(None) in field_type.__args__
            
            # If not optional and value is None, add to missing fields
            if not is_optional and getattr(self, field) is None:
                missing_fields.append(field)
        
        if missing_fields:
            error_msg = f"Missing required configuration fields: {', '.join(missing_fields)}"
            logger.error(error_msg)
            raise ValueError(error_msg)
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get a configuration value with an optional default."""
        return getattr(self, key, default)
    
    def as_dict(self) -> Dict[str, Any]:
        """Return configuration as a dictionary."""
        return {
            key: getattr(self, key) 
            for key in get_type_hints(self.__class__).keys()
            if not key.startswith('_')
        }

# Create a singleton instance
config = Configuration() 