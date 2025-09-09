from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from services.supabase import DBConnection
from utils.auth_utils import get_current_user_id_from_jwt
from utils.logger import logger
from services.email_service import email_service

router = APIRouter()

class UserProfileCreate(BaseModel):
    full_name: str
    preferred_name: str
    work_description: str
    personal_references: Optional[str] = None
    avatar_url: Optional[str] = None

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    preferred_name: Optional[str] = None
    work_description: Optional[str] = None
    personal_references: Optional[str] = None
    avatar_url: Optional[str] = None

class OnboardingData(BaseModel):
    terms_accepted: bool
    privacy_accepted: bool
    display_name: str
    role: str
    referral_source: str

class OnboardingResponse(BaseModel):
    success: bool
    message: str
    profile_id: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    preferred_name: str
    work_description: str
    personal_references: Optional[str] = None
    avatar_url: Optional[str] = None
    referral_source: Optional[str] = None
    consent_given: Optional[bool] = None
    consent_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: str = Depends(get_current_user_id_from_jwt),
    db: DBConnection = Depends(lambda: DBConnection())
):
    """Get the current user's profile."""
    try:
        logger.info(f"Fetching user profile for user_id: {user_id}")
        
        client = await db.client
        logger.info("Database client obtained successfully")
        
        result = await client.table('user_profiles').select('*').eq('user_id', user_id).execute()
        logger.info(f"Database query executed, found {len(result.data) if result.data else 0} records")
        
        if not result.data or len(result.data) == 0:
            logger.info(f"No profile found for user_id: {user_id}")
            raise HTTPException(status_code=404, detail="User profile not found")
        
        profile_data = result.data[0]
        logger.info(f"Profile found for user_id: {user_id}, profile_id: {profile_data.get('id')}")
        
        return UserProfileResponse(**profile_data)
    except HTTPException:
        # Re-raise HTTP exceptions as they are
        raise
    except Exception as e:
        logger.error(f"Error fetching user profile for user_id {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch user profile: {str(e)}")

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
            'avatar_url': profile_data.avatar_url
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
        if profile_data.avatar_url is not None:
            update_data['avatar_url'] = profile_data.avatar_url
        
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

