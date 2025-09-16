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
    
    // Proxy the request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const apiPath = backendUrl.endsWith('/api') ? '/billing/create-trial-checkout' : '/api/billing/create-trial-checkout';
    
    const response = await fetch(`${backendUrl}${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('Error creating trial checkout:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating trial checkout.' },
      { status: 500 }
    );
  }
}
