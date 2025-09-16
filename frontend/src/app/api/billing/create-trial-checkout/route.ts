import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Get backend URL with proper fallback
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    
    // Ensure we're using the correct API path
    const apiPath = '/api/billing/create-trial-checkout';
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
