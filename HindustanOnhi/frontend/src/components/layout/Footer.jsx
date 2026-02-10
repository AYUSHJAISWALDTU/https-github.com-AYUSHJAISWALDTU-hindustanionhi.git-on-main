import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook, FiYoutube } from 'react-icons/fi';

/**
 * Footer — site-wide footer with brand info, links, and social
 */
export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-grid">
        {/* Brand */}
        <div className="footer-brand">
          <h3>🪷 Hindustan<span>Onhi</span></h3>
          <p>
            Celebrating the timeless beauty of Indian ethnic fashion. From handwoven
            sarees to modern kurtis — discover handcrafted pieces that tell a story of tradition
            and elegance. Made in India with love.
          </p>
          <div className="footer-social">
            <a href="https://www.instagram.com/hindustanionhi" target="_blank" rel="noopener noreferrer" aria-label="Follow Hindustani Odhni on Instagram"><FiInstagram /></a>
            <a href="https://www.facebook.com/hindustanionhi" target="_blank" rel="noopener noreferrer" aria-label="Follow Hindustani Odhni on Facebook"><FiFacebook /></a>
            <a href="https://twitter.com/hindustanionhi" target="_blank" rel="noopener noreferrer" aria-label="Follow Hindustani Odhni on Twitter"><FiTwitter /></a>
            <a href="https://www.youtube.com/@hindustanionhi" target="_blank" rel="noopener noreferrer" aria-label="Subscribe to Hindustani Odhni on YouTube"><FiYoutube /></a>
          </div>
        </div>

        {/* Shop */}
        <nav className="footer-col" aria-label="Shop categories">
          <h4>Shop</h4>
          <Link to="/shop?category=sarees">Sarees</Link>
          <Link to="/shop?category=kurtis">Kurtis</Link>
          <Link to="/shop?category=lehengas">Lehengas</Link>
          <Link to="/shop?category=dupattas">Dupattas &amp; Odhnis</Link>
          <Link to="/shop?category=festive-wear">Festive Wear</Link>
          <Link to="/shop">All Products</Link>
        </nav>

        {/* Help */}
        <nav className="footer-col" aria-label="Customer help">
          <h4>Help</h4>
          <Link to="/shop">Size Guide</Link>
          <Link to="/shop">Shipping Info</Link>
          <Link to="/shop">Returns &amp; Exchange</Link>
          <Link to="/shop">FAQs</Link>
          <Link to="/shop">Contact Us</Link>
        </nav>

        {/* Company */}
        <nav className="footer-col" aria-label="Company info">
          <h4>Company</h4>
          <Link to="/">About Us</Link>
          <Link to="/">Our Story</Link>
          <Link to="/">Blog</Link>
          <Link to="/">Careers</Link>
          <Link to="/">Privacy Policy</Link>
          <Link to="/">Terms &amp; Conditions</Link>
        </nav>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Hindustani Odhni. All rights reserved. Made with 🪷 in India.
      </div>
    </footer>
  );
}
