import React, { createContext, useContext, useState, useEffect } from 'react';
import { ability } from '../lib/ability';
import axios from 'axios';

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
        const response = await axios.get('/api/auth/me');
        setUser(response.data);
        // Update ability
        ability.update(response.data.permissions || []);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = (userData: any) => {
    setUser(userData.user);
    if (userData.user.permissions) {
      ability.update(userData.user.permissions);
    }
  };

  const logout = async () => {
    await axios.post('/api/auth/logout');
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
