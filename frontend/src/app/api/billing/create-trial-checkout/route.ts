import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get the Authorization header from the request
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header:', authHeader ? `${authHeader.substring(0, 20)}...` : 'None');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid Authorization header found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Token extracted:', token ? `${token.substring(0, 20)}...` : 'None');
    
    // Also try to get session from Supabase client for debugging
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    console.log('API Route User check:', { 
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userError: userError?.message
    });
    
    console.log('API Route Session check:', { 
      hasSession: !!session, 
      hasAccessToken: !!session?.access_token,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionError: sessionError?.message,
      accessTokenLength: session?.access_token?.length,
      accessTokenStart: session?.access_token?.substring(0, 20)
    });
    
    // Also check cookies directly
    const cookieStore = await import('next/headers').then(m => m.cookies());
    const allCookies = cookieStore.getAll();
    console.log('All cookies:', allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));
    
    const body = await request.json();
    
    // Get backend URL with proper fallback
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';
    
    // The backend URL already includes /api, so we just append the billing path
    const apiPath = '/billing/create-trial-checkout';
    const fullUrl = `${backendUrl}${apiPath}`;
    
    console.log('URL construction:', {
      backendUrl,
      apiPath,
      fullUrl
    });
    
    console.log('Making request to:', fullUrl);
    console.log('Using token from Authorization header:', `${token.substring(0, 20)}...`);
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
