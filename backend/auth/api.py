from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import RedirectResponse
from typing import Optional
import httpx
import json
from urllib.parse import urlencode
from utils.config import config
from utils.logger import logger
from services.supabase import DBConnection
from utils.auth_utils import get_current_user_id_from_jwt

router = APIRouter()

@router.get("/google/oauth/callback")
async def google_oauth_callback(
    request: Request,
    code: Optional[str] = None,
    error: Optional[str] = None,
    state: Optional[str] = None
):
    """
    Handle Google OAuth callback for backend authentication.
    This endpoint exchanges the authorization code for access tokens and user info.
    """
    
    if error:
        logger.error(f"Google OAuth error: {error}")
        # Redirect to frontend with error
        frontend_url = config.NEXT_PUBLIC_URL or "http://localhost:3000"
        return RedirectResponse(f"{frontend_url}/auth?error=google_oauth_error&message={error}")
    
    if not code:
        logger.error("No authorization code received from Google")
        frontend_url = config.NEXT_PUBLIC_URL or "http://localhost:3000"
        return RedirectResponse(f"{frontend_url}/auth?error=no_authorization_code")
    
    try:
        # Exchange authorization code for access token
        token_response = await exchange_code_for_token(code)
        
        if not token_response:
            logger.error("Failed to exchange code for token")
            frontend_url = config.NEXT_PUBLIC_URL or "http://localhost:3000"
            return RedirectResponse(f"{frontend_url}/auth?error=token_exchange_failed")
        
        # Get user info from Google
        user_info = await get_google_user_info(token_response["access_token"])
        
        if not user_info:
            logger.error("Failed to get user info from Google")
            frontend_url = config.NEXT_PUBLIC_URL or "http://localhost:3000"
            return RedirectResponse(f"{frontend_url}/auth?error=user_info_failed")
        
        # Store the tokens securely (you might want to encrypt these)
        # For now, we'll just log the successful authentication
        logger.info(f"Google OAuth successful for user: {user_info.get('email')}")
        
        # Redirect back to frontend with success and returnUrl from state
        frontend_url = config.NEXT_PUBLIC_URL or "http://localhost:3000"
        return_url = state if state else "/dashboard"
        return RedirectResponse(f"{frontend_url}/auth/callback?success=google_oauth_success&email={user_info.get('email')}&returnUrl={return_url}")
        
    except Exception as e:
        logger.error(f"Google OAuth callback error: {str(e)}")
        frontend_url = config.NEXT_PUBLIC_URL or "http://localhost:3000"
        return RedirectResponse(f"{frontend_url}/auth?error=oauth_callback_error&message={str(e)}")

async def exchange_code_for_token(code: str) -> Optional[dict]:
    """
    Exchange authorization code for access token using Google OAuth API.
    """
    if not config.GOOGLE_OAUTH_CLIENT_ID or not config.GOOGLE_OAUTH_CLIENT_SECRET:
        logger.error("Google OAuth client credentials not configured")
        return None
    
    token_url = "https://oauth2.googleapis.com/token"
    redirect_uri = config.GOOGLE_OAUTH_REDIRECT_URI or f"{config.NEXT_PUBLIC_URL}/api/auth/google/oauth/callback"
    
    data = {
        "client_id": config.GOOGLE_OAUTH_CLIENT_ID,
        "client_secret": config.GOOGLE_OAUTH_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri,
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Error exchanging code for token: {str(e)}")
        return None

async def get_google_user_info(access_token: str) -> Optional[dict]:
    """
    Get user information from Google using the access token.
    """
    user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(user_info_url, headers=headers)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Error getting user info from Google: {str(e)}")
        return None

@router.get("/google/oauth/url")
async def get_google_oauth_url():
    """
    Get the Google OAuth authorization URL for initiating the OAuth flow.
    """
    if not config.GOOGLE_OAUTH_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    redirect_uri = config.GOOGLE_OAUTH_REDIRECT_URI or f"{config.NEXT_PUBLIC_URL}/api/auth/google/oauth/callback"
    
    params = {
        "client_id": config.GOOGLE_OAUTH_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    
    return {"auth_url": auth_url}

@router.get("/auth/status")
async def get_auth_status(request: Request):
    """
    Check the authentication status of the current user.
    """
    try:
        user_id = await get_current_user_id_from_jwt(request)
        return {"authenticated": True, "user_id": user_id}
    except HTTPException:
        return {"authenticated": False, "user_id": None}
