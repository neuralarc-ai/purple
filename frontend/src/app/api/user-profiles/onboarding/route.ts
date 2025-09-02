import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Try to connect to backend first
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    
    console.log('Sending onboarding data to backend:', {
      url: `${backendUrl}/api/user-profiles/onboarding`,
      body: body
    });
    
    try {
      const response = await fetch(`${backendUrl}/api/user-profiles/onboarding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('Backend response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          return NextResponse.json(errorData, { status: response.status });
        } catch {
          return NextResponse.json(
            { error: `Backend error: ${response.status} - ${errorText}` },
            { status: response.status }
          );
        }
      }

      const data = await response.json();
      console.log('Backend success response:', data);
      
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('Backend connection failed, using fallback:', backendError);
      
      // Fallback: Store data directly in Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: session.user.id,
          full_name: body.display_name,
          preferred_name: body.display_name,
          work_description: body.role,
          referral_source: body.referral_source,
          consent_given: true,
          consent_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) {
        console.error('Supabase fallback error:', profileError);
        return NextResponse.json(
          { error: 'Failed to save profile data', details: profileError.message },
          { status: 500 }
        );
      }

      console.log('Supabase fallback success:', profileData);
      return NextResponse.json({
        success: true,
        message: 'Onboarding completed successfully',
        profile_id: profileData.id
      });
    }
  } catch (error) {
    console.error('Onboarding API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
