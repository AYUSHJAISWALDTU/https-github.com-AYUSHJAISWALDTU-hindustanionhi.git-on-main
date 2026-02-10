import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { formatPrice, getDiscount, renderStars } from '../../utils/helpers';

/**
 * ProductCard — reusable product card component
 * Shows image, name, price, discount, rating, and wishlist toggle
 */
export default function ProductCard({ product }) {
  const { toggleWishlist, isInWishlist } = useAuth();
  const [imgLoaded, setImgLoaded] = useState(false);
  
  const discount = getDiscount(product.price, product.comparePrice);
  const wishlisted = isInWishlist(product._id);
  const imageUrl = product.images?.[0]?.url || 'https://via.placeholder.com/400x500?text=HindustanOnhi';
  const categoryName = product.category?.name || '';

  return (
    <div className="product-card">
      {/* Image */}
      <Link to={`/product/${product.slug}`} className="product-card-image">
        {!imgLoaded && <div className="img-placeholder" style={{ width: '100%', height: '100%', position: 'absolute' }} />}
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
        />
        
        {/* Badges */}
        <div className="product-card-badges">
          {discount > 0 && <span className="badge badge-sale">{discount}% OFF</span>}
          {product.isFeatured && <span className="badge badge-featured">Featured</span>}
        </div>
      </Link>

      {/* Wishlist Button */}
      <button
        className={`product-card-wishlist ${wishlisted ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          toggleWishlist(product._id);
        }}
        aria-label="Toggle wishlist"
      >
        <FiHeart fill={wishlisted ? '#D32F2F' : 'none'} />
      </button>

      {/* Info */}
      <div className="product-card-info">
        {categoryName && <div className="product-card-category">{categoryName}</div>}
        
        <Link to={`/product/${product.slug}`}>
          <h3 className="product-card-name">{product.name}</h3>
        </Link>
        
        <div className="product-card-price">
          <span className="current">{formatPrice(product.price)}</span>
          {product.comparePrice > product.price && (
            <span className="original">{formatPrice(product.comparePrice)}</span>
          )}
          {discount > 0 && <span className="discount">({discount}% off)</span>}
        </div>

        {product.ratingsCount > 0 && (
          <div className="product-card-rating">
            <span className="stars">{renderStars(product.ratingsAverage)}</span>
            <span>({product.ratingsCount})</span>
          </div>
        )}
      </div>
    </div>
  );
}
