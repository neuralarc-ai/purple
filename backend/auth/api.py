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

@router.get("/azure/oauth/callback")
async def azure_oauth_callback(
    request: Request,
    code: Optional[str] = None,
    error: Optional[str] = None,
    state: Optional[str] = None
):
    """
    Handle Azure AD OAuth callback for backend authentication.
    This endpoint exchanges the authorization code for access tokens and user info.
    """
    
    if error:
        logger.error(f"Azure AD OAuth error: {error}")
        # Redirect to frontend with error
        frontend_url = config.NEXT_PUBLIC_URL or "http://localhost:3000"
        return RedirectResponse(f"{frontend_url}/auth?error=azure_oauth_error&message={error}")
    
    if not code:
        logger.error("No authorization code received from Azure AD")
        frontend_url = config.NEXT_PUBLIC_URL or "http://localhost:3000"
        return RedirectResponse(f"{frontend_url}/auth?error=no_authorization_code")
    
    try:
        # Exchange authorization code for access token
        token_response = await exchange_azure_code_for_token(code)
        
        if not token_response:
            logger.error("Failed to exchange code for token")
            frontend_url = config.NEXT_PUBLIC_URL or "http://localhost:3000"
            return RedirectResponse(f"{frontend_url}/auth?error=token_exchange_failed")
        
        # Get user info from Azure AD
        user_info = await get_azure_user_info(token_response["access_token"])
        
        if not user_info:
            logger.error("Failed to get user info from Azure AD")
            frontend_url = config.NEXT_PUBLIC_URL or "http://localhost:3000"
            return RedirectResponse(f"{frontend_url}/auth?error=user_info_failed")
        
        # Create or get Supabase user
        user_id = await create_or_get_supabase_user(user_info)
        
        if not user_id:
            logger.error("Failed to create or get Supabase user")
            frontend_url = config.NEXT_PUBLIC_URL or "http://localhost:3000"
            return RedirectResponse(f"{frontend_url}/auth?error=user_creation_failed")
        
        # Store the tokens securely (you might want to encrypt these)
        # For now, we'll just log the successful authentication
        logger.info(f"Azure AD OAuth successful for user: {user_info.get('mail') or user_info.get('userPrincipalName')}")
        
        # Redirect back to frontend with success and returnUrl from state
        frontend_url = config.NEXT_PUBLIC_URL or "http://localhost:3000"
        return_url = "/invite"  # Always redirect to invite page for new Azure AD users
        email = user_info.get('mail') or user_info.get('userPrincipalName')
        return RedirectResponse(f"{frontend_url}/auth/callback?success=azure_oauth_success&email={email}&returnUrl={return_url}")
        
    except Exception as e:
        logger.error(f"Azure AD OAuth callback error: {str(e)}")
        frontend_url = config.NEXT_PUBLIC_URL or "http://localhost:3000"
        return RedirectResponse(f"{frontend_url}/auth?error=oauth_callback_error&message={str(e)}")

async def exchange_azure_code_for_token(code: str) -> Optional[dict]:
    """
    Exchange authorization code for access token using Azure AD OAuth API.
    """
    if not config.AZURE_AD_CLIENT_ID or not config.AZURE_AD_CLIENT_SECRET:
        logger.error("Azure AD OAuth client credentials not configured")
        return None
    
    tenant_id = "common"  # Use common endpoint to support both personal and organizational accounts
    token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    redirect_uri = config.AZURE_AD_REDIRECT_URI or f"{config.NEXT_PUBLIC_URL}/api/auth/azure/oauth/callback"
    
    data = {
        "client_id": config.AZURE_AD_CLIENT_ID,
        "client_secret": config.AZURE_AD_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri,
        "scope": "openid email profile User.Read"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=data)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Error exchanging code for token: {str(e)}")
        return None

async def get_azure_user_info(access_token: str) -> Optional[dict]:
    """
    Get user information from Azure AD using the access token.
    """
    user_info_url = "https://graph.microsoft.com/v1.0/me"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(user_info_url, headers=headers)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Error getting user info from Azure AD: {str(e)}")
        return None

async def create_or_get_supabase_user(user_info: dict) -> Optional[str]:
    """
    Create or get a Supabase user from Azure AD user info.
    """
    try:
        db = DBConnection()
        await db.initialize()
        client = await db.client
        
        email = user_info.get('mail') or user_info.get('userPrincipalName')
        if not email:
            logger.error("No email found in Azure AD user info")
            return None
        
        # Check if user already exists
        existing_user = await client.auth.admin.list_users()
        user_id = None
        
        for user in existing_user.data:
            if user.email == email:
                user_id = user.id
                break
        
        if not user_id:
            # Create new user
            display_name = user_info.get('displayName', email.split('@')[0])
            
            # Create user in Supabase Auth
            create_response = await client.auth.admin.create_user({
                "email": email,
                "email_confirm": True,
                "user_metadata": {
                    "display_name": display_name,
                    "azure_ad_id": user_info.get('id'),
                    "provider": "azure"
                }
            })
            
            if create_response.data and create_response.data.user:
                user_id = create_response.data.user.id
                logger.info(f"Created new Supabase user for Azure AD: {email}")
            else:
                logger.error(f"Failed to create Supabase user: {create_response}")
                return None
        else:
            logger.info(f"Found existing Supabase user for Azure AD: {email}")
        
        return user_id
        
    except Exception as e:
        logger.error(f"Error creating or getting Supabase user: {str(e)}")
        return None

@router.get("/azure/oauth/url")
async def get_azure_oauth_url():
    """
    Get the Azure AD OAuth authorization URL for initiating the OAuth flow.
    """
    if not config.AZURE_AD_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Azure AD OAuth not configured")
    
    tenant_id = "common"  # Use common endpoint to support both personal and organizational accounts
    redirect_uri = config.AZURE_AD_REDIRECT_URI or f"{config.NEXT_PUBLIC_URL}/api/auth/azure/oauth/callback"
    
    params = {
        "client_id": config.AZURE_AD_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile User.Read",
        "response_mode": "query",
        "state": "azure_oauth_state"  # You might want to generate a random state
    }
    
    auth_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize?{urlencode(params)}"
    
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
