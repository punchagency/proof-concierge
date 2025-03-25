import { formatDate } from '../utils/date';
import { fetchWithAuth } from './fetch-utils';

// Define the API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5005/api/v1';

// Define the donor query types
export type QueryMode = 'Text' | 'Huddle' | 'Video Call';
export type QueryStatus = 'In Progress' | 'Pending Reply' | 'Resolved' | 'Transferred';

export interface DonorQuery {
  id: number;
  donor: string;
  donorId: string;
  test: string;
  stage: string;
  device: string;
  createdAt: string;
  updatedAt: string;
  status: QueryStatus;
  resolvedById?: number;
  resolvedByUser?: {
    id: number;
    name: string;
    email?: string;
  };
  assignedToUser?: {
    id: number;
    name: string;
    role: string;
  };
  assignedToId?: number;
  transferredTo?: string;
  transferNote?: string;
}

export interface GeneralQuery extends DonorQuery {
  dateNdTime: string; // Formatted date for display
}

export interface ResolvedQuery extends DonorQuery {
  dateNdTime: string; // Formatted date for display
  resolvedBy: string; // Name of the user who resolved the query
}

export interface TransferredQuery extends DonorQuery {
  dateNdTime: string; // Formatted date for display
  transferredTo: string;
  transferNote?: string;
}

// API response type
interface ApiResponse<T> {
  status: number;
  data: T;
  message?: string;
}

// Interface for filter parameters
export interface FilterParams {
  test?: string;
  stage?: string;
  queryMode?: QueryMode;
  device?: string;
  date?: string;
  status?: QueryStatus;
}

// Fetch all general queries (In Progress and Pending Reply)
export async function fetchGeneralQueries(filters?: FilterParams): Promise<GeneralQuery[]> {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters) {
      // Only include the specific parameters that the backend accepts
      if (filters.test) queryParams.append('test', filters.test);
      if (filters.stage) queryParams.append('stage', filters.stage);
      if (filters.queryMode) queryParams.append('queryMode', filters.queryMode);
      if (filters.device) queryParams.append('device', filters.device);
      if (filters.date) queryParams.append('date', filters.date);
      // Skip status parameter as it's not in the backend API documentation
    }
    const queryString = queryParams.toString();
    
    // Fetch general queries using the combined endpoint
    const url = `${API_BASE_URL}/donor-queries/general${queryString ? `?${queryString}` : ''}`;
    const response = await fetchWithAuth(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from API (${response.status}):`, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    const data: ApiResponse<DonorQuery[]> = await response.json();
    
    // Ensure data property is an array before mapping
    const queriesArray = Array.isArray(data.data) ? data.data : [];
    
    // Format the data
    const formattedData = queriesArray.map(query => ({
      ...query,
      dateNdTime: formatDate(query.createdAt)
    }));
    
    return formattedData;
  } catch (error) {
    console.error('Error fetching general queries:', error);
    return [];
  }
}

// Fetch resolved queries
export async function fetchResolvedQueries(filters?: FilterParams): Promise<ResolvedQuery[]> {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters) {
      // Only include the specific parameters that the backend accepts
      if (filters.test) queryParams.append('test', filters.test);
      if (filters.stage) queryParams.append('stage', filters.stage);
      if (filters.queryMode) queryParams.append('queryMode', filters.queryMode);
      if (filters.device) queryParams.append('device', filters.device);
      if (filters.date) queryParams.append('date', filters.date);
      // Skip status parameter as it's not in the backend API documentation
    }
    const queryString = queryParams.toString();
    
    // Fetch resolved queries
    const url = `${API_BASE_URL}/donor-queries/resolved${queryString ? `?${queryString}` : ''}`;
    const response = await fetchWithAuth(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from API (${response.status}):`, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    const data: ApiResponse<DonorQuery[]> = await response.json();
    
    // Ensure data property is an array before mapping
    const resolvedArray = Array.isArray(data.data) ? data.data : [];
    
    // Format the data
    const formattedData = resolvedArray.map(query => {
      // Get the resolver's name from the resolvedByUser relation if available
      const resolverName = query.resolvedByUser?.name || 'Unknown';
      
      return {
        ...query,
        dateNdTime: formatDate(query.createdAt),
        resolvedBy: resolverName
      };
    });
    
    return formattedData;
  } catch (error) {
    console.error('Error fetching resolved queries:', error);
    return [];
  }
}

