/**
 * Utility functions for making authenticated API requests
 */

/**
 * Makes an authenticated fetch request by adding the auth token to the headers
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns The fetch response
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Get the auth token from localStorage
  const token = localStorage.getItem('auth_token');
  
  // Create headers with auth token if available
  const headers = {
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  
  // Return the fetch with auth headers
  return fetch(url, {
    ...options,
    headers
  });
} 