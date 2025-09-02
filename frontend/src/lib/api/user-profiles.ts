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

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';

export const userProfilesApi = {
  async getProfile(): Promise<UserProfile> {
    const supabase = createClient();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No authentication token available');
        throw new Error('No authentication token');
      }

      console.log('Making request to user profiles API with token:', session.access_token.substring(0, 20) + '...');
      
      const response = await fetch(`${API_BASE}/user-profiles/profile`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('User profiles API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('User profiles API error:', response.status, errorText);
        
        if (response.status === 404) {
          throw new Error('Profile not found');
        }
        
        if (response.status === 401) {
          throw new Error('Authentication failed - please log in again');
        }
        
        if (response.status === 500) {
          throw new Error(`Server error: ${errorText || 'Internal server error'}`);
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('User profiles API success:', data);
      return data;
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
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
        full_name: profileData.full_name?.trim() || undefined,
        preferred_name: profileData.preferred_name?.trim() || undefined,
        work_description: profileData.work_description || undefined,
        personal_references: profileData.personal_references?.trim() || undefined,
        avatar: profileData.avatar || undefined,
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
