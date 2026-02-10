import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Chatbot from './components/common/Chatbot';
import { trackPageView } from './utils/analytics';

/* ── pages ── */
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import WishlistPage from './pages/WishlistPage';

/**
 * App — root component with routing
 */
export default function App() {
  const location = useLocation();

  // Track page views on route change
  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);

  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:category" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
        </Routes>
      </main>
      <Footer />
      <Chatbot />
    </>
  );
}
