import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<User>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('govchain_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('govchain_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('govchain_token');
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get<{ user: User }>('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('govchain_user', JSON.stringify(res.data.user));
      }
    } catch {
      // Token expired or invalid
      setUser(null);
      setToken(null);
      localStorage.removeItem('govchain_token');
      localStorage.removeItem('govchain_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    });

    if (!res.data?.token || !res.data?.user) {
      throw new Error(res.message || 'Login failed');
    }

    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('govchain_token', res.data.token);
    localStorage.setItem('govchain_user', JSON.stringify(res.data.user));
    return res.data.user;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<User> => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', {
      name,
      email,
      password,
      phone,
    });

    if (!res.data?.token || !res.data?.user) {
      throw new Error(res.message || 'Registration failed');
    }

    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('govchain_token', res.data.token);
    localStorage.setItem('govchain_user', JSON.stringify(res.data.user));
    return res.data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('govchain_token');
    localStorage.removeItem('govchain_user');
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        hasRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
