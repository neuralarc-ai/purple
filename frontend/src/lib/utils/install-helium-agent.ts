"use server";

async function installHeliumForNewUser(userId: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const adminApiKey = process.env.KORTIX_ADMIN_API_KEY;
    
    if (!adminApiKey) {
      console.error('KORTIX_ADMIN_API_KEY not configured - cannot install Helium agent');
      return;
    }
  
    const response = await fetch(`${backendUrl}/admin/helium-agents/install-user/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Api-Key': adminApiKey,
      },
    });

    console.log('response', response);

    if (response.ok) {
      const result = await response.json();
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Failed to install Helium agent for user:`, errorData);
      return false;
    }
  } catch (error) {
    console.error('Error installing Helium agent for new user:', error);
    return false;
  }
}

export async function checkAndInstallHeliumAgent(userId: string, userCreatedAt: string) {
  const userCreatedDate = new Date(userCreatedAt);
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  
  if (userCreatedDate > tenMinutesAgo) {
    const installKey = `helium-install-attempted-${userId}`;
    if (typeof window !== 'undefined' && localStorage.getItem(installKey)) {
      return;
    }
    
    const success = await installHeliumForNewUser(userId);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(installKey, Date.now().toString());
    }
    
    return success;
  }
  
  return false;
} 