import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the backend URL from environment or use default
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    console.log('Calling backend:', `${backendUrl}/api/generate-prompts`);
    
    // Call the backend API directly
    const response = await fetch(`${backendUrl}/api/generate-prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', response.status, errorText);
      throw new Error(`Backend API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Backend response:', data);
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error calling backend:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate prompts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
