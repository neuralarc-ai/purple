from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from pydantic import BaseModel, Field

from utils.auth_utils import get_current_user_id_from_jwt
from services.supabase import DBConnection
from utils.logger import logger
from flags.flags import is_enabled
from dagad.storage_provider import get_storage
import os


router = APIRouter(prefix="/dagad", tags=["dagad"])


class DAGADEntry(BaseModel):
    entry_id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    image_alt_text: Optional[str] = None
    image_metadata: Optional[dict] = None
    # File support
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    file_mime_type: Optional[str] = None
    file_metadata: Optional[dict] = None
    source_type: Optional[str] = None
    category: str = Field(default="general", pattern="^(instructions|preferences|rules|notes|general)$")
    priority: int = Field(default=1, ge=1, le=3)
    is_active: bool = True
    is_global: bool = False
    auto_inject: bool = False
    trigger_keywords: Optional[List[str]] = None
    trigger_patterns: Optional[List[str]] = None
    context_conditions: Optional[dict] = None
    # Folder association
    folder_id: Optional[str] = None


class DAGADEntryResponse(BaseModel):
    entry_id: str
    title: str
    description: Optional[str]
    content: Optional[str]
    image_url: Optional[str]
    image_alt_text: Optional[str]
    image_metadata: Optional[dict]
    # File fields
    file_url: Optional[str]
    file_name: Optional[str]
    file_size: Optional[int]
    file_mime_type: Optional[str]
    file_metadata: Optional[dict]
    source_type: Optional[str]
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
    # Folder association
    folder_id: Optional[str]


class DAGADListResponse(BaseModel):
    entries: List[DAGADEntryResponse]
    total_count: int
    total_tokens: int


class CreateDAGADEntryRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    image_alt_text: Optional[str] = None
    image_metadata: Optional[dict] = None
    # File support
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    file_mime_type: Optional[str] = None
    file_metadata: Optional[dict] = None
    source_type: Optional[str] = None
    category: str = Field(default="general", pattern="^(instructions|preferences|rules|notes|general)$")
    priority: int = Field(default=1, ge=1, le=3)
    is_global: bool = False
    auto_inject: bool = False
    trigger_keywords: Optional[List[str]] = None
    trigger_patterns: Optional[List[str]] = None
    context_conditions: Optional[dict] = None
    folder_id: Optional[str] = None


class UpdateDAGADEntryRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    content: Optional[str] = None
    image_url: Optional[str] = None
    image_alt_text: Optional[str] = None
    image_metadata: Optional[dict] = None
    # File support
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    file_mime_type: Optional[str] = None
    file_metadata: Optional[dict] = None
    source_type: Optional[str] = None
    category: Optional[str] = Field(None, pattern="^(instructions|preferences|rules|notes|general)$")
    priority: Optional[int] = Field(None, ge=1, le=3)
    is_active: Optional[bool] = None
    is_global: Optional[bool] = None
    auto_inject: Optional[bool] = None
    trigger_keywords: Optional[List[str]] = None
    trigger_patterns: Optional[List[str]] = None
    context_conditions: Optional[dict] = None
    folder_id: Optional[str] = None


# Folder models
class DAGADFolder(BaseModel):
    folder_id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=100)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class DAGADFolderListResponse(BaseModel):
    folders: List[DAGADFolder]


class SmartContextRequest(BaseModel):
    user_input: str
    thread_context: Optional[str] = None
    max_tokens: int = 2000


class ImageUploadRequest(BaseModel):
    base64_data: str = Field(..., min_length=1)
    alt_text: Optional[str] = None
    metadata: Optional[dict] = None


# Global database connection - will be initialized by main app
db = None