// Fetch transferred queries
export async function fetchTransferredQueries(filters?: FilterParams): Promise<TransferredQuery[]> {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters) {
      // Only include the specific parameters that the backend accepts
      if (filters.test) queryParams.append('test', filters.test);
      if (filters.stage) queryParams.append('stage', filters.stage);
      if (filters.queryMode) queryParams.append('queryMode', filters.queryMode);
      if (filters.device) queryParams.append('device', filters.device);
      if (filters.date) queryParams.append('date', filters.date);
      // Skip status parameter as it's not in the backend API documentation
    }
    const queryString = queryParams.toString();
    
    // Fetch transferred queries
    const url = `${API_BASE_URL}/donor-queries/transferred${queryString ? `?${queryString}` : ''}`;
    const response = await fetchWithAuth(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from API (${response.status}):`, errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
    const data: ApiResponse<DonorQuery[]> = await response.json();
    
    // Ensure data property is an array before mapping
    const transferredArray = Array.isArray(data.data) ? data.data : [];
    
    // Format the data
    const formattedData = transferredArray.map(query => ({
      ...query,
      dateNdTime: formatDate(query.createdAt),
      transferredTo: query.transferredTo || 'Unknown'
    }));
    
    return formattedData;
  } catch (error) {
    console.error('Error fetching transferred queries:', error);
    return [];
  }
}

// Resolve a query
export async function resolveQuery(id: number): Promise<DonorQuery | null> {
  try {
    
    const response = await fetchWithAuth(`${API_BASE_URL}/donor-queries/${id}/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.json();
        console.error(`Failed to resolve query ${id}. Status: ${response.status}`, errorData);
        errorMessage = errorData.message || response.statusText;
      } catch {
        // If response isn't JSON, get it as text
        try {
          const textError = await response.text();
          console.error('Error response text:', textError);
          errorMessage = textError || errorMessage;
          sessionStorage.setItem('lastQueryError', errorMessage);
        } catch (textError) {
          console.error('Failed to get error text', textError);
        }
      }
      throw new Error(`Failed to resolve query: ${errorMessage}`);
    }

    const resolvedQueryData = await response.json();
    return resolvedQueryData.data;
  } catch (error) {
    console.error('Error in resolveQuery:', error);
    return null;
  }
}

// Transfer a query
export async function transferQuery(id: number, transferredTo: string): Promise<boolean> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/donor-queries/${id}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transferredTo }),
    });
    
    return response.ok;
  } catch (error) {
    console.error(`Error transferring query ${id}:`, error);
    return false;
  }
}

// Update a query
export async function updateQuery(id: number, data: Partial<DonorQuery>): Promise<boolean> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/donor-queries/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return response.ok;
  } catch (error) {
    console.error(`Error updating query ${id}:`, error);
    return false;
  }
}

// Create a new query
export async function createQuery(data: Omit<DonorQuery, 'id' | 'createdAt' | 'updatedAt'>): Promise<DonorQuery | null> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/donor-queries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (response.ok) {
      const result: ApiResponse<DonorQuery> = await response.json();
      return result.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error creating query:', error);
    return null;
  }
}

// Add a function to fetch admin users
export async function fetchAdminUsers() {
  try {
    // Use the correct API base URL for users endpoint
    const USERS_API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5005';
    const response = await fetchWithAuth(`${USERS_API_BASE_URL}/users`);
    if (!response.ok) {
      throw new Error(`Failed to fetch admin users: ${response.status}`);
    }
    const data = await response.json();
    return { data }; // Wrap in an object with data property to match expected format in QueryActions
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return null;
  }
}

