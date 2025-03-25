import { User } from './auth';
import { fetchWithAuth } from './fetch-utils';

// Define the API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5005';

// Update the FCM token for the current user
export async function updateUserFCMToken(fcmToken: string): Promise<boolean> {
  try {
    console.log('Updating FCM token:', fcmToken);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/users/me/fcm-token`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fcmToken,
      }),
    });

    if (!response.ok) {
      console.error('Failed to update FCM token:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return false;
  }
}

// Fetch admin users
export async function fetchAdminUsers(): Promise<{ data: User[] }> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/users?role=ADMIN`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch admin users: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching admin users:', error);
    throw error;
  }
} 