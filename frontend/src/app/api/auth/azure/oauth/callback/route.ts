import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth errors
    if (error) {
      console.error('Azure AD OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/auth?error=${encodeURIComponent(errorDescription || error)}`
      )
    }

    // Handle missing authorization code
    if (!code) {
      console.error('No authorization code received from Azure AD')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/auth?error=No authorization code received`
      )
    }

    // Forward the OAuth callback to the backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    // Remove /api suffix if it exists to avoid double /api
    const baseUrl = backendUrl.endsWith('/api') ? backendUrl.slice(0, -4) : backendUrl
    const backendCallbackUrl = `${baseUrl}/api/azure/oauth/callback?${searchParams.toString()}`
    
    console.log('Forwarding Azure AD OAuth callback to backend:', backendCallbackUrl)
    
    // Redirect to backend callback endpoint
    return NextResponse.redirect(backendCallbackUrl)
    
  } catch (error) {
    console.error('Azure AD OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/auth?error=OAuth callback failed`
    )
  }
}
