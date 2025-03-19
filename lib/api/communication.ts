import { CallMode } from '@/types/communication';
import { fetchWithAuth } from './fetch-utils';

// Define the API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://proof-concierge-fcbe8069aebb.herokuapp.com/api/v1';

/**
 * Service for handling communication with the backend for video and audio calls
 */
export async function createCall(userId: number, mode: CallMode, expiryMinutes: number = 60) {
  try {
    console.log(`Creating ${mode} call for user ${userId} with expiry ${expiryMinutes} minutes`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/communication/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        mode,
        expiryMinutes,
        // Add a test caller name for notification testing (optional)
        callerName: 'Test Caller',
      }),
    });

    const data = await response.json();
    console.log('Call created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating call:', error);
    throw error;
  }
}

/**
 * Start a call for a specific query
 */
export async function startQueryCall(queryId: number, donorId: string, mode: CallMode, expiryMinutes: number = 60) {
  try {
    console.log(`Starting ${mode} call for query ${queryId} with donor ${donorId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/communication/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: parseInt(donorId),
        mode,
        expiryMinutes,
        customRoomName: `query-${queryId}-${Date.now()}`,
        callerName: 'Proof Concierge',
      }),
    });

    const data = await response.json();
    
    // Log the join link in the terminal
    console.log('=== CALL INFORMATION ===');
    console.log(`Query ID: ${queryId}`);
    console.log(`Donor ID: ${donorId}`);
    console.log(`Call Mode: ${mode}`);
    console.log(`Room Name: ${data.data.admin.roomName}`);
    console.log(`Join URL: ${data.data.admin.roomUrl}`);
    console.log(`Admin Token: ${data.data.admin.roomToken.substring(0, 10)}...`);
    console.log(`User Token: ${data.data.user.roomToken.substring(0, 10)}...`);
    console.log('========================');

    return data;
  } catch (error) {
    console.error('Error starting query call:', error);
    throw error;
  }
}

/**
 * End a call by deleting the room
 */
export async function endCall(roomName: string) {
  try {
    console.log(`Ending call in room: ${roomName}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/communication/call/${roomName}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    console.log('Call ended successfully:', data);
    return data;
  } catch (error) {
    console.error('Error ending call:', error);
    throw error;
  }
}

/**
 * Update the query mode in the database
 */
export async function updateQueryMode(queryId: number, queryMode: string) {
  try {
    console.log(`Updating query ${queryId} mode to ${queryMode}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/donor-queries/${queryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queryMode
      }),
    });
    
    const data = await response.json();
    console.log('Query mode updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating query mode:', error);
    throw error;
  }
}

/**
 * Request a call with a user
 * @param queryId The ID of the query
 * @param mode The call mode (audio or video)
 * @param message Optional message to send with the request
 * @returns The response data or null if an error occurred
 */
export async function requestCall(
  queryId: number,
  mode: CallMode,
  message?: string
) {
  try {
    console.log(`Requesting ${mode} call for query ${queryId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/communication/request-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queryId,
        mode,
        message,
      }),
    });

    const data = await response.json();
    console.log('Call request sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error requesting call:', error);
    throw error;
  }
}

/**
 * Accept a call request
 * @param requestId The ID of the call request
 * @param queryId The ID of the query
 * @returns The response data or null if an error occurred
 */
export async function acceptCallRequest(requestId: number, queryId: number) {
  try {
    console.log(`Accepting call request ${requestId} for query ${queryId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/communication/${queryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: "ACCEPTED",
        callRequestId: requestId,
      }),
    });

    const data = await response.json();
    console.log('Call request accepted successfully:', data);
    return data;
  } catch (error) {
    console.error('Error accepting call request:', error);
    throw error;
  }
}

/**
 * Reject a call request
 * @param requestId The ID of the call request
 * @param queryId The ID of the query
 * @param reason Optional reason for rejecting the call
 * @returns The response data or null if an error occurred
 */
export async function rejectCallRequest(requestId: number, queryId: number, reason?: string) {
  try {
    console.log(`Rejecting call request ${requestId} for query ${queryId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/communication/${queryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: "DECLINED",
        callRequestId: requestId,
        reason,
      }),
    });

    const data = await response.json();
    console.log('Call request rejected successfully:', data);
    return data;
  } catch (error) {
    console.error('Error rejecting call request:', error);
    throw error;
  }
}

/**
 * Get call request history for a specific query
 * @param queryId The ID of the query
 * @returns Array of call requests
 */
export async function getCallRequestHistory(queryId: number) {
  try {
    console.log(`Fetching call request history for query ${queryId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/communication/call-requests/${queryId}`, {
      method: 'GET',
    });

    const data = await response.json();
    console.log('Call request history fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching call request history:', error);
    throw error;
  }
}

/**
 * Cancel a call request
 * @param requestId The ID of the call request
 * @returns The response data or null if an error occurred
 */
export async function cancelCallRequest(requestId: string) {
  try {
    console.log(`Cancelling call request ${requestId}`);
    
    const response = await fetchWithAuth(`${API_BASE_URL}/communication/cancel-call-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestId,
      }),
    });

    const data = await response.json();
    console.log('Call request cancelled successfully:', data);
    return data;
  } catch (error) {
    console.error('Error cancelling call request:', error);
    throw error;
  }
}

/**
 * Accept a call request by ID
 * @param queryId The ID of the query
 * @param requestId The ID of the call request to accept
 * @returns The response data with call session details
 */
export async function acceptCallRequestById(
  queryId: number,
  requestId: number
) {
  try {
    console.log(`Accepting call request ${requestId} for query ${queryId}`);
    
    const response = await fetchWithAuth(
      `${API_BASE_URL}/communication/call/${queryId}/accept-request/${requestId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      let errorMessage = `Failed to accept call request: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        try {
          const textResponse = await response.text();
          errorMessage = textResponse || errorMessage;
        } catch (textError) {
          console.error('Could not read response text:', textError);
        }
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Call request accepted successfully:', result);
    return result;
  } catch (error) {
    console.error('Error accepting call request:', error);
    throw error;
  }
}

/**
 * Get call session details by ID
 * @param callSessionId The ID of the call session
 * @returns The call session details including room URL and tokens
 */
export async function getCallSessionById(callSessionId: number) {
  try {
    console.log(`Fetching call session details for ID ${callSessionId}`);
    
    const response = await fetchWithAuth(
      `${API_BASE_URL}/communication/call-session/${callSessionId}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      let errorMessage = `Failed to fetch call session: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        try {
          const textResponse = await response.text();
          errorMessage = textResponse || errorMessage;
        } catch (textError) {
          console.error('Could not read response text:', textError);
        }
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Call session details retrieved:', result);
    return result;
  } catch (error) {
    console.error('Error fetching call session details:', error);
    throw error;
  }
} 