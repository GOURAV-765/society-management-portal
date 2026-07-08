import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

interface User {
  id: string;
  email: string;
  status: string;
  societyId: string;
  societyName: string;
  role: {
    id: string;
    name: string;
  };
  permissions: string[];
  member: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    profileImage: string | null;
  } | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data?.success) {
          setUser(response.data.user);
        } else {
          // Token is invalid, clear it
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      } catch (error) {
        console.error('Failed to restore authentication session:', error);
        localStorage.removeItem('auth_token');
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Error during backend logout:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      window.location.href = '/login';
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role.name === 'Core Admin') return true;
    return user.permissions.includes(permission);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
