// Define the API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5005';

// User types
export interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  avatar?: string;
  isActive: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user?: User;
}

export interface CreateUserData {
  username: string;
  password: string;
  name: string;
  email?: string;
  role: 'ADMIN';
  avatar?: string;
}

// Login function
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Get current user
export async function getCurrentUser(token: string): Promise<User> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get user');
    }

    return await response.json();
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
}

// Get all users (admin only)
export async function getAllUsers(token: string): Promise<User[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to get users');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get users error:', error);
    throw error;
  }
}

// Create a new admin user (super admin only)
export async function createUser(token: string, userData: CreateUserData): Promise<User> {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create user');
    }

    return await response.json();
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
} 