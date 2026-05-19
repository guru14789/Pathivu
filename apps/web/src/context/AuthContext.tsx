import React, { createContext, useContext, useState, useEffect } from 'react';
import { ability } from '../lib/ability';
import axios from 'axios';

// Setup Axios request interceptor to attach JWT token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bewell_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface User {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  hospital_id: string | null;
  permissions: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('bewell_token');
        if (!token) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        const response = await axios.get('/api/auth/me');
        const data = response.data.data || response.data;
        setUser(data);
        // Update ability
        ability.update(data.permissions || []);
      } catch (error) {
        setUser(null);
        localStorage.removeItem('bewell_token');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = (apiResponse: any) => {
    const data = apiResponse.data || apiResponse;
    const user = data.user;
    const token = data.accessToken;

    if (token) {
      localStorage.setItem('bewell_token', token);
    }

    setUser(user);
    if (user && user.permissions) {
      ability.update(user.permissions);
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) {}
    localStorage.removeItem('bewell_token');
    setUser(null);
    ability.update([]);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