def initialize(database: DBConnection):
    """Initialize the DAGAD API with database connection"""
    global db
    db = database
    logger.debug("DAGAD API initialized with database connection")

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
        if db is None:
            raise HTTPException(status_code=500, detail="DAGAD API not initialized")
            
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
                content=row.get('content'),
                image_url=row.get('image_url'),
                image_alt_text=row.get('image_alt_text'),
                image_metadata=row.get('image_metadata'),
                # File mapping
                file_url=row.get('file_url'),
                file_name=row.get('file_name'),
                file_size=row.get('file_size'),
                file_mime_type=row.get('file_mime_type'),
                file_metadata=row.get('file_metadata'),
                source_type=row.get('source_type'),
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
                last_used_at=row.get('last_used_at'),
                folder_id=row.get('folder_id')
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
            'image_url': entry_data.image_url,
            'image_alt_text': entry_data.image_alt_text,
            'image_metadata': entry_data.image_metadata or {},
            # File fields
            'file_url': entry_data.file_url,
            'file_name': entry_data.file_name,
            'file_size': entry_data.file_size,
            'file_mime_type': entry_data.file_mime_type,
            'file_metadata': entry_data.file_metadata or {},
            'source_type': entry_data.source_type,
            'category': entry_data.category,
            'priority': entry_data.priority,
            'is_global': entry_data.is_global,
            'auto_inject': entry_data.auto_inject,
            'trigger_keywords': entry_data.trigger_keywords or [],
            'trigger_patterns': entry_data.trigger_patterns or [],
            'context_conditions': entry_data.context_conditions or {}
        }
        if entry_data.folder_id is not None:
            insert_data['folder_id'] = entry_data.folder_id
        result = await client.table('user_dagad_entries').insert(insert_data).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create DAGAD entry")
        row = result.data[0]
        return DAGADEntryResponse(
            entry_id=row['entry_id'],
            title=row['title'],
            description=row.get('description'),
            content=row.get('content'),
            image_url=row.get('image_url'),
            image_alt_text=row.get('image_alt_text'),
            image_metadata=row.get('image_metadata'),
            file_url=row.get('file_url'),
            file_name=row.get('file_name'),
            file_size=row.get('file_size'),
            file_mime_type=row.get('file_mime_type'),
            file_metadata=row.get('file_metadata'),
            source_type=row.get('source_type'),
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
            last_used_at=row.get('last_used_at'),
            folder_id=row.get('folder_id')
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating DAGAD entry for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create DAGAD entry")


@router.post("/upload-image")
async def upload_dagad_image(
    request: ImageUploadRequest,
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Upload an image for DAGAD entries and return the URL."""
    disable_check = os.getenv("DISABLE_DAGAD_CHECK", "true").lower() in ("1", "true", "yes", "on")
    if not disable_check:
        if not await is_enabled("dagad"):
            raise HTTPException(status_code=403, detail="This feature is not available at the moment.")

    try:
        storage = get_storage()
        image_url = await storage.upload_base64_image(request.base64_data, path_prefix="images/")
        return {
            "image_url": image_url,
            "alt_text": request.alt_text,
            "metadata": request.metadata or {}
        }
    except Exception as e:
        logger.error(f"Error uploading DAGAD image for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")


@router.post("/upload-file")
async def upload_dagad_file(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id_from_jwt)
):
    """Upload an arbitrary file for DAGAD entries and return its public URL and metadata.
    Uses the 'dagad-images' bucket for now to avoid extra setup."""
    disable_check = os.getenv("DISABLE_DAGAD_CHECK", "true").lower() in ("1", "true", "yes", "on")
    if not disable_check:
        if not await is_enabled("dagad"):
            raise HTTPException(status_code=403, detail="This feature is not available at the moment.")

    try:
        storage = get_storage()
        # Read file bytes
        contents = await file.read()

        # Enforce max file size (50 MB)
        MAX_FILE_MB = 50
        if len(contents) > MAX_FILE_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File size exceeds {MAX_FILE_MB}MB limit")
        # Generate a unique path
        import uuid, datetime
        unique_id = str(uuid.uuid4())
        ts = datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"files/{ts}_{unique_id}_{file.filename}"
        content_type = file.content_type or "application/octet-stream"

        # Upload to external storage via provider
        public_url = await storage.upload_bytes(filename, contents, content_type)

        return {
            "file_url": public_url,
            "file_name": file.filename,
            "file_size": len(contents),
            "file_mime_type": content_type,
            "file_metadata": {},
            "bucket": None,
            "path": filename
        }
    except Exception as e:
        logger.error(f"Error uploading DAGAD file for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file")


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
        if entry_data.image_url is not None:
            update_data['image_url'] = entry_data.image_url
        if entry_data.image_alt_text is not None:
            update_data['image_alt_text'] = entry_data.image_alt_text
        if entry_data.image_metadata is not None:
            update_data['image_metadata'] = entry_data.image_metadata
        # File fields
        if entry_data.file_url is not None:
            update_data['file_url'] = entry_data.file_url
        if entry_data.file_name is not None:
            update_data['file_name'] = entry_data.file_name
        if entry_data.file_size is not None:
            update_data['file_size'] = entry_data.file_size
        if entry_data.file_mime_type is not None:
            update_data['file_mime_type'] = entry_data.file_mime_type
        if entry_data.file_metadata is not None:
            update_data['file_metadata'] = entry_data.file_metadata
        if entry_data.source_type is not None:
            update_data['source_type'] = entry_data.source_type
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
        if entry_data.folder_id is not None:
            update_data['folder_id'] = entry_data.folder_id

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
            content=row.get('content'),
            image_url=row.get('image_url'),
            image_alt_text=row.get('image_alt_text'),
            image_metadata=row.get('image_metadata'),
            file_url=row.get('file_url'),
            file_name=row.get('file_name'),
            file_size=row.get('file_size'),
            file_mime_type=row.get('file_mime_type'),
            file_metadata=row.get('file_metadata'),
            source_type=row.get('source_type'),
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
            last_used_at=row.get('last_used_at'),
            folder_id=row.get('folder_id')
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


# Folder endpoints (minimal CRUD) - MUST come before parameterized routes
@router.get("/folders", response_model=DAGADFolderListResponse)
async def list_folders(user_id: str = Depends(get_current_user_id_from_jwt)):
    try:
        if db is None:
            raise HTTPException(status_code=500, detail="DAGAD API not initialized")
        
        logger.info(f"📁 Listing folders for user_id: {user_id}")
        client = await db.client
        
        # First, let's check what folders exist in the database
        all_folders_result = await client.table('user_dagad_folders').select('*').execute()
        logger.info(f"📊 All folders in database: {all_folders_result.data}")
        
        # Now query for the specific user
        result = await client.table('user_dagad_folders').select('*').eq('user_id', user_id).order('created_at', desc=False).execute()
        logger.info(f"📊 Found {len(result.data or [])} folders for user {user_id}")
        logger.info(f"📊 User's folders: {result.data}")
        
        if result.data is None:
            logger.warning(f"⚠️ No data returned from query")
            return DAGADFolderListResponse(folders=[])
            
        folders = [DAGADFolder(folder_id=row['folder_id'], name=row['name'], created_at=row.get('created_at'), updated_at=row.get('updated_at')) for row in (result.data or [])]
        logger.info(f"📁 Processed folders: {folders}")
        return DAGADFolderListResponse(folders=folders)
    except Exception as e:
        logger.error(f"❌ Error listing DAGAD folders for user {user_id}: {e}")
        logger.error(f"❌ Error type: {type(e)}")
        logger.error(f"❌ Error details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve folders: {str(e)}")


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
            content=row.get('content'),
            image_url=row.get('image_url'),
            image_alt_text=row.get('image_alt_text'),
            image_metadata=row.get('image_metadata'),
            file_url=row.get('file_url'),
            file_name=row.get('file_name'),
            file_size=row.get('file_size'),
            file_mime_type=row.get('file_mime_type'),
            file_metadata=row.get('file_metadata'),
            source_type=row.get('source_type'),
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
            last_used_at=row.get('last_used_at'),
            folder_id=row.get('folder_id')
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


class CreateFolderRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


@router.post("/folders", response_model=DAGADFolder)
async def create_folder(req: CreateFolderRequest, user_id: str = Depends(get_current_user_id_from_jwt)):
    try:
        client = await db.client
        insert = { 'user_id': user_id, 'name': req.name }
        result = await client.table('user_dagad_folders').insert(insert).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create folder")
        row = result.data[0]
        return DAGADFolder(folder_id=row['folder_id'], name=row['name'], created_at=row.get('created_at'), updated_at=row.get('updated_at'))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating DAGAD folder for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create folder")


class UpdateFolderRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


@router.put("/folders/{folder_id}", response_model=DAGADFolder)
async def rename_folder(folder_id: str, req: UpdateFolderRequest, user_id: str = Depends(get_current_user_id_from_jwt)):
    try:
        client = await db.client
        result = await client.table('user_dagad_folders').update({ 'name': req.name }).eq('folder_id', folder_id).eq('user_id', user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Folder not found")
        row = result.data[0]
        return DAGADFolder(folder_id=row['folder_id'], name=row['name'], created_at=row.get('created_at'), updated_at=row.get('updated_at'))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error renaming DAGAD folder {folder_id} for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to rename folder")


@router.delete("/folders/{folder_id}")
async def delete_folder(folder_id: str, user_id: str = Depends(get_current_user_id_from_jwt)):
    try:
        client = await db.client
        # Optionally set folder_id=null on entries within the folder
        await client.table('user_dagad_entries').update({ 'folder_id': None }).eq('folder_id', folder_id).eq('user_id', user_id).execute()
        result = await client.table('user_dagad_folders').delete().eq('folder_id', folder_id).eq('user_id', user_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Folder not found")
        return { 'message': 'Folder deleted' }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting DAGAD folder {folder_id} for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete folder")