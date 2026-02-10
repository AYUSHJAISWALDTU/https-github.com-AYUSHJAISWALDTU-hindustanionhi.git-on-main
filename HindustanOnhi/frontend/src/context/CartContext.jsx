import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

/**
 * CartProvider — manages shopping cart state
 */
export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], totalPrice: 0, totalItems: 0 });
  const [loading, setLoading] = useState(false);

  // Fetch cart when user logs in
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart({ items: [], totalPrice: 0, totalItems: 0 });
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/cart');
      setCart(data.cart);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const addToCart = useCallback(async (productId, size, color, quantity = 1) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return false;
    }
    try {
      const { data } = await API.post('/cart', { productId, size, color, quantity });
      setCart(data.cart);
      toast.success('Added to cart! 🛒');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
      return false;
    }
  }, [user]);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    try {
      const { data } = await API.put(`/cart/${itemId}`, { quantity });
      setCart(data.cart);
    } catch (err) {
      toast.error('Failed to update quantity');
    }
  }, []);

  const removeItem = useCallback(async (itemId) => {
    try {
      const { data } = await API.delete(`/cart/${itemId}`);
      setCart(data.cart);
      toast.success('Item removed from cart');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      await API.delete('/cart');
      setCart({ items: [], totalPrice: 0, totalItems: 0 });
    } catch {
      // ignore
    }
  }, []);

  const value = {
    cart,
    loading,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    fetchCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
