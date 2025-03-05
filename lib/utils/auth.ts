/**
 * Utility functions for authentication
 */

/**
 * Gets the authentication token from localStorage
 * @returns The authentication token or null if not found
 */
export async function getToken(): Promise<string | null> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Get the auth token from localStorage
  const token = localStorage.getItem('auth_token');
  return token;
}

/**
 * Sets the authentication token in localStorage
 * @param token The authentication token to store
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.setItem('auth_token', token);
}

/**
 * Removes the authentication token from localStorage
 */
export function removeToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem('auth_token');
} 