'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, login as apiLogin, getCurrentUser } from '../api/auth';
import Cookies from 'js-cookie';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for token in localStorage and cookies on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fetch user data when token changes
  const fetchUser = async (authToken: string) => {
    try {
      setIsLoading(true);
      const userData = await getCurrentUser(authToken);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiLogin({ username, password });
      const { access_token } = response;
      
      // Save token to localStorage and cookies
      localStorage.setItem('auth_token', access_token);
      Cookies.set('auth_token', access_token, { expires: 1 }); // Expires in 1 day
      
      setToken(access_token);
      
      // Fetch user data
      await fetchUser(access_token);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('auth_token');
    Cookies.remove('auth_token');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;
  const isSuperAdmin = isAuthenticated && user?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isSuperAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 