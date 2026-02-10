import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import API from '../utils/api';
import { formatPrice } from '../utils/helpers';
import toast from 'react-hot-toast';

/**
 * CheckoutPage — shipping address, payment method, and order placement
 */
export default function CheckoutPage() {
  const { user, updateAddress } = useAuth();
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [processing, setProcessing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // New address form
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (cart.items?.length === 0) {
      navigate('/cart');
      return;
    }
    // Select default address
    if (user.addresses?.length > 0) {
      const defaultAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [user, cart]);

  const itemsPrice = cart.totalPrice;
  const shippingPrice = itemsPrice > 999 ? 0 : 99;
  const taxPrice = Math.round(itemsPrice * 0.05);
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await updateAddress(addressForm);
      setShowAddressForm(false);
      setAddressForm({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });
    } catch (err) {
      toast.error('Failed to save address');
    }
  };

  // Load Razorpay script
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a shipping address');
      return;
    }

    setProcessing(true);
    try {
      const { data } = await API.post('/orders', {
        shippingAddress: selectedAddress,
        paymentMethod,
      });

      if (paymentMethod === 'razorpay' && data.razorpayOrder) {
        const loaded = await loadRazorpay();
        if (!loaded) {
          toast.error('Razorpay failed to load. Please try again.');
          setProcessing(false);
          return;
        }

        const options = {
          key: data.key,
          amount: data.razorpayOrder.amount,
          currency: data.razorpayOrder.currency,
          name: 'HindustanOnhi',
          description: 'Ethnic Fashion Purchase',
          order_id: data.razorpayOrder.id,
          handler: async function (response) {
            try {
              await API.post('/orders/verify-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: data.order._id,
              });
              toast.success('Payment successful! 🎉');
              navigate(`/dashboard?tab=orders`);
            } catch {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone,
          },
          theme: {
            color: '#8B1A1A',
          },
          modal: {
            ondismiss: () => {
              setProcessing(false);
              toast.error('Payment cancelled');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // COD order
        toast.success('Order placed successfully! 🎉');
        navigate(`/dashboard?tab=orders`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setProcessing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="checkout-page container">
      <h1>Checkout</h1>

      <div className="checkout-layout">
        {/* Left — Address & Payment */}
        <div>
          {/* Shipping Address */}
          <div className="checkout-section">
            <h2>Shipping Address</h2>

            {user.addresses?.length > 0 ? (
              <div className="address-cards">
                {user.addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className={`address-card ${selectedAddress?._id === addr._id ? 'selected' : ''}`}
                    onClick={() => setSelectedAddress(addr)}
                  >
                    <h4>{addr.fullName} {addr.isDefault && <span className="badge badge-featured" style={{ marginLeft: '8px' }}>Default</span>}</h4>
                    <p>
                      {addr.addressLine1}
                      {addr.addressLine2 && `, ${addr.addressLine2}`}<br />
                      {addr.city}, {addr.state} - {addr.pincode}<br />
                      Phone: {addr.phone}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                No saved addresses. Add one below.
              </p>
            )}

            <button
              className="btn btn-secondary btn-sm mt-2"
              onClick={() => setShowAddressForm(!showAddressForm)}
            >
              {showAddressForm ? 'Cancel' : '+ Add New Address'}
            </button>

            {showAddressForm && (
              <form onSubmit={handleAddAddress} style={{ marginTop: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input className="form-control" required value={addressForm.fullName} onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input className="form-control" required value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Address Line 1</label>
                  <input className="form-control" required value={addressForm.addressLine1} onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Address Line 2 (Optional)</label>
                  <input className="form-control" value={addressForm.addressLine2} onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>City</label>
                    <input className="form-control" required value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input className="form-control" required value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input className="form-control" required value={addressForm.pincode} onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Save Address</button>
              </form>
            )}
          </div>

          {/* Payment Method */}
          <div className="checkout-section">
            <h2>Payment Method</h2>
            <div className="payment-methods">
              <label
                className={`payment-method ${paymentMethod === 'razorpay' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('razorpay')}
              >
                <input type="radio" checked={paymentMethod === 'razorpay'} readOnly />
                <span>💳 Pay Online (Razorpay — UPI, Cards, Net Banking)</span>
              </label>
              <label
                className={`payment-method ${paymentMethod === 'cod' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('cod')}
              >
                <input type="radio" checked={paymentMethod === 'cod'} readOnly />
                <span>💵 Cash on Delivery (COD)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right — Order Summary */}
        <div className="cart-summary">
          <h2>Order Summary</h2>

          {/* Items preview */}
          <div style={{ marginBottom: '16px' }}>
            {cart.items.map((item) => (
              <div key={item._id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', fontSize: '13px' }}>
                <img
                  src={item.product?.images?.[0]?.url || 'https://via.placeholder.com/60x80'}
                  alt=""
                  style={{ width: '50px', height: '65px', borderRadius: '6px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{item.product?.name}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
                    {item.size} × {item.quantity}
                  </div>
                </div>
                <div style={{ fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>

          <div className="cart-summary-row">
            <span>Subtotal</span>
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

          <button
            className="btn btn-primary btn-block btn-lg"
            style={{ marginTop: '20px' }}
            onClick={handlePlaceOrder}
            disabled={processing}
          >
            {processing ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order (COD)' : 'Pay Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
