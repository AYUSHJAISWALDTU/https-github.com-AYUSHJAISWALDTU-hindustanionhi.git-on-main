import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('admin_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  // Verify session on mount
  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setAdmin(data.user);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
      } catch {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    setAdmin(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore */ }
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
