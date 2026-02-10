import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

/**
 * AuthProvider — manages user authentication state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);

  // Load user from token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        fetchMe();
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Fetch current user profile
  const fetchMe = async () => {
    try {
      const { data } = await API.get('/auth/me');
      setUser(data.user);
      setWishlist(data.user.wishlist || []);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch {
      // Token expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  // Register
  const register = async (name, email, password, phone) => {
    const { data } = await API.post('/auth/register', { name, email, password, phone });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    toast.success('Welcome to HindustanOnhi! 🪷');
    return data;
  };

  // Login
  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    toast.success('Welcome back! 🙏');
    return data;
  };

  // Logout
  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch { /* ignore */ }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setWishlist([]);
    toast.success('Logged out successfully');
  };

  // Update profile
  const updateProfile = async (profileData) => {
    const { data } = await API.put('/auth/profile', profileData);
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
    toast.success('Profile updated!');
    return data;
  };

  // Toggle wishlist
  const toggleWishlist = useCallback(async (productId) => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    try {
      const { data } = await API.put(`/auth/wishlist/${productId}`);
      setWishlist(data.wishlist);
      const isAdded = data.wishlist.some((item) => (item._id || item) === productId);
      toast.success(isAdded ? 'Added to wishlist ❤️' : 'Removed from wishlist');
    } catch (err) {
      toast.error('Failed to update wishlist');
    }
  }, [user]);

  // Check if product is in wishlist
  const isInWishlist = useCallback((productId) => {
    return wishlist.some((item) => (item._id || item) === productId);
  }, [wishlist]);

  // Addresses
  const updateAddress = async (addressData) => {
    const { data } = await API.put('/auth/address', addressData);
    setUser((prev) => ({ ...prev, addresses: data.addresses }));
    toast.success('Address saved!');
    return data;
  };

  const deleteAddress = async (addressId) => {
    const { data } = await API.delete(`/auth/address/${addressId}`);
    setUser((prev) => ({ ...prev, addresses: data.addresses }));
    toast.success('Address removed');
    return data;
  };

  const value = {
    user,
    loading,
    wishlist,
    register,
    login,
    logout,
    updateProfile,
    toggleWishlist,
    isInWishlist,
    updateAddress,
    deleteAddress,
    fetchMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
