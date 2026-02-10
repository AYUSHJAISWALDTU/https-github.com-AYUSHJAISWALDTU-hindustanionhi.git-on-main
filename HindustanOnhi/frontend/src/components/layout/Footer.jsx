import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook, FiYoutube } from 'react-icons/fi';

/**
 * Footer — site-wide footer with brand info, links, and social
 */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        {/* Brand */}
        <div className="footer-brand">
          <h3>🪷 Hindustan<span>Onhi</span></h3>
          <p>
            Celebrating the timeless beauty of Indian ethnic fashion. From handwoven
            sarees to modern kurtis — discover pieces that tell a story of tradition
            and elegance.
          </p>
          <div className="footer-social">
            <a href="#" aria-label="Instagram"><FiInstagram /></a>
            <a href="#" aria-label="Facebook"><FiFacebook /></a>
            <a href="#" aria-label="Twitter"><FiTwitter /></a>
            <a href="#" aria-label="YouTube"><FiYoutube /></a>
          </div>
        </div>

        {/* Shop */}
        <div className="footer-col">
          <h4>Shop</h4>
          <Link to="/shop?category=sarees">Sarees</Link>
          <Link to="/shop?category=kurtis">Kurtis</Link>
          <Link to="/shop?category=lehengas">Lehengas</Link>
          <Link to="/shop?category=dupattas">Dupattas</Link>
          <Link to="/shop?category=festive-wear">Festive Wear</Link>
          <Link to="/shop">All Products</Link>
        </div>

        {/* Help */}
        <div className="footer-col">
          <h4>Help</h4>
          <a href="#">Size Guide</a>
          <a href="#">Shipping Info</a>
          <a href="#">Returns & Exchange</a>
          <a href="#">FAQs</a>
          <a href="#">Contact Us</a>
        </div>

        {/* Company */}
        <div className="footer-col">
          <h4>Company</h4>
          <a href="#">About Us</a>
          <a href="#">Our Story</a>
          <a href="#">Blog</a>
          <a href="#">Careers</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms & Conditions</a>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} HindustanOnhi. All rights reserved. Made with 🪷 in India.
      </div>
    </footer>
  );
}
