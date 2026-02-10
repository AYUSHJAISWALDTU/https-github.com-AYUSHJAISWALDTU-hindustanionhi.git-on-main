import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiHeart, FiShoppingBag, FiTruck, FiRefreshCw, FiShield } from 'react-icons/fi';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice, getDiscount, renderStars, formatDate } from '../utils/helpers';
import ProductCard from '../components/common/ProductCard';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

/**
 * ProductDetailPage — full product view with gallery, sizes, reviews, related
 */
export default function ProductDetailPage() {
  const { slug } = useParams();
  const { toggleWishlist, isInWishlist, user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/products/slug/${slug}`);
        setProduct(data.product);

        // Set default selections
        if (data.product.sizes?.length) {
          const inStock = data.product.sizes.find((s) => s.stock > 0);
          if (inStock) setSelectedSize(inStock.size);
        }
        if (data.product.colors?.length) {
          setSelectedColor(data.product.colors[0].name);
        }

        // Fetch related & reviews
        const [relatedRes, reviewsRes] = await Promise.all([
          API.get(`/products/${data.product._id}/related`),
          API.get(`/reviews/${data.product._id}`),
        ]);
        setRelated(relatedRes.data.products);
        setReviews(reviewsRes.data.reviews);
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    setActiveImage(0);
    setQuantity(1);
    window.scrollTo(0, 0);
  }, [slug]);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    await addToCart(product._id, selectedSize, selectedColor, quantity);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to write a review');
      return;
    }
    setSubmittingReview(true);
    try {
      await API.post(`/reviews/${product._id}`, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      // Refresh reviews
      const { data } = await API.get(`/reviews/${product._id}`);
      setReviews(data.reviews);
      setReviewTitle('');
      setReviewComment('');
      setReviewRating(5);
      toast.success('Review submitted! Thank you 🙏');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <Loader />;
  if (!product) {
    return (
      <div className="empty-state">
        <div className="icon">😕</div>
        <h3>Product not found</h3>
        <p>The product you're looking for doesn't exist.</p>
        <Link to="/shop" className="btn btn-primary">Browse Products</Link>
      </div>
    );
  }

  const discount = getDiscount(product.price, product.comparePrice);

  return (
    <div className="product-detail container">
      <div className="product-detail-grid">
        {/* ===== IMAGE GALLERY ===== */}
        <div className="product-gallery">
          <div className="product-gallery-main">
            <img
              src={product.images[activeImage]?.url || 'https://via.placeholder.com/600x800'}
              alt={product.images[activeImage]?.alt || product.name}
            />
          </div>
          {product.images.length > 1 && (
            <div className="product-gallery-thumbs">
              {product.images.map((img, i) => (
                <div
                  key={i}
                  className={`product-gallery-thumb ${i === activeImage ? 'active' : ''}`}
                  onClick={() => setActiveImage(i)}
                >
                  <img src={img.url} alt={img.alt || `View ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== PRODUCT INFO ===== */}
        <div className="product-info">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <Link to="/">Home</Link> / <Link to="/shop">Shop</Link>
            {product.category && (
              <> / <Link to={`/shop?category=${product.category.slug}`}>{product.category.name}</Link></>
            )}
          </div>

          <h1>{product.name}</h1>

          {/* Rating */}
          {product.ratingsCount > 0 && (
            <div className="rating-row">
              <span className="stars">{renderStars(product.ratingsAverage)}</span>
              <span>{product.ratingsAverage} ({product.ratingsCount} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="product-price-block">
            <span className="price">{formatPrice(product.price)}</span>
            {product.comparePrice > product.price && (
              <>
                <span className="compare">{formatPrice(product.comparePrice)}</span>
                <span className="off">{discount}% OFF</span>
              </>
            )}
          </div>

          {/* Sizes */}
          {product.sizes?.length > 0 && (
            <div className="product-sizes">
              <h3>Select Size</h3>
              <div className="size-options">
                {product.sizes.map((s) => (
                  <button
                    key={s.size}
                    className={`size-option ${selectedSize === s.size ? 'active' : ''} ${s.stock === 0 ? 'out-of-stock' : ''}`}
                    onClick={() => s.stock > 0 && setSelectedSize(s.size)}
                    disabled={s.stock === 0}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div className="product-colors">
              <h3>Color: {selectedColor}</h3>
              <div className="color-options">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    className={`color-option ${selectedColor === c.name ? 'active' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setSelectedColor(c.name)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Quantity</h3>
            <div className="cart-item-quantity">
              <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
              <span>{quantity}</span>
              <button className="qty-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="product-actions">
            <button className="btn btn-primary btn-lg" onClick={handleAddToCart}>
              <FiShoppingBag /> Add to Cart
            </button>
            <button
              className={`btn btn-secondary btn-lg`}
              onClick={() => toggleWishlist(product._id)}
            >
              <FiHeart fill={isInWishlist(product._id) ? '#D32F2F' : 'none'} />
              {isInWishlist(product._id) ? 'Wishlisted' : 'Wishlist'}
            </button>
          </div>

          {/* Description */}
          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          {/* Meta */}
          <div className="product-meta">
            {product.fabric && <span><strong>Fabric:</strong> {product.fabric}</span>}
            {product.occasion && <span><strong>Occasion:</strong> {product.occasion}</span>}
            {product.tags?.length > 0 && (
              <span><strong>Tags:</strong> {product.tags.join(', ')}</span>
            )}
          </div>

          {/* Features */}
          <div className="product-features">
            <div className="product-feature">
              <div className="icon"><FiTruck /></div>
              <p>Free Shipping above ₹999</p>
            </div>
            <div className="product-feature">
              <div className="icon"><FiRefreshCw /></div>
              <p>7-day Easy Returns</p>
            </div>
            <div className="product-feature">
              <div className="icon"><FiShield /></div>
              <p>100% Authentic</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== REVIEWS ===== */}
      <div className="reviews-section">
        <h2>Customer Reviews ({reviews.length})</h2>

        {/* Review Form */}
        {user && (
          <form className="review-form" onSubmit={handleSubmitReview}>
            <h3>Write a Review</h3>
            <div className="star-input">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={star <= reviewRating ? 'filled' : ''}
                  onClick={() => setReviewRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="Review title (optional)"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <textarea
                className="form-control"
                placeholder="Share your experience..."
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submittingReview}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '20px 0' }}>
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="review-card">
              <div className="review-header">
                <div className="review-avatar">
                  {(review.user?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="review-author">{review.user?.name || 'Anonymous'}</div>
                  <div className="review-date">{formatDate(review.createdAt)}</div>
                </div>
              </div>
              <div className="review-rating">{renderStars(review.rating)}</div>
              {review.title && <strong style={{ fontSize: '14px' }}>{review.title}</strong>}
              <p className="review-text">{review.comment}</p>
            </div>
          ))
        )}
      </div>

      {/* ===== RELATED PRODUCTS ===== */}
      {related.length > 0 && (
        <section className="products-section">
          <div className="section-title">
            <h2>You May Also Like</h2>
            <div className="divider"></div>
          </div>
          <div className="products-grid">
            {related.slice(0, 4).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