@router.post("/onboarding", response_model=OnboardingResponse)
async def complete_onboarding(
    onboarding_data: OnboardingData,
    request: Request,
    user_id: str = Depends(get_current_user_id_from_jwt),
    db: DBConnection = Depends(lambda: DBConnection())
):
    """Complete the onboarding process and create user profile."""
    try:
        logger.info(f"Completing onboarding for user {user_id}")
        
        # Validate required fields
        if not onboarding_data.terms_accepted or not onboarding_data.privacy_accepted:
            raise HTTPException(status_code=400, detail="Terms and Privacy Policy must be accepted")
        
        if not onboarding_data.display_name.strip():
            raise HTTPException(status_code=400, detail="Display name is required")
        
        if not onboarding_data.role:
            raise HTTPException(status_code=400, detail="Role is required")
        
        if not onboarding_data.referral_source:
            raise HTTPException(status_code=400, detail="Referral source is required")
        
        client = await db.client
        
        # Check if profile already exists
        existing = await client.table('user_profiles').select('id').eq('user_id', user_id).execute()
        if existing.data and len(existing.data) > 0:
            # Update existing profile with onboarding data
            profile_record = {
                'preferred_name': onboarding_data.display_name.strip(),
                'work_description': onboarding_data.role,
                'referral_source': onboarding_data.referral_source,
                'consent_given': True,
                'consent_date': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            update_result = await client.table('user_profiles').update(profile_record).eq('user_id', user_id).execute()
            
            if not update_result.data or len(update_result.data) == 0:
                raise HTTPException(status_code=500, detail="Failed to update user profile")
            
            profile_id = update_result.data[0]['id']
            logger.info(f"Updated existing profile {profile_id} with onboarding data")
            
        else:
            # Create new profile with onboarding data
            profile_record = {
                'user_id': user_id,
                'full_name': onboarding_data.display_name.strip(),  # Use display name as full name initially
                'preferred_name': onboarding_data.display_name.strip(),
                'work_description': onboarding_data.role,
                'referral_source': onboarding_data.referral_source,
                'consent_given': True,
                'consent_date': datetime.utcnow().isoformat()
            }
            
            insert_result = await client.table('user_profiles').insert(profile_record).execute()
            
            if not insert_result.data or len(insert_result.data) == 0:
                raise HTTPException(status_code=500, detail="Failed to create user profile")
            
            profile_id = insert_result.data[0]['id']
            logger.info(f"Created new profile {profile_id} with onboarding data")
            
            # Send welcome email for new users
            try:
                # Get user email from JWT token
                user_email = None
                try:
                    import jwt
                    # Extract email from the user_id (which is actually the JWT token)
                    # This is a simplified approach - in production, you might want to pass the token explicitly
                    auth_header = request.headers.get('Authorization')
                    if auth_header and auth_header.startswith('Bearer '):
                        token = auth_header.split(' ')[1]
                        payload = jwt.decode(token, options={"verify_signature": False})
                        user_email = payload.get('email')
                except Exception as e:
                    logger.warning(f"Could not extract email from JWT for user {user_id}: {e}")
                
                if user_email:
                    email_result = email_service.send_welcome_email(
                        user_email=user_email,
                        user_name=onboarding_data.display_name.strip()
                    )
                    
                    if email_result['success']:
                        logger.info(f"Welcome email sent successfully to {user_email} via {email_result.get('provider', 'unknown')}")
                    else:
                        logger.warning(f"Failed to send welcome email to {user_email}: {email_result.get('error', 'Unknown error')}")
                else:
                    logger.warning(f"No email found for user {user_id}, welcome email not sent")
            except Exception as email_error:
                logger.error(f"Error sending welcome email for user {user_id}: {str(email_error)}")
                # Don't fail onboarding if email fails
        
        return OnboardingResponse(
            success=True,
            message="Onboarding completed successfully",
            profile_id=profile_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing onboarding: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to complete onboarding: {str(e)}")

@router.post("/test-email")
async def test_email(request: Request):
    """Test endpoint to verify email functionality."""
    try:
        # Extract user email from JWT token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return {"error": "No Bearer token found"}
        
        token = auth_header.split(' ')[1]
        import jwt
        payload = jwt.decode(token, options={"verify_signature": False})
        user_email = payload.get('email')
        
        if not user_email:
            return {"error": "Could not extract email from JWT"}
        
        # Test welcome email sending
        test_name = "Test User"
        
        email_result = email_service.send_welcome_email(user_email, test_name)
        
        if email_result['success']:
            logger.info(f"Test welcome email sent successfully to {user_email}")
            return {
                "success": True,
                "message": "Test welcome email sent successfully",
                "email": user_email,
                "provider": email_result.get('provider', 'unknown')
            }
        else:
            logger.error(f"Failed to send test welcome email to {user_email}")
            return {
                "success": False,
                "message": "Failed to send test welcome email",
                "email": user_email,
                "error": email_result.get('error', 'Unknown error'),
                "note": "Check email provider configuration in .env file"
            }
        
    except Exception as e:
        logger.error(f"Test email error: {e}")
        return {
            "success": False,
            "error": str(e)
        }
    """Test endpoint to debug authentication issues."""
    try:
        auth_header = request.headers.get('Authorization')
        logger.info(f"Auth header: {auth_header}")
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return {"error": "No Bearer token found", "auth_header": auth_header}
        
        token = auth_header.split(' ')[1]
        logger.info(f"Token (first 20 chars): {token[:20]}...")
        
        try:
            import jwt
            payload = jwt.decode(token, options={"verify_signature": False})
            logger.info(f"JWT payload: {payload}")
            
            user_id = payload.get('sub')
            if user_id:
                return {
                    "success": True,
                    "user_id": user_id,
                    "payload": payload
                }
            else:
                return {
                    "error": "No 'sub' field in payload",
                    "payload": payload
                }
        except Exception as e:
            logger.error(f"JWT decode error: {e}")
            return {
                "error": f"JWT decode failed: {str(e)}",
                "token_preview": token[:50] + "..." if len(token) > 50 else token
            }
            
    except Exception as e:
        logger.error(f"Test auth error: {e}")
        return {"error": f"Test auth failed: {str(e)}"}

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "user_profiles"}

@router.get("/test-auth")
async def test_auth(user_id: str = Depends(get_current_user_id_from_jwt)):
    """Test endpoint to verify authentication is working."""
    return {"message": "Authentication successful", "user_id": user_id}

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
                    "has_avatar_url": 'avatar_url' in columns,
                    "sample_record": sample_record
                }
            else:
                return {
                    "message": "Table exists but no data",
                    "table_exists": True,
                    "columns": [],
                    "has_avatar_url": False,
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
    """Test endpoint to verify avatar_url field functionality."""
    try:
        db = DBConnection()
        client = await db.client
        
        # Test if we can insert and retrieve avatar_url data
        try:
            test_user_id = '123e4567-e89b-12d3-a456-426614174000'  # Dummy UUID
            
            # Test insert with avatar_url
            test_record = {
                'user_id': test_user_id,
                'full_name': 'Test User',
                'preferred_name': 'Test',
                'work_description': 'Engineering',
                'avatar_url': 'https://gdkwidkzbdwjtzgjezch.supabase.co/storage/v1/object/public/avatars/avatar-1.png'
            }
            
            logger.info("Testing avatar_url insert functionality...")
            
            # Try the insert
            insert_result = await client.table('user_profiles').insert(test_record).execute()
            logger.info(f"Avatar URL test insert result: {insert_result}")
            
            if insert_result.data and len(insert_result.data) > 0:
                # Test fetch with avatar_url
                fetch_result = await client.table('user_profiles').select('*').eq('user_id', test_user_id).execute()
                logger.info(f"Avatar URL test fetch result: {fetch_result}")
                
                # Clean up test data
                await client.table('user_profiles').delete().eq('user_id', test_user_id).execute()
                
                return {
                    "message": "Avatar URL functionality test successful",
                    "insert_worked": True,
                    "fetch_worked": True,
                    "avatar_url_field_accessible": True
                }
            else:
                return {
                    "message": "Avatar URL insert test failed",
                    "insert_worked": False,
                    "fetch_worked": False,
                    "avatar_url_field_accessible": False
                }
                
        except Exception as e:
            logger.error(f"Avatar functionality test failed: {e}")
            return {
                "message": "Avatar functionality test failed",
                "error": str(e),
                "insert_worked": False,
                "fetch_worked": False,
                "avatar_url_field_accessible": False
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

@router.post("/test-email")
async def test_email(request: Request):
    """Test endpoint to verify email functionality."""
    try:
        # Extract user email from JWT token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return {"error": "No Bearer token found"}
        
        token = auth_header.split(' ')[1]
        import jwt
        payload = jwt.decode(token, options={"verify_signature": False})
        user_email = payload.get('email')
        
        if not user_email:
            return {"error": "Could not extract email from JWT"}
        
        # Test welcome email sending
        test_name = "Test User"
        
        email_result = email_service.send_welcome_email(user_email, test_name)
        
        if email_result['success']:
            logger.info(f"Test welcome email sent successfully to {user_email}")
            return {
                "success": True,
                "message": "Test welcome email sent successfully",
                "email": user_email,
                "provider": email_result.get('provider', 'unknown')
            }
        else:
            logger.error(f"Failed to send test welcome email to {user_email}")
            return {
                "success": False,
                "message": "Failed to send test welcome email",
                "email": user_email,
                "error": email_result.get('error', 'Unknown error'),
                "note": "Check email provider configuration in .env file"
            }
        
    except Exception as e:
        logger.error(f"Test email error: {e}")
        return {
            "success": False,
            "error": str(e)
        }
