'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const apiCall = React.useCallback(async (endpoint: string, data?: Record<string, unknown>) => {
  try {
    // Gunakan URL yang konsisten dengan next.config.ts
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://iptv-monitor-backend-production.up.railway.app';
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        method: data ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
        credentials: 'include', // Penting untuk cookies
      });
    
    // Tambahkan pengecekan response yang lebih baik
    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }, []);
  
  const checkAuth = React.useCallback(async () => {
    try {
      setLoading(true);
      const result = await apiCall('/api/auth/verify');
      
      if (result.success && result.user) {
        setUser({
          id: result.user.userId || result.user.userId,
          username: result.user.username,
          email: result.user.email
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const login = async (email: string, password: string) => {
    try {
      const result = await apiCall('/api/auth/login', {
        identifier: email,
        password: password
      });
      
      if (result.success && result.user) {
        setUser({
          id: result.user.userId,
          username: result.user.username,
          email: result.user.email
        });
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Login failed' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const result = await apiCall('/api/auth/register', {
        username,
        email,
        password
      });
      
      if (result.success && result.user) {
        setUser({
          id: result.user.userId,
          username: result.user.username,
          email: result.user.email
        });
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Registration failed' };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await apiCall('/api/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

// Check authentication on mount
useEffect(() => {
  checkAuth();
}, [checkAuth]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};