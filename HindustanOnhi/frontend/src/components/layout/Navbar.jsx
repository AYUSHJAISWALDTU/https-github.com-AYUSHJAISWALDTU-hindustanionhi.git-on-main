import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiSearch, FiHeart, FiShoppingBag, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

/**
 * Navbar — sticky navigation with brand, links, and action buttons
 */
export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { cart } = useCart();
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/shop', label: 'Shop All' },
    { path: '/shop?category=sarees', label: 'Sarees' },
    { path: '/shop?category=kurtis', label: 'Kurtis' },
    { path: '/shop?category=lehengas', label: 'Lehengas' },
    { path: '/shop?category=festive-wear', label: 'Festive' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname + location.search === path;
  };

  return (
    <nav className="navbar">
      {/* Top Announcement Bar */}
      <div className="navbar-top">
        ✨ Free Shipping on Orders Above ₹999 | Use Code <strong>NAMASTE20</strong> for 20% Off ✨
      </div>

      {/* Main Nav */}
      <div className="navbar-main">
        {/* Logo */}
        <Link to="/" className="navbar-logo" aria-label="Hindustani Odhni — Home">
          <span className="logo-icon">🪷</span>
          <span className="logo-text">Hindustan<span>Onhi</span></span>
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={isActive(link.path) ? 'active' : ''}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          <Link to="/shop" className="navbar-action-btn" title="Search">
            <FiSearch />
          </Link>
          <Link to="/wishlist" className="navbar-action-btn" title="Wishlist">
            <FiHeart />
          </Link>
          <Link to="/cart" className="navbar-action-btn" title="Cart">
            <FiShoppingBag />
            {cart.totalItems > 0 && (
              <span className="badge-count">{cart.totalItems}</span>
            )}
          </Link>
          <Link
            to={user ? '/dashboard' : '/login'}
            className="navbar-action-btn"
            title={user ? 'Dashboard' : 'Login'}
          >
            <FiUser />
          </Link>

          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
            <FiMenu />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <Link to="/" className="navbar-logo" onClick={() => setMobileOpen(false)} aria-label="Hindustani Odhni — Home">
            <span className="logo-icon">🪷</span>
            <span className="logo-text">Hindustan<span>Onhi</span></span>
          </Link>
          <button className="mobile-menu-close" onClick={() => setMobileOpen(false)}>
            <FiX />
          </button>
        </div>
        <div className="mobile-menu-links">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)', margin: '8px 0' }} />
          <Link to="/wishlist" onClick={() => setMobileOpen(false)}>❤️ Wishlist</Link>
          <Link to="/cart" onClick={() => setMobileOpen(false)}>🛒 Cart ({cart.totalItems})</Link>
          <Link to={user ? '/dashboard' : '/login'} onClick={() => setMobileOpen(false)}>
            👤 {user ? 'My Account' : 'Login / Register'}
          </Link>
        </div>
      </div>
    </nav>
  );
}
