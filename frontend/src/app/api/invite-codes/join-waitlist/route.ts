import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy the request to the backend
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const apiPath = backendUrl.endsWith('/api') ? '/invite-codes/join-waitlist' : '/api/invite-codes/join-waitlist';
    const response = await fetch(`${backendUrl}${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error('Error joining waitlist:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while joining the waitlist.' },
      { status: 500 }
    );
  }
}
