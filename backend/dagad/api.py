from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from utils.auth_utils import get_current_user_id_from_jwt
from services.supabase import DBConnection
from utils.logger import logger
from flags.flags import is_enabled
import os


router = APIRouter(prefix="/dagad", tags=["dagad"])


class DAGADEntry(BaseModel):
    entry_id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    content: str = Field(..., min_length=1)
    category: str = Field(default="general", pattern="^(instructions|preferences|rules|notes|general)$")
    priority: int = Field(default=1, ge=1, le=3)
    is_active: bool = True
    is_global: bool = False
    auto_inject: bool = False
    trigger_keywords: Optional[List[str]] = None
    trigger_patterns: Optional[List[str]] = None
    context_conditions: Optional[dict] = None


class DAGADEntryResponse(BaseModel):
    entry_id: str
    title: str
    description: Optional[str]
    content: str
    category: str
    priority: int
    is_active: bool
    is_global: bool
    auto_inject: bool
    trigger_keywords: Optional[List[str]]
    trigger_patterns: Optional[List[str]]
    context_conditions: Optional[dict]
    content_tokens: Optional[int]
    created_at: str
    updated_at: str
    last_used_at: Optional[str]


class DAGADListResponse(BaseModel):
    entries: List[DAGADEntryResponse]
    total_count: int
    total_tokens: int


class CreateDAGADEntryRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    content: str = Field(..., min_length=1)
    category: str = Field(default="general", pattern="^(instructions|preferences|rules|notes|general)$")
    priority: int = Field(default=1, ge=1, le=3)
    is_global: bool = False
    auto_inject: bool = False
    trigger_keywords: Optional[List[str]] = None
    trigger_patterns: Optional[List[str]] = None
    context_conditions: Optional[dict] = None


class UpdateDAGADEntryRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    content: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, pattern="^(instructions|preferences|rules|notes|general)$")
    priority: Optional[int] = Field(None, ge=1, le=3)
    is_active: Optional[bool] = None
    is_global: Optional[bool] = None
    auto_inject: Optional[bool] = None
    trigger_keywords: Optional[List[str]] = None
    trigger_patterns: Optional[List[str]] = None
    context_conditions: Optional[dict] = None


class SmartContextRequest(BaseModel):
    user_input: str
    thread_context: Optional[str] = None
    max_tokens: int = 2000


db = DBConnection()


