from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
from utils.auth_utils import get_optional_user_id
from utils.logger import logger
from services.supabase import DBConnection
from services.email_service import email_service

router = APIRouter()

class InviteCodeRequest(BaseModel):
    invite_code: str

class InviteCodeResponse(BaseModel):
    valid: bool
    message: str
    code_id: Optional[str] = None

class WaitlistRequest(BaseModel):
    full_name: str
    email: str
    company_name: Optional[str] = None

class WaitlistResponse(BaseModel):
    success: bool
    message: str

@router.post("/validate-invite", response_model=InviteCodeResponse)
async def validate_invite_code(
    request: InviteCodeRequest,
    request_obj: Request,
    db: DBConnection = Depends(lambda: DBConnection())
):
    """
    Validate an invite code and mark it as used if valid.
    """
    try:
        # Get optional user ID
        user_id = await get_optional_user_id(request_obj)
        
        # Clean the invite code
        invite_code = request.invite_code.strip().upper()
        
        if not invite_code:
            return InviteCodeResponse(
                valid=False,
                message="Please enter a valid invite code."
            )
        
        # Get database client
        client = await db.client
        
        # Query the invite code
        result = await client.table('invite_codes').select('*').eq('code', invite_code).execute()
        
        if not result.data or len(result.data) == 0:
            return InviteCodeResponse(
                valid=False,
                message="Invalid invite code. Please try again or join the waitlist."
            )
        
        invite_code_data = result.data[0]
        
        # Check if code is expired
        if invite_code_data.get('expires_at') and invite_code_data['expires_at'] < datetime.utcnow().isoformat():
            return InviteCodeResponse(
                valid=False,
                message="This invite code has expired. Please join the waitlist."
            )
        
        # Check if code has reached max uses
        if invite_code_data.get('current_uses', 0) >= invite_code_data.get('max_uses', 1):
            return InviteCodeResponse(
                valid=False,
                message="This invite code has been used up. Please join the waitlist."
            )
        
        # Check if code is already used (for single-use codes)
        if invite_code_data.get('is_used', False) and invite_code_data.get('max_uses', 1) == 1:
            return InviteCodeResponse(
                valid=False,
                message="This invite code has already been used. Please join the waitlist."
            )
        
        # Mark the code as used
        update_data = {
            'is_used': True,
            'used_by': user_id,
            'current_uses': invite_code_data.get('current_uses', 0) + 1,
            'used_at': datetime.utcnow().isoformat()
        }
        
        await client.table('invite_codes').update(update_data).eq('id', invite_code_data['id']).execute()
        
        logger.info(f"Invite code {invite_code} validated successfully", 
                   invite_code=invite_code, user_id=user_id)
        
        return InviteCodeResponse(
            valid=True,
            message="Invite code validated successfully!",
            code_id=str(invite_code_data['id'])
        )
        
    except Exception as e:
        logger.error(f"Error validating invite code: {e}", exc_info=True)
        return InviteCodeResponse(
            valid=False,
            message="An error occurred while validating the invite code. Please try again."
        )

@router.post("/join-waitlist", response_model=WaitlistResponse)
async def join_waitlist(
    request: WaitlistRequest,
    db: DBConnection = Depends(lambda: DBConnection())
):
    """
    Add a user to the waitlist.
    """
    try:
        # Validate input
        full_name = request.full_name.strip()
        email = request.email.strip().lower()
        
        logger.info(f"Received waitlist request: full_name={full_name}, email={email}, company_name={request.company_name}")
        logger.info(f"Company name type: {type(request.company_name)}, value: '{request.company_name}'")
        
        if not full_name or not email:
            return WaitlistResponse(
                success=False,
                message="Please provide both full name and email address."
            )
        
        # Get database client
        client = await db.client
        
        # Check if email already exists in waitlist
        existing = await client.table('waitlist').select('id').eq('email', email).execute()
        
        if existing.data and len(existing.data) > 0:
            return WaitlistResponse(
                success=True,
                message="You're already on the Helium waitlist! We'll notify you when it's your turn."
            )
        
        # Insert into waitlist
        company_name = None
        if request.company_name is not None and request.company_name.strip():
            company_name = request.company_name.strip()
            
        logger.info(f"Processed company_name: '{company_name}' (type: {type(company_name)})")
            
        waitlist_data = {
            'full_name': full_name,
            'email': email,
            'joined_at': datetime.utcnow().isoformat()
        }
        
        # Only include company_name if it's not None/empty
        if company_name:
            waitlist_data['company_name'] = company_name
        
        logger.info(f"Attempting to insert waitlist data: {waitlist_data}")
        
        result = await client.table('waitlist').insert(waitlist_data).execute()
        
        logger.info(f"Insert result: {result}")
        
        if not result.data or len(result.data) == 0:
            logger.error(f"Failed to insert waitlist entry - no data returned")
            return WaitlistResponse(
                success=False,
                message="Failed to join waitlist. Please try again."
            )
        
        logger.info(f"User joined waitlist successfully", email=email, full_name=full_name, waitlist_id=result.data[0].get('id'))
        
        # Send waitlist confirmation email
        try:
            email_result = email_service.send_waitlist_email(email, full_name)
            if email_result['success']:
                logger.info(f"Waitlist confirmation email sent to {email}")
            else:
                logger.warning(f"Failed to send waitlist email to {email}: {email_result.get('error', 'Unknown error')}")
        except Exception as email_error:
            logger.error(f"Error sending waitlist email to {email}: {str(email_error)}")
        
        return WaitlistResponse(
            success=True,
            message="You're on the Helium list! We'll notify you when it's your turn."
        )
        
    except Exception as e:
        logger.error(f"Error joining waitlist: {e}", exc_info=True)
        # Check if it's a specific database error
        if hasattr(e, 'details') and e.details:
            logger.error(f"Database error details: {e.details}")
        if hasattr(e, 'hint') and e.hint:
            logger.error(f"Database error hint: {e.hint}")
        return WaitlistResponse(
            success=False,
            message="An error occurred while joining the waitlist. Please try again."
        )

@router.get("/test")
async def test_invite_codes():
    """
    Test endpoint to verify the invite_codes module is working.
    """
    return {"message": "Invite codes module is working!"}