// Add a function to transfer a query to a specific admin user
export async function transferQueryToUser(queryId: number, adminId: number, note?: string) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/donor-queries/${queryId}/transfer`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        adminId,
        transferNote: note 
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to transfer query: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error transferring query to user:', error);
    return false;
  }
}

// Send a reminder to the user assigned to a transferred query
export async function sendQueryReminder(queryId: number, message?: string) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/donor-queries/${queryId}/send-reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send reminder: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending reminder:', error);
    return false;
  }
}

/**
 * Accept a query
 * @param id The ID of the query to accept
 * @returns A boolean indicating whether the operation was successful
 */
export async function acceptQuery(id: number): Promise<boolean> {
  try {    
    // Input validation
    if (!id || isNaN(id) || id <= 0) {
      console.error('Invalid query ID provided:', id);
      sessionStorage.setItem('lastQueryError', 'Invalid query ID provided');
      return false;
    }

    // Check for token before making request
    const token = localStorage.getItem('auth_token');
    if (!token) {
      const errorMsg = 'Authentication token missing. Please log in again.';
      console.error(errorMsg);
      sessionStorage.setItem('lastQueryError', errorMsg);
      return false;
    }
    
    // Log the exact URL and request details for debugging
    const url = `${API_BASE_URL}/donor-queries/${id}/accept`;
    
    // Make the request to accept the query
    const response = await fetchWithAuth(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = `Status: ${response.status} ${response.statusText}`;
      let errorData;
      
      try {
        // Try to parse the error response as JSON
        errorData = await response.json();
        console.error('Error accepting query:', errorData);
        
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
        
        // Store the error message in sessionStorage
        sessionStorage.setItem('lastQueryError', errorMessage);
      } catch {
        // If response isn't JSON, get it as text
        try {
          const textError = await response.text();
          console.error('Error response text:', textError);
          errorMessage = textError || errorMessage;
          sessionStorage.setItem('lastQueryError', errorMessage);
        } catch (textError) {
          console.error('Failed to get error text', textError);
        }
      }
      
      console.error('Error details:', errorMessage);
      
      // Specific error handling based on status code
      if (response.status === 400) {
        console.error('Bad Request error when accepting query. This usually means the request format is incorrect or the query cannot be accepted in its current state.');
        
        // Try to provide a more user-friendly error message
        let userErrorMsg = 'Unable to accept query due to a request error.';
        
        if (errorMessage.includes('cannot accept a resolved')) {
          userErrorMsg = 'This query has already been resolved and cannot be accepted.';
        } else if (errorMessage.includes('cannot accept a transferred')) {
          userErrorMsg = 'This query has already been transferred and cannot be accepted.';
        } else if (errorMessage.includes('already accepted') || errorMessage.includes('already assigned')) {
          userErrorMsg = 'This query has already been accepted by another admin.';
        }
        
        sessionStorage.setItem('lastQueryError', userErrorMsg);
        return false;
      } else if (response.status === 401) {
        sessionStorage.setItem('lastQueryError', 'Authentication failed. Please log in again.');
        return false;
      } else if (response.status === 403) {
        sessionStorage.setItem('lastQueryError', 'You do not have permission to accept this query.');
        return false;
      } else if (response.status === 404) {
        sessionStorage.setItem('lastQueryError', 'Query not found. It may have been deleted.');
        return false;
      } else if (response.status === 409) {
        sessionStorage.setItem('lastQueryError', 'Conflict with the current state of the query. Another user may have already accepted it.');
        return false;
      }
      
      return false;
    }

    // Process successful response
    try {
      const data = await response.json();
      
      // Update query statuses in localStorage
      try {
        const localState = localStorage.getItem('queryStatuses') || '{}';
        const statuses = JSON.parse(localState);
        
        // Update with the new status and assignedToUser information
        statuses[id] = {
          status: "In Progress", // Once accepted, status changes to "In Progress"
          assignedToUser: data?.data?.assignedToUser?.id || null
        };
        
        localStorage.setItem('queryStatuses', JSON.stringify(statuses));
      } catch (e) {
        console.error('Error updating local query status:', e);
      }
      
      return true;
    } catch (error) {
      console.error('Error parsing success response:', error);
      return true; // Still return true since the API call was successful
    }
  } catch (error) {
    console.error('Error accepting query:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
    sessionStorage.setItem('lastQueryError', errorMsg);
    return false;
  }
} 