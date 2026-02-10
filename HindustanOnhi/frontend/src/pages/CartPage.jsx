import { Link } from 'react-router-dom';
import { FiTrash2, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/helpers';
import SEO from '../components/common/SEO';

/**
 * CartPage — displays cart items with quantity controls and summary
 */
export default function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart } = useCart();

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="cart-page container">
        <SEO title="Shopping Cart" description="Your shopping cart at Hindustani Odhni. Review your selected ethnic wear before checkout." canonical="/cart" noIndex={true} />
        <div className="empty-state">
          <div className="icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any items yet. Explore our collection!</p>
          <Link to="/shop" className="btn btn-primary">
            <FiShoppingBag /> Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const itemsPrice = cart.totalPrice;
  const shippingPrice = itemsPrice > 999 ? 0 : 99;
  const taxPrice = Math.round(itemsPrice * 0.05);
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  return (
    <div className="cart-page container">
      <SEO title="Shopping Cart" description="Your shopping cart at Hindustani Odhni. Review your selected ethnic wear before checkout." canonical="/cart" noIndex={true} />
      <h1>Shopping Cart ({cart.totalItems} items)</h1>

      <div className="cart-layout">
        {/* Cart Items */}
        <div className="cart-items">
          {cart.items.map((item) => (
            <div key={item._id} className="cart-item">
              <Link to={`/product/${item.product?.slug}`} className="cart-item-image">
                <img
                  src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/200x260'}
                  alt={item.product?.name}
                />
              </Link>

              <div className="cart-item-info">
                <Link to={`/product/${item.product?.slug}`}>
                  <h3>{item.product?.name || 'Product'}</h3>
                </Link>
                <div className="meta">
                  Size: {item.size} {item.color && `| Color: ${item.color}`}
                </div>
                <div className="cart-item-quantity">
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="cart-item-right">
                <div className="price">{formatPrice(item.price * item.quantity)}</div>
                <button className="remove-btn" onClick={() => removeItem(item._id)}>
                  <FiTrash2 /> Remove
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={clearCart}
            style={{ alignSelf: 'flex-start', fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px' }}
          >
            Clear Cart
          </button>
        </div>

        {/* Order Summary */}
        <div className="cart-summary">
          <h2>Order Summary</h2>

          <div className="cart-summary-row">
            <span>Subtotal ({cart.totalItems} items)</span>
            <span>{formatPrice(itemsPrice)}</span>
          </div>
          <div className="cart-summary-row">
            <span>Shipping</span>
            <span>{shippingPrice === 0 ? <span style={{ color: 'var(--color-success)' }}>FREE</span> : formatPrice(shippingPrice)}</span>
          </div>
          <div className="cart-summary-row">
            <span>Tax (GST 5%)</span>
            <span>{formatPrice(taxPrice)}</span>
          </div>
          <div className="cart-summary-row total">
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>

          {shippingPrice === 0 && (
            <div className="free-shipping">🎉 You get free shipping!</div>
          )}
          {shippingPrice > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '8px' }}>
              Add {formatPrice(999 - itemsPrice)} more for free shipping
            </div>
          )}

          <Link to="/checkout" className="btn btn-primary btn-block btn-lg" style={{ marginTop: '20px' }}>
            Proceed to Checkout <FiArrowRight />
          </Link>

          <Link to="/shop" className="btn btn-secondary btn-block" style={{ marginTop: '10px' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
