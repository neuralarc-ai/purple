import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    const body = await request.json();
    
    // Proxy the request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const apiPath = backendUrl.endsWith('/api') ? '/invite-codes/validate-invite' : '/api/invite-codes/validate-invite';
    const response = await fetch(`${backendUrl}${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('Error validating invite code:', error);
    return NextResponse.json(
      { valid: false, message: 'An error occurred while validating the invite code.' },
      { status: 500 }
    );
  }
}
