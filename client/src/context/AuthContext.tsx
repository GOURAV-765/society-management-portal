import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-react';
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
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(false);

  useEffect(() => {
    const syncSession = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        setIsLoadingProfile(false);
        return;
      }

      setIsLoadingProfile(true);
      try {
        const clerkToken = await getToken();
        if (clerkToken) {
          localStorage.setItem('auth_token', clerkToken);
          setToken(clerkToken);

          // Fetch local user details from backend
          const response = await api.get('/auth/me');
          if (response.data?.success) {
            setUser(response.data.user);
          } else {
            console.error('Failed to retrieve user profile from backend');
            localStorage.removeItem('auth_token');
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Failed to sync Clerk authentication with backend:', error);
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    syncSession();
  }, [isLoaded, isSignedIn, getToken, clerkUser]);

  // login is deprecated but we keep the signature for backwards compatibility
  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out from Clerk:', error);
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
    isLoading: !isLoaded || isLoadingProfile,
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
