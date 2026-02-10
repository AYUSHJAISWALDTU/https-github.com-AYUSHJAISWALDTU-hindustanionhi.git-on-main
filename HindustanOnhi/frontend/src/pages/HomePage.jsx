import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiTruck, FiRefreshCw, FiShield, FiHeadphones } from 'react-icons/fi';
import API from '../utils/api';
import ProductCard from '../components/common/ProductCard';
import Loader from '../components/common/Loader';

/**
 * HomePage — hero banner, categories, featured products, offers, features
 */
export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, featRes, newRes] = await Promise.all([
          API.get('/categories'),
          API.get('/products?featured=true&limit=8'),
          API.get('/products?sort=newest&limit=8'),
        ]);
        setCategories(catRes.data.categories);
        setFeatured(featRes.data.products);
        setNewArrivals(newRes.data.products);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      {/* ===== HERO SECTION ===== */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-subtitle">✨ New Festive Collection 2026</span>
            <h1 className="hero-title">
              Celebrate Every Moment in <em>Timeless Ethnic</em> Elegance
            </h1>
            <p className="hero-desc">
              Discover handcrafted sarees, kurtis, lehengas and more — designed for the
              modern Indian woman who embraces tradition with style.
            </p>
            <div className="hero-buttons">
              <Link to="/shop" className="btn btn-primary btn-lg">
                Shop Collection <FiArrowRight />
              </Link>
              <Link to="/shop?category=festive-wear" className="btn btn-secondary btn-lg">
                Festive Wear
              </Link>
            </div>
          </div>

          <div className="hero-image">
            <div className="hero-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&h=1000&fit=crop"
                alt="Indian ethnic fashion"
                loading="eager"
              />
            </div>
            <div className="hero-floating-badge top-right">
              <span style={{ fontSize: '24px' }}>🪷</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>500+</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Unique Designs</div>
              </div>
            </div>
            <div className="hero-floating-badge bottom-left">
              <span style={{ fontSize: '24px' }}>⭐</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>4.8/5</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Customer Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES BAR ===== */}
      <section className="features-bar">
        <div className="features-grid">
          <div className="feature-item">
            <div className="icon"><FiTruck /></div>
            <div>
              <h4>Free Shipping</h4>
              <p>On orders above ₹999</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="icon"><FiRefreshCw /></div>
            <div>
              <h4>Easy Returns</h4>
              <p>7-day return policy</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="icon"><FiShield /></div>
            <div>
              <h4>Secure Payment</h4>
              <p>100% secure checkout</p>
            </div>
          </div>
          <div className="feature-item">
            <div className="icon"><FiHeadphones /></div>
            <div>
              <h4>24/7 Support</h4>
              <p>Dedicated help center</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="categories-section container">
        <div className="section-title">
          <h2>Shop by Category</h2>
          <p>Find your perfect ethnic look</p>
          <div className="divider"></div>
        </div>
        <div className="categories-grid">
          {categories.map((cat) => (
            <Link to={`/shop?category=${cat.slug}`} key={cat._id} className="category-card">
              <img
                src={cat.image || 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400'}
                alt={cat.name}
                loading="lazy"
              />
              <div className="category-card-overlay">
                <h3>{cat.name}</h3>
                <p>Explore →</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="products-section container">
        <div className="section-title">
          <h2>Curated for You</h2>
          <p>Our most loved and bestselling pieces</p>
          <div className="divider"></div>
        </div>
        <div className="products-grid">
          {featured.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
        <div className="text-center mt-3">
          <Link to="/shop" className="btn btn-secondary">
            View All Products <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* ===== OFFERS BANNER ===== */}
      <section className="offers-banner">
        <div className="container">
          <h2>🎊 Festive Season Sale</h2>
          <p>Up to 40% off on select ethnic wear. Limited time only!</p>
          <Link to="/shop" className="btn btn-gold btn-lg">
            Shop the Sale <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* ===== NEW ARRIVALS ===== */}
      <section className="products-section container">
        <div className="section-title">
          <h2>New Arrivals</h2>
          <p>Fresh designs just added to our collection</p>
          <div className="divider"></div>
        </div>
        <div className="products-grid">
          {newArrivals.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>

      {/* ===== NEWSLETTER / CTA ===== */}
      <section style={{
        background: 'var(--color-bg-alt)',
        padding: '60px 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', marginBottom: '8px' }}>
            Stay Connected
          </h2>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '24px' }}>
            Subscribe for exclusive collections, offers & styling tips
          </p>
          <div style={{
            display: 'flex',
            maxWidth: '480px',
            margin: '0 auto',
            gap: '10px',
          }}>
            <input
              type="email"
              placeholder="Enter your email"
              className="form-control"
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary">Subscribe</button>
          </div>
        </div>
      </section>
    </div>
  );
}