@router.get("/", response_model=DAGADListResponse)
async def get_user_dagad_entries(
    category: Optional[str] = Query(None, pattern="^(instructions|preferences|rules|notes|general)$"),
    include_inactive: bool = False,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    # Local override: allow DAGAD even if flag service is unavailable
    # Set DISABLE_DAGAD_CHECK=false to re-enable checks
    disable_check = os.getenv("DISABLE_DAGAD_CHECK", "true").lower() in ("1", "true", "yes", "on")
    if not disable_check:
        if not await is_enabled("dagad"):
            raise HTTPException(status_code=403, detail="This feature is not available at the moment.")

    try:
        client = await db.client
        query = client.table('user_dagad_entries').select('*').eq('user_id', user_id)
        if not include_inactive:
            query = query.eq('is_active', True)
        if category:
            query = query.eq('category', category)
        result = await query.order('priority', desc=False).order('created_at', desc=True).execute()

        entries: List[DAGADEntryResponse] = []
        total_tokens = 0
        for row in result.data or []:
            entries.append(DAGADEntryResponse(
                entry_id=row['entry_id'],
                title=row['title'],
                description=row.get('description'),
                content=row['content'],
                category=row['category'],
                priority=row['priority'],
                is_active=row['is_active'],
                is_global=row['is_global'],
                auto_inject=row.get('auto_inject', False),
                trigger_keywords=row.get('trigger_keywords'),
                trigger_patterns=row.get('trigger_patterns'),
                context_conditions=row.get('context_conditions'),
                content_tokens=row.get('content_tokens'),
                created_at=row['created_at'],
                updated_at=row['updated_at'],
                last_used_at=row.get('last_used_at')
            ))
            total_tokens += row.get('content_tokens', 0) or 0

        return DAGADListResponse(entries=entries, total_count=len(entries), total_tokens=total_tokens)
    except Exception as e:
        logger.error(f"Error getting DAGAD entries for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve DAGAD entries")


@router.post("/", response_model=DAGADEntryResponse)
async def create_dagad_entry(
    entry_data: CreateDAGADEntryRequest,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    disable_check = os.getenv("DISABLE_DAGAD_CHECK", "true").lower() in ("1", "true", "yes", "on")
    if not disable_check:
        if not await is_enabled("dagad"):
            raise HTTPException(status_code=403, detail="This feature is not available at the moment.")

    try:
        client = await db.client
        insert_data = {
            'user_id': user_id,
            'title': entry_data.title,
            'description': entry_data.description,
            'content': entry_data.content,
            'category': entry_data.category,
            'priority': entry_data.priority,
            'is_global': entry_data.is_global,
            'auto_inject': entry_data.auto_inject,
            'trigger_keywords': entry_data.trigger_keywords or [],
            'trigger_patterns': entry_data.trigger_patterns or [],
            'context_conditions': entry_data.context_conditions or {}
        }
        result = await client.table('user_dagad_entries').insert(insert_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create DAGAD entry")
        row = result.data[0]
        return DAGADEntryResponse(
            entry_id=row['entry_id'],
            title=row['title'],
            description=row.get('description'),
            content=row['content'],
            category=row['category'],
            priority=row['priority'],
            is_active=row['is_active'],
            is_global=row['is_global'],
            auto_inject=row.get('auto_inject', False),
            trigger_keywords=row.get('trigger_keywords'),
            trigger_patterns=row.get('trigger_patterns'),
            context_conditions=row.get('context_conditions'),
            content_tokens=row.get('content_tokens'),
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            last_used_at=row.get('last_used_at')
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating DAGAD entry for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create DAGAD entry")


@router.put("/{entry_id}", response_model=DAGADEntryResponse)
async def update_dagad_entry(
    entry_id: str,
    entry_data: UpdateDAGADEntryRequest,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    disable_check = os.getenv("DISABLE_DAGAD_CHECK", "true").lower() in ("1", "true", "yes", "on")
    if not disable_check:
        if not await is_enabled("dagad"):
            raise HTTPException(status_code=403, detail="This feature is not available at the moment.")

    try:
        client = await db.client
        existing = await client.table('user_dagad_entries').select('entry_id').eq('entry_id', entry_id).eq('user_id', user_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="DAGAD entry not found")

        update_data = {}
        if entry_data.title is not None:
            update_data['title'] = entry_data.title
        if entry_data.description is not None:
            update_data['description'] = entry_data.description
        if entry_data.content is not None:
            update_data['content'] = entry_data.content
        if entry_data.category is not None:
            update_data['category'] = entry_data.category
        if entry_data.priority is not None:
            update_data['priority'] = entry_data.priority
        if entry_data.is_active is not None:
            update_data['is_active'] = entry_data.is_active
        if entry_data.is_global is not None:
            update_data['is_global'] = entry_data.is_global
        if entry_data.auto_inject is not None:
            update_data['auto_inject'] = entry_data.auto_inject
        if entry_data.trigger_keywords is not None:
            update_data['trigger_keywords'] = entry_data.trigger_keywords
        if entry_data.trigger_patterns is not None:
            update_data['trigger_patterns'] = entry_data.trigger_patterns
        if entry_data.context_conditions is not None:
            update_data['context_conditions'] = entry_data.context_conditions

        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        result = await client.table('user_dagad_entries').update(update_data).eq('entry_id', entry_id).eq('user_id', user_id).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update DAGAD entry")
        row = result.data[0]
        return DAGADEntryResponse(
            entry_id=row['entry_id'],
            title=row['title'],
            description=row.get('description'),
            content=row['content'],
            category=row['category'],
            priority=row['priority'],
            is_active=row['is_active'],
            is_global=row['is_global'],
            auto_inject=row.get('auto_inject', False),
            trigger_keywords=row.get('trigger_keywords'),
            trigger_patterns=row.get('trigger_patterns'),
            context_conditions=row.get('context_conditions'),
            content_tokens=row.get('content_tokens'),
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            last_used_at=row.get('last_used_at')
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating DAGAD entry {entry_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update DAGAD entry")


@router.delete("/{entry_id}")
async def delete_dagad_entry(
    entry_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    disable_check = os.getenv("DISABLE_DAGAD_CHECK", "true").lower() in ("1", "true", "yes", "on")
    if not disable_check:
        if not await is_enabled("dagad"):
            raise HTTPException(status_code=403, detail="This feature is not available at the moment.")

    try:
        client = await db.client
        result = await client.table('user_dagad_entries').delete().eq('entry_id', entry_id).eq('user_id', user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="DAGAD entry not found")
        return {"message": "DAGAD entry deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting DAGAD entry {entry_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete DAGAD entry")


@router.get("/{entry_id}", response_model=DAGADEntryResponse)
async def get_dagad_entry(
    entry_id: str,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    disable_check = os.getenv("DISABLE_DAGAD_CHECK", "true").lower() in ("1", "true", "yes", "on")
    if not disable_check:
        if not await is_enabled("dagad"):
            raise HTTPException(status_code=403, detail="This feature is not available at the moment.")

    try:
        client = await db.client
        result = await client.table('user_dagad_entries').select('*').eq('entry_id', entry_id).eq('user_id', user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="DAGAD entry not found")
        row = result.data[0]
        return DAGADEntryResponse(
            entry_id=row['entry_id'],
            title=row['title'],
            description=row.get('description'),
            content=row['content'],
            category=row['category'],
            priority=row['priority'],
            is_active=row['is_active'],
            is_global=row['is_global'],
            auto_inject=row.get('auto_inject', False),
            trigger_keywords=row.get('trigger_keywords'),
            trigger_patterns=row.get('trigger_patterns'),
            context_conditions=row.get('context_conditions'),
            content_tokens=row.get('content_tokens'),
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            last_used_at=row.get('last_used_at')
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting DAGAD entry {entry_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve DAGAD entry")


@router.post("/smart-context")
async def get_smart_dagad_context(
    request: SmartContextRequest,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    disable_check = os.getenv("DISABLE_DAGAD_CHECK", "true").lower() in ("1", "true", "yes", "on")
    if not disable_check:
        if not await is_enabled("dagad"):
            raise HTTPException(status_code=403, detail="This feature is not available at the moment.")

    try:
        client = await db.client
        result = await client.rpc('get_smart_user_dagad_context', {
            'p_user_id': user_id,
            'p_user_input': request.user_input,
            'p_thread_context': request.thread_context,
            'p_max_tokens': request.max_tokens
        }).execute()

        context = result.data if result.data else None
        return {
            "context": context,
            "max_tokens": request.max_tokens,
            "user_id": user_id,
            "has_context": context is not None
        }
    except Exception as e:
        logger.error(f"Error getting smart DAGAD context for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve smart DAGAD context")





@router.put("/{entry_id}", response_model=DAGADEntryResponse)

async def update_dagad_entry(

    entry_id: str,

    entry_data: UpdateDAGADEntryRequest,

    user_id: str = Depends(get_current_user_id_from_jwt)

):

    if not await is_enabled("dagad"):

        raise HTTPException(status_code=403, detail="This feature is not available at the moment.")



    try:

        client = await db.client

        existing = await client.table('user_dagad_entries').select('entry_id').eq('entry_id', entry_id).eq('user_id', user_id).execute()

        if not existing.data:

            raise HTTPException(status_code=404, detail="DAGAD entry not found")



        update_data = {}

        if entry_data.title is not None:

            update_data['title'] = entry_data.title

        if entry_data.description is not None:

            update_data['description'] = entry_data.description

        if entry_data.content is not None:

            update_data['content'] = entry_data.content

        if entry_data.category is not None:

            update_data['category'] = entry_data.category

        if entry_data.priority is not None:

            update_data['priority'] = entry_data.priority

        if entry_data.is_active is not None:

            update_data['is_active'] = entry_data.is_active

        if entry_data.is_global is not None:

            update_data['is_global'] = entry_data.is_global

        if entry_data.auto_inject is not None:

            update_data['auto_inject'] = entry_data.auto_inject

        if entry_data.trigger_keywords is not None:

            update_data['trigger_keywords'] = entry_data.trigger_keywords

        if entry_data.trigger_patterns is not None:

            update_data['trigger_patterns'] = entry_data.trigger_patterns

        if entry_data.context_conditions is not None:

            update_data['context_conditions'] = entry_data.context_conditions



        if not update_data:

            raise HTTPException(status_code=400, detail="No fields to update")



        result = await client.table('user_dagad_entries').update(update_data).eq('entry_id', entry_id).eq('user_id', user_id).execute()

        if not result.data:

            raise HTTPException(status_code=500, detail="Failed to update DAGAD entry")

        row = result.data[0]

        return DAGADEntryResponse(

            entry_id=row['entry_id'],

            title=row['title'],

            description=row.get('description'),

            content=row['content'],

            category=row['category'],

            priority=row['priority'],

            is_active=row['is_active'],

            is_global=row['is_global'],

            auto_inject=row.get('auto_inject', False),

            trigger_keywords=row.get('trigger_keywords'),

            trigger_patterns=row.get('trigger_patterns'),

            context_conditions=row.get('context_conditions'),

            content_tokens=row.get('content_tokens'),

            created_at=row['created_at'],

            updated_at=row['updated_at'],

            last_used_at=row.get('last_used_at')

        )

    except HTTPException:

        raise

    except Exception as e:

        logger.error(f"Error updating DAGAD entry {entry_id}: {e}")

        raise HTTPException(status_code=500, detail="Failed to update DAGAD entry")





@router.delete("/{entry_id}")

async def delete_dagad_entry(

    entry_id: str,

    user_id: str = Depends(get_current_user_id_from_jwt)

):

    if not await is_enabled("dagad"):

        raise HTTPException(status_code=403, detail="This feature is not available at the moment.")



    try:

        client = await db.client

        result = await client.table('user_dagad_entries').delete().eq('entry_id', entry_id).eq('user_id', user_id).execute()

        if not result.data:

            raise HTTPException(status_code=404, detail="DAGAD entry not found")

        return {"message": "DAGAD entry deleted successfully"}

    except HTTPException:

        raise

    except Exception as e:

        logger.error(f"Error deleting DAGAD entry {entry_id}: {e}")

        raise HTTPException(status_code=500, detail="Failed to delete DAGAD entry")





@router.get("/{entry_id}", response_model=DAGADEntryResponse)

async def get_dagad_entry(

    entry_id: str,

    user_id: str = Depends(get_current_user_id_from_jwt)

):

    if not await is_enabled("dagad"):

        raise HTTPException(status_code=403, detail="This feature is not available at the moment.")



    try:

        client = await db.client

        result = await client.table('user_dagad_entries').select('*').eq('entry_id', entry_id).eq('user_id', user_id).execute()

        if not result.data:

            raise HTTPException(status_code=404, detail="DAGAD entry not found")

        row = result.data[0]

        return DAGADEntryResponse(

            entry_id=row['entry_id'],

            title=row['title'],

            description=row.get('description'),

            content=row['content'],

            category=row['category'],

            priority=row['priority'],

            is_active=row['is_active'],

            is_global=row['is_global'],

            auto_inject=row.get('auto_inject', False),

            trigger_keywords=row.get('trigger_keywords'),

            trigger_patterns=row.get('trigger_patterns'),

            context_conditions=row.get('context_conditions'),

            content_tokens=row.get('content_tokens'),

            created_at=row['created_at'],

            updated_at=row['updated_at'],

            last_used_at=row.get('last_used_at')

        )

    except HTTPException:

        raise

    except Exception as e:

        logger.error(f"Error getting DAGAD entry {entry_id}: {e}")

        raise HTTPException(status_code=500, detail="Failed to retrieve DAGAD entry")





@router.post("/smart-context")

async def get_smart_dagad_context(

    request: SmartContextRequest,

    user_id: str = Depends(get_current_user_id_from_jwt)

):

    if not await is_enabled("dagad"):

        raise HTTPException(status_code=403, detail="This feature is not available at the moment.")



    try:

        client = await db.client

        result = await client.rpc('get_smart_user_dagad_context', {

            'p_user_id': user_id,

            'p_user_input': request.user_input,

            'p_thread_context': request.thread_context,

            'p_max_tokens': request.max_tokens

        }).execute()



        context = result.data if result.data else None

        return {

            "context": context,

            "max_tokens": request.max_tokens,

            "user_id": user_id,

            "has_context": context is not None

        }

    except Exception as e:

        logger.error(f"Error getting smart DAGAD context for user {user_id}: {e}")

        raise HTTPException(status_code=500, detail="Failed to retrieve smart DAGAD context")






