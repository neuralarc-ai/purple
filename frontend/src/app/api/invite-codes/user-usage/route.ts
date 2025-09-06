import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { config } from '@/lib/config';

const { BACKEND_URL } = config;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { has_used_invite_code: false },
        { status: 200 }
      );
    }

    const backendUrl = BACKEND_URL || 'http://localhost:8000';
    const apiPath = backendUrl.endsWith('/api') ? '/invite-codes/user-usage' : '/api/invite-codes/user-usage';

    const response = await fetch(`${backendUrl}${apiPath}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Error checking invite code usage:', response.statusText);
      return NextResponse.json(
        { has_used_invite_code: false },
        { status: 200 }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error checking invite code usage:', error);
    return NextResponse.json(
      { has_used_invite_code: false },
      { status: 200 }
    );
  }
}
