import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import ProductCard from '../components/common/ProductCard';
import Loader from '../components/common/Loader';
import SEO from '../components/common/SEO';
import { FiHeart } from 'react-icons/fi';

/**
 * WishlistPage — shows all products the user has wishlisted
 */
export default function WishlistPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const fetchWishlist = async () => {
      try {
        // user.wishlist contains product IDs – fetch full product details
        if (user.wishlist && user.wishlist.length > 0) {
          const ids = user.wishlist.map((id) => (typeof id === 'object' ? id._id : id));
          const promises = ids.map((id) => api.get(`/products/${id}`).catch(() => null));
          const results = await Promise.all(promises);
          setProducts(results.filter(Boolean).map((r) => r.data.data));
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [user, navigate]);

  if (loading) return <Loader />;

  return (
    <div className="wishlist-page">
      <SEO title="My Wishlist" description="Your wishlisted items at Hindustani Odhni. Save your favorite ethnic wear pieces and shop when you're ready." canonical="/wishlist" noIndex={true} />
      <div className="container">
        <h1 className="page-title">My Wishlist</h1>

        {products.length === 0 ? (
          <div className="empty-state">
            <FiHeart size={56} />
            <h3>Your wishlist is empty</h3>
            <p>Save items you love to your wishlist and they'll show up here.</p>
            <button className="btn btn-primary" onClick={() => navigate('/shop')}>
              Explore Collection
            </button>
          </div>
        ) : (
          <>
            <p className="wishlist-count">{products.length} item{products.length !== 1 && 's'} saved</p>
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
