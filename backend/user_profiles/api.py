from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from services.supabase import DBConnection
from utils.auth_utils import get_current_user_id_from_jwt
from utils.logger import logger

router = APIRouter()

class UserProfileCreate(BaseModel):
    full_name: str
    preferred_name: str
    work_description: str
    personal_references: Optional[str] = None
    avatar: Optional[str] = None

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    preferred_name: Optional[str] = None
    work_description: Optional[str] = None
    personal_references: Optional[str] = None
    avatar: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    preferred_name: str
    work_description: str
    personal_references: Optional[str] = None
    avatar: Optional[str] = None
    created_at: datetime
    updated_at: datetime

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: str = Depends(get_current_user_id_from_jwt),
    db: DBConnection = Depends(lambda: DBConnection())
):
    """Get the current user's profile."""
    try:
        client = await db.client
        result = await client.table('user_profiles').select('*').eq('user_id', user_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return UserProfileResponse(**result.data[0])
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch user profile")

@router.post("/profile", response_model=UserProfileResponse)
async def create_user_profile(
    profile_data: UserProfileCreate,
    user_id: str = Depends(get_current_user_id_from_jwt),
    db: DBConnection = Depends(lambda: DBConnection())
):
    """Create a new user profile."""
    try:
        logger.info(f"Creating user profile for user {user_id}")
        logger.info(f"Profile data: {profile_data}")
        
        client = await db.client
        logger.info("Database client obtained")
        
        # Check if profile already exists
        try:
            existing = await client.table('user_profiles').select('id').eq('user_id', user_id).execute()
            logger.info(f"Existing profile check result: {existing}")
            if existing.data and len(existing.data) > 0:
                raise HTTPException(status_code=409, detail="User profile already exists")
        except Exception as e:
            logger.warning(f"Could not check for existing profile: {e}")
            # Continue without the check for now
        
        # Create new profile
        profile_record = {
            'user_id': user_id,
            'full_name': profile_data.full_name.strip(),
            'preferred_name': profile_data.preferred_name.strip(),
            'work_description': profile_data.work_description,
            'personal_references': profile_data.personal_references.strip() if profile_data.personal_references else None,
            'avatar': profile_data.avatar
        }
        
        logger.info(f"Attempting to insert profile record: {profile_record}")
        
        # Try to insert the profile
        try:
            # Simple insert without chaining
            insert_result = await client.table('user_profiles').insert(profile_record).execute()
            logger.info(f"Insert result: {insert_result}")
            
            if not insert_result.data or len(insert_result.data) == 0:
                raise HTTPException(status_code=500, detail="Failed to create user profile")
            
            # Get the created profile ID
            created_profile_id = insert_result.data[0]['id']
            logger.info(f"Created profile with ID: {created_profile_id}")
            
            # Now fetch the complete profile
            fetch_result = await client.table('user_profiles').select('*').eq('id', created_profile_id).execute()
            
            if not fetch_result.data or len(fetch_result.data) == 0:
                raise HTTPException(status_code=500, detail="Failed to fetch created profile")
            
            created_profile_data = fetch_result.data[0]
            logger.info(f"Created user profile for user {user_id}")
            return UserProfileResponse(**created_profile_data)
            
        except Exception as e:
            logger.error(f"Insert failed: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to create user profile: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create user profile: {str(e)}")

@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_data: UserProfileUpdate,
    user_id: str = Depends(get_current_user_id_from_jwt),
    db: DBConnection = Depends(lambda: DBConnection())
):
    """Update the current user's profile."""
    try:
        logger.info(f"Updating user profile for user {user_id}")
        logger.info(f"Update data received: {profile_data}")
        
        client = await db.client
        logger.info("Database client obtained")
        
        # Check if profile exists
        existing = await client.table('user_profiles').select('*').eq('user_id', user_id).execute()
        logger.info(f"Existing profile check result: {existing}")
        
        if not existing.data or len(existing.data) == 0:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        # Prepare update data (only include non-None values)
        update_data = {}
        if profile_data.full_name is not None:
            update_data['full_name'] = profile_data.full_name.strip()
        if profile_data.preferred_name is not None:
            update_data['preferred_name'] = profile_data.preferred_name.strip()
        if profile_data.work_description is not None:
            update_data['work_description'] = profile_data.work_description
        if profile_data.personal_references is not None:
            update_data['personal_references'] = profile_data.personal_references.strip()
        if profile_data.avatar is not None:
            update_data['avatar'] = profile_data.avatar
        
        logger.info(f"Prepared update data: {update_data}")
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Update profile
        logger.info(f"Executing update query with data: {update_data}")
        
        # First update the profile
        update_result = await client.table('user_profiles').update(update_data).eq('user_id', user_id).execute()
        logger.info(f"Update result: {update_result}")
        
        if not update_result.data or len(update_result.data) == 0:
            logger.error("Update result has no data")
            raise HTTPException(status_code=500, detail="Failed to update user profile")
        
        # Now fetch the updated profile
        fetch_result = await client.table('user_profiles').select('*').eq('user_id', user_id).execute()
        logger.info(f"Fetch result: {fetch_result}")
        
        if not fetch_result.data or len(fetch_result.data) == 0:
            logger.error("Failed to fetch updated profile")
            raise HTTPException(status_code=500, detail="Failed to fetch updated profile")
        
        logger.info(f"Successfully updated user profile for user {user_id}")
        return UserProfileResponse(**fetch_result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update user profile: {str(e)}")

@router.delete("/profile")
async def delete_user_profile(
    user_id: str = Depends(get_current_user_id_from_jwt),
    db: DBConnection = Depends(lambda: DBConnection())
):
    """Delete the current user's profile."""
    try:
        client = await db.client
        
        result = await client.table('user_profiles').delete().eq('user_id', user_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        logger.info(f"Deleted user profile for user {user_id}")
        return {"message": "User profile deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete user profile")

@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify the router is working."""
    return {"message": "User profiles API is working!"}

@router.get("/test-db")
async def test_database():
    """Test endpoint to verify database connectivity."""
    try:
        db = DBConnection()
        client = await db.client
        
        # Test if we can access the user_profiles table
        try:
            result = await client.table('user_profiles').select('*').limit(1).execute()
            logger.info(f"Database test result: {result}")
            
            return {
                "message": "Database connection successful",
                "table_exists": True,
                "result": str(result)
            }
        except Exception as e:
            logger.error(f"Table access test failed: {e}")
            return {
                "message": "Database connection successful but table access failed",
                "table_exists": False,
                "error": str(e)
            }
    except Exception as e:
        logger.error(f"Database test failed: {e}", exc_info=True)
        return {
            "message": "Database connection failed",
            "error": str(e),
            "table_exists": False
        }

@router.get("/test-schema")
async def test_schema():
    """Test endpoint to verify table schema."""
    try:
        db = DBConnection()
        client = await db.client
        
        # Test if we can access the user_profiles table and check columns
        try:
            # First, try to get a sample record to see the structure
            result = await client.table('user_profiles').select('*').limit(1).execute()
            logger.info(f"Schema test result: {result}")
            
            if result.data and len(result.data) > 0:
                sample_record = result.data[0]
                columns = list(sample_record.keys())
                
                return {
                    "message": "Schema check successful",
                    "table_exists": True,
                    "columns": columns,
                    "has_avatar": 'avatar' in columns,
                    "sample_record": sample_record
                }
            else:
                return {
                    "message": "Table exists but no data",
                    "table_exists": True,
                    "columns": [],
                    "has_avatar": False,
                    "sample_record": None
                }
                
        except Exception as e:
            logger.error(f"Schema check failed: {e}")
            return {
                "message": "Schema check failed",
                "table_exists": False,
                "error": str(e)
            }
    except Exception as e:
        logger.error(f"Schema test failed: {e}", exc_info=True)
        return {
            "message": "Schema test failed",
            "error": str(e),
            "table_exists": False
        }

@router.get("/test-avatar")
async def test_avatar():
    """Test endpoint to verify avatar field functionality."""
    try:
        db = DBConnection()
        client = await db.client
        
        # Test if we can insert and retrieve avatar data
        try:
            test_user_id = '123e4567-e89b-12d3-a456-426614174000'  # Dummy UUID
            
            # Test insert with avatar
            test_record = {
                'user_id': test_user_id,
                'full_name': 'Test User',
                'preferred_name': 'Test',
                'work_description': 'Engineering',
                'avatar': '{"colors": ["#0a0310", "#80007b", "#455bff", "#ffff45", "#96ff45"], "variant": "beam"}'
            }
            
            logger.info("Testing avatar insert functionality...")
            
            # Try the insert
            insert_result = await client.table('user_profiles').insert(test_record).execute()
            logger.info(f"Avatar test insert result: {insert_result}")
            
            if insert_result.data and len(insert_result.data) > 0:
                # Test fetch with avatar
                fetch_result = await client.table('user_profiles').select('*').eq('user_id', test_user_id).execute()
                logger.info(f"Avatar test fetch result: {fetch_result}")
                
                # Clean up test data
                await client.table('user_profiles').delete().eq('user_id', test_user_id).execute()
                
                return {
                    "message": "Avatar functionality test successful",
                    "insert_worked": True,
                    "fetch_worked": True,
                    "avatar_field_accessible": True
                }
            else:
                return {
                    "message": "Avatar insert test failed",
                    "insert_worked": False,
                    "fetch_worked": False,
                    "avatar_field_accessible": False
                }
                
        except Exception as e:
            logger.error(f"Avatar functionality test failed: {e}")
            return {
                "message": "Avatar functionality test failed",
                "error": str(e),
                "insert_worked": False,
                "fetch_worked": False,
                "avatar_field_accessible": False
            }
    except Exception as e:
        logger.error(f"Avatar test failed: {e}", exc_info=True)
        return {
            "message": "Avatar test failed",
            "error": str(e),
            "insert_worked": False,
            "fetch_worked": False,
            "avatar_field_accessible": False
        }

@router.get("/test-insert")
async def test_insert():
    """Test endpoint to verify insert functionality."""
    try:
        db = DBConnection()
        client = await db.client
        
        # Test simple insert with a valid UUID format
        test_record = {
            'user_id': '123e4567-e89b-12d3-a456-426614174000',  # Valid UUID format
            'full_name': 'Test User',
            'preferred_name': 'Test',
            'work_description': 'Engineering'
        }
        
        logger.info("Testing insert functionality...")
        
        # Try the insert
        insert_result = await client.table('user_profiles').insert(test_record).execute()
        logger.info(f"Test insert result: {insert_result}")
        
        return {
            "message": "Insert test successful",
            "result": str(insert_result)
        }
        
    except Exception as e:
        logger.error(f"Insert test failed: {e}", exc_info=True)
        return {
            "message": "Insert test failed",
            "error": str(e),
            "error_type": type(e).__name__
        }
