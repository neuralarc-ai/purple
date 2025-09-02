'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

async function sendWelcomeEmail(email: string, name?: string) {
  try {
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8000'}/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
      }),
    });

    if (response.ok) {
      console.log(`✅ Welcome email queued for ${email}`);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Failed to queue welcome email for ${email}:`, errorData);
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}

async function checkUserOnboardingStatus(userId: string) {
  try {
    const supabase = await createClient();
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // No profile found - user needs onboarding
      return '/onboarding';
    } else if (profileData) {
      // User has profile - redirect to dashboard
      return '/dashboard';
    }
  } catch (error) {
    console.error('Error checking user onboarding status:', error);
  }
  
  // Fallback to dashboard
  return '/dashboard';
}

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const returnUrl = formData.get('returnUrl') as string | undefined;

  if (!email || !email.includes('@')) {
    return { message: 'Please enter a valid email address' };
  }

  if (!password || password.length < 6) {
    return { message: 'Password must be at least 6 characters' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { message: error.message || 'Could not authenticate user' };
  }

  // Check if user needs onboarding
  const redirectTo = await checkUserOnboardingStatus(data.user.id);
  
  // Use client-side navigation instead of server-side redirect
  return { success: true, redirectTo: returnUrl || redirectTo };
}

export async function signUp(prevState: any, formData: FormData) {
  const origin = formData.get('origin') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const returnUrl = formData.get('returnUrl') as string | undefined;

  if (!email || !email.includes('@')) {
    return { message: 'Please enter a valid email address' };
  }

  if (!password || password.length < 6) {
    return { message: 'Password must be at least 6 characters' };
  }

  if (password !== confirmPassword) {
    return { message: 'Passwords do not match' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { message: error.message || 'Could not create account' };
  }

  if (data.user && !data.user.email_confirmed_at) {
    // Email confirmation required
    await sendWelcomeEmail(email);
    return { 
      success: true, 
      message: 'Check your email to confirm your account',
      redirectTo: '/auth?message=Check your email to confirm your account'
    };
  }

  if (data.user) {
    // User is confirmed (e.g., from OAuth or email confirmation)
    // New users should go to onboarding
    return { 
      success: true, 
      redirectTo: '/onboarding'
    };
  }

  return { message: 'Something went wrong' };
}

export async function forgotPassword(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const origin = formData.get('origin') as string;

  if (!email || !email.includes('@')) {
    return { message: 'Please enter a valid email address' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) {
    return { message: error.message || 'Could not send password reset email' };
  }

  return {
    success: true,
    message: 'Check your email for a password reset link',
  };
}

export async function resetPassword(prevState: any, formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || password.length < 6) {
    return { message: 'Password must be at least 6 characters' };
  }

  if (password !== confirmPassword) {
    return { message: 'Passwords do not match' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { message: error.message || 'Could not update password' };
  }

  return {
    success: true,
    message: 'Password updated successfully',
  };
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { message: error.message || 'Could not sign out' };
  }

  return redirect('/');
}
