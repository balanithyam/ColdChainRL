import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService, setAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
  loginDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  const loginDemo = async () => {
    try {
      const res = await authService.login({
        email: 'operator@coldchain.ai',
        password: 'Password123!'
      });
      setAuthToken(res.data.access_token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      localStorage.removeItem('logged_out');
      setToken(res.data.access_token);
      setUser(res.data.user);
    } catch (e) {
      console.error('Demo auto-login error:', e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const isLoggedOut = localStorage.getItem('logged_out') === 'true';

      if (storedToken) {
        try {
          setAuthToken(storedToken);
          const res = await authService.getMe();
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
          setToken(storedToken);
          setLoading(false);
          return;
        } catch (err: any) {
          console.warn('Stored token invalid or expired. Resetting session...');
          setAuthToken(null);
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      // If user hasn't explicitly logged out, seamlessly authenticate with default demo credentials
      if (!isLoggedOut) {
        try {
          await loginDemo();
        } catch (e) {
          console.error('Initial demo auth failed:', e);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    setAuthToken(newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.removeItem('logged_out');
    setToken(newToken);
    setUser(newUser);
    setLoading(false);
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.setItem('logged_out', 'true');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        loading,
        loginDemo
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
