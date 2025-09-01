import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  preferred_name: string;
  work_description: string;
  personal_references?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfileCreate {
  full_name: string;
  preferred_name: string;
  work_description: string;
  personal_references?: string;
  avatar?: string;
}

export interface UserProfileUpdate {
  full_name?: string;
  preferred_name?: string;
  work_description?: string;
  personal_references?: string;
  avatar?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

export const userProfilesApi = {
  async getProfile(): Promise<UserProfile> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE}/user-profiles/profile`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Profile not found');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  async createProfile(profileData: UserProfileCreate): Promise<UserProfile> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE}/user-profiles/profile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: profileData.full_name.trim(),
        preferred_name: profileData.preferred_name.trim(),
        work_description: profileData.work_description,
        personal_references: profileData.personal_references?.trim() || null,
        avatar: profileData.avatar || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
  },

  async updateProfile(profileData: UserProfileUpdate): Promise<UserProfile> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE}/user-profiles/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: profileData.full_name?.trim(),
        preferred_name: profileData.preferred_name?.trim(),
        work_description: profileData.work_description,
        personal_references: profileData.personal_references?.trim() || null,
        avatar: profileData.avatar,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
  },

  async deleteProfile(): Promise<void> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`${API_BASE}/user-profiles/profile`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
  },
};
