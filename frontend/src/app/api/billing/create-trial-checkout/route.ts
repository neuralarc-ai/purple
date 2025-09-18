import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    console.log('Session check:', { 
      hasSession: !!session, 
      hasAccessToken: !!session?.access_token,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionError: sessionError?.message
    });
    
    if (!session?.access_token) {
      console.log('No session or access token found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Get backend URL with proper fallback
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';
    
    // Ensure we're using the correct API path
    // For production (https://he2.ai/api), we need to remove the /api prefix since it's already included
    // For local (http://localhost:8000/api), we also need to remove the /api prefix
    const apiPath = '/billing/create-trial-checkout';
    const fullUrl = `${backendUrl}${apiPath}`;
    
    console.log('Making request to:', fullUrl);
    console.log('Authorization header:', `Bearer ${session.access_token.substring(0, 20)}...`);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Backend error:', result);
      
      // Provide more specific error messages based on status code
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Authentication required. Please sign in to start your trial.' },
          { status: 401 }
        );
      } else if (response.status === 404) {
        return NextResponse.json(
          { error: 'User not found. Please sign in again.' },
          { status: 404 }
        );
      } else if (response.status === 400) {
        return NextResponse.json(
          { error: result.detail || 'Invalid request. Please try again.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(result, { status: response.status });
    }
    
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('Error creating trial checkout:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating trial checkout.' },
      { status: 500 }
    );
  }
}
