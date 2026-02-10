import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiHeart, FiShoppingBag, FiTruck, FiRefreshCw, FiShield,
  FiChevronDown, FiChevronUp, FiX, FiCheck, FiPackage,
} from 'react-icons/fi';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice, getDiscount, renderStars, formatDate } from '../utils/helpers';
import { trackViewProduct, trackAddToCart as trackAddToCartEvent } from '../utils/analytics';
import ProductCard from '../components/common/ProductCard';
import Loader from '../components/common/Loader';
import SEO from '../components/common/SEO';
import toast from 'react-hot-toast';

/* ─── Recently viewed helper ─── */
const MAX_RECENT = 10;
const getRecentlyViewed = () => {
  try { return JSON.parse(localStorage.getItem('recentlyViewed') || '[]'); } catch { return []; }
};
const addToRecentlyViewed = (product) => {
  const list = getRecentlyViewed().filter((p) => p._id !== product._id);
  list.unshift({
    _id: product._id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    comparePrice: product.comparePrice,
    images: product.images?.slice(0, 1),
    ratingsAverage: product.ratingsAverage,
    ratingsCount: product.ratingsCount,
  });
  localStorage.setItem('recentlyViewed', JSON.stringify(list.slice(0, MAX_RECENT)));
};

/**
 * ProductDetailPage — full product view with gallery, sizes, size chart,
 * fabric & care, style-with, recently viewed, accordion details
 */
