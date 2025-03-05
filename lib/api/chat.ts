import { fetchWithAuth } from './fetch-utils';

// Define the API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5005';

// Chat message types
export interface ChatMessage {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  sender: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
    role: string;
  };
  recipientId?: number;
  recipient?: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
    role: string;
  };
  donorQueryId?: number;
  donorQuery?: {
    id: number;
    sid: string;
    donor: string;
    donorId: string;
    test: string;
    stage: string;
    status: string;
  };
  fcmToken?: string;
}

export interface CreateChatMessageData {
  content: string;
  senderId: number;
  recipientId?: number;
  donorQueryId?: number;
  fcmToken?: string;
}

// Send a chat message
export async function sendChatMessage(
  messageData: CreateChatMessageData
): Promise<ChatMessage> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/chat/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      let errorMessage = `Failed to send message: ${response.status} ${response.statusText}`;
      try {
        // Try to parse the error response as JSON, but handle the case where it's not valid JSON
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // If parsing fails, use the response text or a default message
        try {
          const textResponse = await response.text();
          errorMessage = textResponse || errorMessage;
        } catch (textError) {
          console.error('Could not read response text:', textError);
        }
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Send message error:', error);
    throw error;
  }
}

// Get chat messages for a donor query
export async function getChatMessagesByDonorQuery(
  donorQueryId: number
): Promise<ChatMessage[]> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/chat/messages/donor-query/${donorQueryId}`);

    if (!response.ok) {
      let errorMessage = `Failed to get messages: ${response.status} ${response.statusText}`;
      try {
        // Try to parse the error response as JSON, but handle the case where it's not valid JSON
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // If parsing fails, use the response text or a default message
        try {
          const textResponse = await response.text();
          errorMessage = textResponse || errorMessage;
        } catch (textError) {
          console.error('Could not read response text:', textError);
        }
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Get messages error:', error);
    throw error;
  }
}

// Get chat messages between two users
export async function getChatMessagesBetweenUsers(
  userId1: number,
  userId2: number
): Promise<ChatMessage[]> {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/chat/messages/between/${userId1}/${userId2}`);

    if (!response.ok) {
      let errorMessage = `Failed to get messages: ${response.status} ${response.statusText}`;
      try {
        // Try to parse the error response as JSON, but handle the case where it's not valid JSON
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // If parsing fails, use the response text or a default message
        try {
          const textResponse = await response.text();
          errorMessage = textResponse || errorMessage;
        } catch (textError) {
          console.error('Could not read response text:', textError);
        }
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Get messages error:', error);
    throw error;
  }
}

// Get chat messages with filters
export async function getChatMessages(
  filters: {
    donorQueryId?: number;
    senderId?: number;
    recipientId?: number;
    limit?: number;
    offset?: number;
  }
): Promise<ChatMessage[]> {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetchWithAuth(`${API_BASE_URL}/chat/messages?${queryParams.toString()}`);

    if (!response.ok) {
      let errorMessage = `Failed to get messages: ${response.status} ${response.statusText}`;
      try {
        // Try to parse the error response as JSON, but handle the case where it's not valid JSON
        const errorData = await response.json();
        if (errorData && errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // If parsing fails, use the response text or a default message
        try {
          const textResponse = await response.text();
          errorMessage = textResponse || errorMessage;
        } catch (textError) {
          console.error('Could not read response text:', textError);
        }
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error('Get messages error:', error);
    throw error;
  }
} 