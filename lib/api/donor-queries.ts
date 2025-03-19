import { formatDate } from '../utils/date';
import { fetchWithAuth } from './fetch-utils';

// Define the API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://proof-concierge-fcbe8069aebb.herokuapp.com/api/v1';

// Define the donor query types
export type QueryMode = 'Text' | 'Huddle' | 'Video Call';
export type QueryStatus = 'In Progress' | 'Pending Reply' | 'Resolved' | 'Transferred';

export interface DonorQuery {
  id: number;
  sid: string;
  donor: string;
  donorId: string;
  test: string;
  stage: string;
  queryMode: QueryMode;
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
    
    console.log(`Making request to: ${API_BASE_URL}/donor-queries/general${queryString ? `?${queryString}` : ''}`);
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
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });
    }
    const queryString = queryParams.toString();
    
    // Fetch resolved queries
    const url = `${API_BASE_URL}/donor-queries/resolved${queryString ? `?${queryString}` : ''}`;
    const response = await fetchWithAuth(url);
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
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });
    }
    const queryString = queryParams.toString();
    
    // Fetch transferred queries
    const url = `${API_BASE_URL}/donor-queries/transferred${queryString ? `?${queryString}` : ''}`;
    const response = await fetchWithAuth(url);
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
export async function resolveQuery(id: number, resolvedBy: string | number): Promise<boolean> {
  try {
    // Ensure resolvedById is a number
    let resolvedById: number;
    
    if (typeof resolvedBy === 'number') {
      resolvedById = resolvedBy;
    } else if (typeof resolvedBy === 'string' && !isNaN(Number(resolvedBy))) {
      resolvedById = Number(resolvedBy);
    } else {
      console.warn(`Invalid resolvedBy value: ${resolvedBy}, defaulting to user ID 1`);
      resolvedById = 1; // Default to user ID 1 if not a valid number
    }
    
    console.log(`Resolving query ${id} with user ID ${resolvedById}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/donor-queries/${id}/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resolvedById }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Failed to resolve query ${id}. Status: ${response.status}`, errorData);
      throw new Error(`Failed to resolve query: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error in resolveQuery:', error);
    return false;
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
    const USERS_API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://proof-concierge-fcbe8069aebb.herokuapp.com';
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
export async function transferQueryToUser(queryId: number, userId: number, note?: string) {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/donor-queries/${queryId}/transfer-to-user`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId,
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
    console.log(`Attempting to accept query with ID: ${id}`);
    const response = await fetchWithAuth(`${API_BASE_URL}/donor-queries/${id}/accept`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      let errorMessage = `Status: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error('Error accepting query:', errorData);
        console.error('Response status:', response.status);
        console.error('Response status text:', response.statusText);
        
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
      }
      
      // Return false but don't throw, so the UI can still proceed
      console.error('Error details:', errorMessage);
      return false;
    }

    console.log('Query accepted successfully');
    return true;
  } catch (error) {
    console.error('Error accepting query:', error);
    return false;
  }
} 