export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toggleWishlist, isInWishlist, user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);

  /* ── Accordion state ── */
  const [openAccordion, setOpenAccordion] = useState('details');

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const toggleAccordion = useCallback((key) => {
    setOpenAccordion((prev) => (prev === key ? '' : key));
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/products/slug/${slug}`);
        setProduct(data.product);
        addToRecentlyViewed(data.product);
        trackViewProduct(data.product);

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
    setOpenAccordion('details');
    window.scrollTo(0, 0);

    // Load recently viewed (exclude current slug)
    setRecentlyViewed(getRecentlyViewed().filter((p) => p.slug !== slug));
  }, [slug]);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error('Please select a size');
      return;
    }
    await addToCart(product._id, selectedSize, selectedColor, quantity);
    trackAddToCartEvent(product, selectedSize, selectedColor, quantity);
  };

  const handleBuyNow = async () => {
    if (!selectedSize) { toast.error('Please select a size'); return; }
    await addToCart(product._id, selectedSize, selectedColor, quantity);
    trackAddToCartEvent(product, selectedSize, selectedColor, quantity);
    navigate('/checkout');
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
  const selectedSizeObj = product.sizes?.find((s) => s.size === selectedSize);
  const stockLeft = selectedSizeObj?.stock ?? null;
  const hasSizeChart = product.sizeChart && product.sizeChart.length > 0;
  const hasFabricDetails = product.fabricDetails && (product.fabricDetails.fabric || product.fabricDetails.lining || product.fabricDetails.transparency || product.fabricDetails.washCare?.length);
  const hasModelInfo = product.modelInfo && (product.modelInfo.height || product.modelInfo.wearingSize);

  return (
    <div className="product-detail container">
      <SEO
        title={`${product.name}${product.fabric ? ' — ' + product.fabric : ''}${product.occasion ? ' for ' + product.occasion.charAt(0).toUpperCase() + product.occasion.slice(1) + ' Wear' : ''}`}
        description={product.description?.substring(0, 155) + (product.description?.length > 155 ? '...' : '')}
        keywords={[
          product.name,
          product.fabric,
          product.category?.name,
          product.occasion,
          ...(product.tags || []),
          'Hindustani Odhni',
          'buy online',
          'Indian ethnic wear',
        ].filter(Boolean).join(', ')}
        canonical={`/product/${product.slug}`}
        image={product.images?.[0]?.url}
        type="product"
        product={product}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Shop', url: '/shop' },
          ...(product.category ? [{ name: product.category.name, url: `/shop?category=${product.category.slug}` }] : []),
          { name: product.name },
        ]}
      />

      <div className="product-detail-grid">
        {/* ===== IMAGE GALLERY ===== */}
        <div className="product-gallery">
          <div className="product-gallery-main" onClick={() => setImageZoom(true)} style={{ cursor: 'zoom-in' }}>
            <img
              src={product.images[activeImage]?.url || 'https://via.placeholder.com/600x800'}
              alt={product.images[activeImage]?.alt || product.name}
            />
            {discount > 0 && (
              <span className="product-badge-detail">{discount}% OFF</span>
            )}
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
            <span className="tax-info">Inclusive of all taxes</span>
          </div>

          {/* Sizes */}
          {product.sizes?.length > 0 && (
            <div className="product-sizes">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Select Size</h3>
                {hasSizeChart && (
                  <button type="button" className="size-chart-link" onClick={() => setShowSizeChart(true)}>
                    📏 Size Chart
                  </button>
                )}
              </div>
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
              {stockLeft !== null && stockLeft > 0 && stockLeft <= 5 && (
                <p className="low-stock-warning">⚡ Only {stockLeft} left in stock</p>
              )}
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
            <button className="btn btn-accent btn-lg" onClick={handleBuyNow}>
              ⚡ Buy Now
            </button>
            <button
              className="btn btn-secondary btn-icon-only"
              onClick={() => toggleWishlist(product._id)}
              title={isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <FiHeart fill={isInWishlist(product._id) ? '#D32F2F' : 'none'} color={isInWishlist(product._id) ? '#D32F2F' : undefined} />
            </button>
          </div>

          {/* Delivery & Trust Badges */}
          <div className="product-trust-badges">
            <div className="trust-badge"><FiTruck /> <span>Delivery in 3–5 working days</span></div>
            <div className="trust-badge"><FiRefreshCw /> <span>Easy Returns</span></div>
            <div className="trust-badge"><FiPackage /> <span>COD Available</span></div>
            <div className="trust-badge"><FiShield /> <span>100% Authentic</span></div>
            <div className="trust-badge">🇮🇳 <span>Made in India</span></div>
          </div>

          {/* Model Info */}
          {hasModelInfo && (
            <div className="model-info-bar">
              {product.modelInfo.height && <span>Model height: {product.modelInfo.height}</span>}
              {product.modelInfo.wearingSize && <span>Wearing size: {product.modelInfo.wearingSize}</span>}
            </div>
          )}

          {/* ═══════ ACCORDION DETAILS ═══════ */}
          <div className="product-accordion">
            {/* Product Details */}
            <div className={`accordion-item ${openAccordion === 'details' ? 'open' : ''}`}>
              <button className="accordion-header" onClick={() => toggleAccordion('details')}>
                <span>Product Details</span>
                {openAccordion === 'details' ? <FiChevronUp /> : <FiChevronDown />}
              </button>
              {openAccordion === 'details' && (
                <div className="accordion-body">
                  <p>{product.description}</p>
                  <div className="detail-grid">
                    {product.fabric && <div><strong>Fabric:</strong> {product.fabric}</div>}
                    {product.occasion && <div><strong>Occasion:</strong> {product.occasion}</div>}
                    {product.tags?.length > 0 && <div><strong>Tags:</strong> {product.tags.join(', ')}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Fabric & Care */}
            {hasFabricDetails && (
              <div className={`accordion-item ${openAccordion === 'fabric' ? 'open' : ''}`}>
                <button className="accordion-header" onClick={() => toggleAccordion('fabric')}>
                  <span>Fabric & Care</span>
                  {openAccordion === 'fabric' ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                {openAccordion === 'fabric' && (
                  <div className="accordion-body">
                    <div className="detail-grid">
                      {product.fabricDetails.fabric && <div><strong>Fabric:</strong> {product.fabricDetails.fabric}</div>}
                      {product.fabricDetails.lining && <div><strong>Lining:</strong> {product.fabricDetails.lining}</div>}
                      {product.fabricDetails.transparency && <div><strong>Transparency:</strong> {product.fabricDetails.transparency}</div>}
                    </div>
                    {product.fabricDetails.washCare?.length > 0 && (
                      <div className="wash-care-list">
                        <strong>Care Instructions:</strong>
                        <ul>
                          {product.fabricDetails.washCare.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Size & Fit */}
            {(hasSizeChart || hasModelInfo) && (
              <div className={`accordion-item ${openAccordion === 'sizefit' ? 'open' : ''}`}>
                <button className="accordion-header" onClick={() => toggleAccordion('sizefit')}>
                  <span>Size & Fit</span>
                  {openAccordion === 'sizefit' ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                {openAccordion === 'sizefit' && (
                  <div className="accordion-body">
                    {hasModelInfo && (
                      <p style={{ marginBottom: 12, color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                        {product.modelInfo.height && <>Model height: <strong>{product.modelInfo.height}</strong> · </>}
                        {product.modelInfo.wearingSize && <>Wearing size: <strong>{product.modelInfo.wearingSize}</strong></>}
                      </p>
                    )}
                    {hasSizeChart && (
                      <div className="size-chart-table-wrap">
                        <table className="size-chart-table">
                          <thead>
                            <tr><th>Size</th><th>Bust</th><th>Waist</th><th>Hip</th><th>Length</th></tr>
                          </thead>
                          <tbody>
                            {product.sizeChart.map((row, i) => (
                              <tr key={i} className={selectedSize === row.size ? 'highlight' : ''}>
                                <td><strong>{row.size}</strong></td>
                                <td>{row.bust || '—'}</td>
                                <td>{row.waist || '—'}</td>
                                <td>{row.hip || '—'}</td>
                                <td>{row.length || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="chart-note">All measurements are in inches</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Shipping & Returns */}
            <div className={`accordion-item ${openAccordion === 'shipping' ? 'open' : ''}`}>
              <button className="accordion-header" onClick={() => toggleAccordion('shipping')}>
                <span>Shipping & Returns</span>
                {openAccordion === 'shipping' ? <FiChevronUp /> : <FiChevronDown />}
              </button>
              {openAccordion === 'shipping' && (
                <div className="accordion-body">
                  <div className="shipping-details">
                    <div className="ship-row"><FiCheck className="ship-icon" /> Free shipping on orders above ₹999</div>
                    <div className="ship-row"><FiCheck className="ship-icon" /> Standard delivery in 3–5 business days</div>
                    <div className="ship-row"><FiCheck className="ship-icon" /> Cash on Delivery available</div>
                    <div className="ship-row"><FiCheck className="ship-icon" /> Easy returns within 7 days of delivery</div>
                    <div className="ship-row"><FiCheck className="ship-icon" /> Shipped via Blue Dart courier</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== STYLE WITH THIS ===== */}
      {product.styleWith?.length > 0 && (
        <section className="style-with-section">
          <div className="section-title">
            <h2>✨ Style With This</h2>
            <div className="divider"></div>
          </div>
          <div className="products-grid">
            {product.styleWith.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

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

      {/* ===== RECENTLY VIEWED ===== */}
      {recentlyViewed.length > 0 && (
        <section className="products-section recently-viewed-section">
          <div className="section-title">
            <h2>👀 Recently Viewed</h2>
            <div className="divider"></div>
          </div>
          <div className="products-grid">
            {recentlyViewed.slice(0, 4).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ===== SIZE CHART MODAL ===== */}
      {showSizeChart && hasSizeChart && (
        <div className="modal-overlay" onClick={() => setShowSizeChart(false)}>
          <div className="modal-content size-chart-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>📏 Size Chart</h3>
              <button className="btn-icon" onClick={() => setShowSizeChart(false)}><FiX /></button>
            </div>
            <table className="size-chart-table">
              <thead>
                <tr><th>Size</th><th>Bust</th><th>Waist</th><th>Hip</th><th>Length</th></tr>
              </thead>
              <tbody>
                {product.sizeChart.map((row, i) => (
                  <tr key={i} className={selectedSize === row.size ? 'highlight' : ''}>
                    <td><strong>{row.size}</strong></td>
                    <td>{row.bust || '—'}"</td>
                    <td>{row.waist || '—'}"</td>
                    <td>{row.hip || '—'}"</td>
                    <td>{row.length || '—'}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="chart-note">All measurements are in inches. Please refer to this chart before ordering.</p>
          </div>
        </div>
      )}

      {/* ===== IMAGE ZOOM MODAL ===== */}
      {imageZoom && (
        <div className="modal-overlay image-zoom-overlay" onClick={() => setImageZoom(false)}>
          <div className="image-zoom-container" onClick={(e) => e.stopPropagation()}>
            <button className="zoom-close" onClick={() => setImageZoom(false)}><FiX size={20} /></button>
            <img src={product.images[activeImage]?.url} alt={product.name} className="zoomed-image" />
            {product.images.length > 1 && (
              <div className="zoom-thumbs">
                {product.images.map((img, i) => (
                  <div key={i} className={`zoom-thumb ${i === activeImage ? 'active' : ''}`} onClick={() => setActiveImage(i)}>
                    <img src={img.url} alt="" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
