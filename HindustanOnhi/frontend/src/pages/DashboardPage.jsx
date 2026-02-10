import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatPrice, formatDate } from '../utils/helpers';
import Loader from '../components/common/Loader';
import SEO from '../components/common/SEO';
import toast from 'react-hot-toast';
import {
  FiUser, FiPackage, FiMapPin, FiEdit2, FiTrash2, FiPlus, FiChevronRight, FiXCircle, FiRotateCcw, FiTruck,
} from 'react-icons/fi';

/* ─── tabs ─── */
const TABS = [
  { key: 'orders', label: 'My Orders', icon: <FiPackage /> },
  { key: 'profile', label: 'Profile', icon: <FiUser /> },
  { key: 'addresses', label: 'Addresses', icon: <FiMapPin /> },
];

/* ─── order status badge color ─── */
const statusColor = (s) => {
  const map = {
    processing: '#e67e22',
    confirmed: '#2980b9',
    shipped: '#3498db',
    delivered: '#27ae60',
    cancelled: '#e74c3c',
    returned: '#8e44ad',
  };
  return map[s] || '#888';
};

/* ─── shipping status labels ─── */
const shippingStatusLabel = {
  pending: 'Pending',
  shipped: 'Shipped',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
};

const shippingStatusColor = {
  pending: '#94a3b8',
  shipped: '#3498db',
  in_transit: '#e67e22',
  out_for_delivery: '#8e44ad',
  delivered: '#27ae60',
};

/* ─── main component ─── */
export default function DashboardPage() {
  const { user, updateProfile, updateAddress, deleteAddress } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('orders');

  /* ── orders state ── */
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  /* ── cancel / return modal state ── */
  const [cancelModal, setCancelModal] = useState(null); // order id
  const [returnModal, setReturnModal] = useState(null); // order id
  const [reasonText, setReasonText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  /* ── profile edit state ── */
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });

  /* ── address modal state ── */
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editAddressId, setEditAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '', phone: '', addressLine1: '', addressLine2: '',
    city: '', state: '', pincode: '', isDefault: false,
  });

  /* redirect if not logged in */
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  /* fetch orders */
  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/my');
        setOrders(data.data || []);
      } catch {
        toast.error('Failed to load orders');
      } finally {
        setOrdersLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  /* sync profile form */
  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [user]);

  if (!user) return <Loader />;

  /* ───────── handlers ───────── */
  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      setEditProfile(false);
    } catch {
      toast.error('Update failed');
    }
  };

  const openNewAddress = () => {
    setEditAddressId(null);
    setAddressForm({
      fullName: '', phone: '', addressLine1: '', addressLine2: '',
      city: '', state: '', pincode: '', isDefault: false,
    });
    setShowAddressForm(true);
  };

  const openEditAddress = (addr) => {
    setEditAddressId(addr._id);
    setAddressForm({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      isDefault: addr.isDefault || false,
    });
    setShowAddressForm(true);
  };

  const handleAddressSave = async (e) => {
    e.preventDefault();
    try {
      await updateAddress(addressForm, editAddressId);
      setShowAddressForm(false);
    } catch {
      toast.error('Save address failed');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Remove this address?')) return;
    try {
      await deleteAddress(id);
    } catch {
      toast.error('Delete failed');
    }
  };

  /* ── cancel order handler ── */
  const handleCancelOrder = async () => {
    if (!cancelModal) return;
    setActionLoading(true);
    try {
      const { data } = await api.post(`/orders/${cancelModal}/cancel`, { reason: reasonText });
      setOrders((prev) => prev.map((o) => (o._id === cancelModal ? data.order : o)));
      toast.success(data.message || 'Order cancelled');
      setCancelModal(null);
      setReasonText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── return order handler ── */
  const handleReturnOrder = async () => {
    if (!returnModal) return;
    setActionLoading(true);
    try {
      const { data } = await api.post(`/orders/${returnModal}/return`, { reason: reasonText });
      setOrders((prev) => prev.map((o) => (o._id === returnModal ? data.order : o)));
      toast.success(data.message || 'Return request submitted');
      setReturnModal(null);
      setReasonText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return request failed');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── helpers for cancel/return eligibility ── */
  const canCancel = (order) => {
    return !['shipped', 'delivered', 'cancelled', 'returned'].includes(order.orderStatus) &&
      !order.cancellation?.requested;
  };

  const canReturn = (order) => {
    if (order.orderStatus !== 'delivered') return false;
    if (order.returnRequest?.requested) return false;
    if (!order.deliveredAt) return false;
    const daysSince = (Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 2;
  };

  /* ───────── render sections ───────── */
  const renderOrders = () => {
    if (ordersLoading) return <Loader />;
    if (orders.length === 0)
      return (
        <div className="empty-state">
          <FiPackage size={48} />
          <h3>No orders yet</h3>
          <p>When you place an order, it will appear here.</p>
          <button className="btn btn-primary" onClick={() => navigate('/shop')}>
            Start Shopping
          </button>
        </div>
      );
    return (
      <div className="orders-list">
        {orders.map((order) => (
          <div key={order._id} className="order-card">
            <div
              className="order-card-header"
              onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
            >
              <div className="order-meta">
                <span className="order-id">#{order._id.slice(-8).toUpperCase()}</span>
                <span className="order-date">{formatDate(order.createdAt)}</span>
              </div>
              <div className="order-meta-right">
                <span
                  className="order-status-badge"
                  style={{ background: statusColor(order.orderStatus), color: '#fff' }}
                >
                  {order.orderStatus}
                </span>
                <span className="order-total">{formatPrice(order.totalPrice)}</span>
                <FiChevronRight
                  className={`chevron ${expandedOrder === order._id ? 'open' : ''}`}
                />
              </div>
            </div>

            {expandedOrder === order._id && (
              <div className="order-card-body">
                <div className="order-items-list">
                  {order.orderItems?.map((item, i) => (
                    <div key={i} className="order-item-row">
                      <img src={item.image} alt={item.name} />
                      <div>
                        <p className="item-name">{item.name}</p>
                        <p className="item-detail">
                          {item.size && `Size: ${item.size}`}
                          {item.color && ` | Color: ${item.color}`}
                          {` | Qty: ${item.qty}`}
                        </p>
                      </div>
                      <span className="item-price">{formatPrice(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="order-summary-footer">
                  <p>Subtotal: {formatPrice(order.itemsPrice)}</p>
                  <p>Shipping: {formatPrice(order.shippingPrice)}</p>
                  <p>Tax: {formatPrice(order.taxPrice)}</p>
                  <p className="total">Total: {formatPrice(order.totalPrice)}</p>
                  <p className="payment-info">
                    Payment: {order.paymentMethod} —{' '}
                    <span style={{ color: order.isPaid ? '#27ae60' : '#e74c3c' }}>
                      {order.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </p>

                  {/* Blue Dart Shipping & Tracking */}
                  {order.shipping?.awbNumber && (
                    <div style={{
                      background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10,
                      padding: '14px 18px', margin: '14px 0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 8 }}>
                        <FiTruck size={16} color="#0369a1" />
                        <span style={{ fontWeight: 700, color: '#0369a1', fontSize: '0.9rem' }}>
                          Shipping via {order.shipping.courier || 'Blue Dart'}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: '#64748b' }}>AWB No: </span>
                          <strong style={{ fontFamily: 'monospace' }}>{order.shipping.awbNumber}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b' }}>Status: </span>
                          <strong style={{ color: shippingStatusColor[order.shipping.status] || '#888' }}>
                            {shippingStatusLabel[order.shipping.status] || order.shipping.status}
                          </strong>
                        </div>
                        {order.shipping.shippedAt && (
                          <div>
                            <span style={{ color: '#64748b' }}>Shipped: </span>
                            <span>{formatDate(order.shipping.shippedAt)}</span>
                          </div>
                        )}
                        {order.shipping.deliveredAt && (
                          <div>
                            <span style={{ color: '#64748b' }}>Delivered: </span>
                            <span style={{ color: '#27ae60', fontWeight: 600 }}>{formatDate(order.shipping.deliveredAt)}</span>
                          </div>
                        )}
                      </div>
                      {order.shipping.trackingUrl && (
                        <a
                          href={order.shipping.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            marginTop: 10, padding: '8px 18px', background: '#0369a1', color: '#fff',
                            borderRadius: 6, textDecoration: 'none', fontWeight: 600, fontSize: '0.82rem',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          🔍 Track on {order.shipping.courier || 'Blue Dart'}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Refund info */}
                  {order.refund?.status === 'completed' && (
                    <div style={{ background: '#d1fae5', borderRadius: 8, padding: '10px 14px', margin: '12px 0' }}>
                      <p style={{ margin: 0, color: '#065f46', fontWeight: 600, fontSize: '0.9rem' }}>
                        💰 Refund of {formatPrice(order.refund.amount)} processed
                      </p>
                      {order.refund.razorpayRefundId && (
                        <p style={{ margin: '2px 0 0', color: '#065f46', fontSize: '0.78rem' }}>
                          Refund ID: {order.refund.razorpayRefundId}
                        </p>
                      )}
                      <p style={{ margin: '2px 0 0', color: '#065f46', fontSize: '0.78rem' }}>
                        Amount will reflect in 5–7 business days.
                      </p>
                    </div>
                  )}
                  {order.refund?.status === 'initiated' && (
                    <div style={{ background: '#fef3c7', borderRadius: 8, padding: '10px 14px', margin: '12px 0' }}>
                      <p style={{ margin: 0, color: '#92400e', fontWeight: 600, fontSize: '0.9rem' }}>
                        ⏳ Refund initiated — processing…
                      </p>
                    </div>
                  )}

                  {/* Cancellation status */}
                  {order.cancellation?.requested && order.orderStatus !== 'cancelled' && (
                    <div style={{ background: '#fef3c7', borderRadius: 8, padding: '10px 14px', margin: '12px 0' }}>
                      <p style={{ margin: 0, color: '#92400e', fontSize: '0.85rem' }}>
                        ⏳ Cancellation requested — awaiting review
                      </p>
                    </div>
                  )}

                  {/* Return status */}
                  {order.returnRequest?.requested && (
                    <div style={{
                      background: order.returnRequest.approved === false ? '#fee2e2' : order.returnRequest.approved ? '#d1fae5' : '#fef3c7',
                      borderRadius: 8, padding: '10px 14px', margin: '12px 0'
                    }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: order.returnRequest.approved === false ? '#991b1b' : order.returnRequest.approved ? '#065f46' : '#92400e' }}>
                        {order.returnRequest.approved === null && '⏳ Return requested — awaiting review'}
                        {order.returnRequest.approved === true && !order.returnRequest.pickupCompleted && '✅ Return approved — pickup pending'}
                        {order.returnRequest.approved === true && order.returnRequest.pickupCompleted && '✅ Returned — pickup completed'}
                        {order.returnRequest.approved === false && '❌ Return request rejected'}
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    <button
                      className="btn btn-outline"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const res = await api.get(`/orders/${order._id}/invoice`, { responseType: 'blob' });
                          const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `invoice-${order._id}.pdf`;
                          link.click();
                          window.URL.revokeObjectURL(url);
                        } catch {
                          toast.error('Failed to download invoice');
                        }
                      }}
                    >
                      📄 Download Invoice
                    </button>

                    {canCancel(order) && (
                      <button
                        className="btn btn-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: '#e74c3c', color: '#e74c3c' }}
                        onClick={(e) => { e.stopPropagation(); setCancelModal(order._id); setReasonText(''); }}
                      >
                        <FiXCircle /> Cancel Order
                      </button>
                    )}

                    {canReturn(order) && (
                      <button
                        className="btn btn-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: '#8e44ad', color: '#8e44ad' }}
                        onClick={(e) => { e.stopPropagation(); setReturnModal(order._id); setReasonText(''); }}
                      >
                        <FiRotateCcw /> Return Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderProfile = () => (
    <div className="profile-section">
      {editProfile ? (
        <form onSubmit={handleProfileSave} className="profile-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              className="form-control"
              value={profileForm.name}
              onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              value={profileForm.email}
              onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              className="form-control"
              value={profileForm.phone}
              onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <div className="profile-actions">
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-outline" onClick={() => setEditProfile(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-info">
          <div className="profile-avatar">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-details">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
            {user.phone && <p>{user.phone}</p>}
            <p className="member-since">Member since {formatDate(user.createdAt)}</p>
          </div>
          <button className="btn btn-outline" onClick={() => setEditProfile(true)}>
            <FiEdit2 /> Edit Profile
          </button>
        </div>
      )}
    </div>
  );

  const renderAddresses = () => (
    <div className="addresses-section">
      <button className="btn btn-primary add-address-btn" onClick={openNewAddress}>
        <FiPlus /> Add New Address
      </button>

      {user.addresses && user.addresses.length > 0 ? (
        <div className="addresses-grid">
          {user.addresses.map((addr) => (
            <div key={addr._id} className={`address-card ${addr.isDefault ? 'default' : ''}`}>
              {addr.isDefault && <span className="default-badge">Default</span>}
              <h4>{addr.fullName}</h4>
              <p>{addr.addressLine1}</p>
              {addr.addressLine2 && <p>{addr.addressLine2}</p>}
              <p>{addr.city}, {addr.state} – {addr.pincode}</p>
              <p className="addr-phone">📞 {addr.phone}</p>
              <div className="address-actions">
                <button className="btn-icon" onClick={() => openEditAddress(addr)}>
                  <FiEdit2 /> Edit
                </button>
                <button className="btn-icon danger" onClick={() => handleDeleteAddress(addr._id)}>
                  <FiTrash2 /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <FiMapPin size={48} />
          <h3>No saved addresses</h3>
          <p>Add an address for faster checkout.</p>
        </div>
      )}

      {/* address form modal */}
      {showAddressForm && (
        <div className="modal-overlay" onClick={() => setShowAddressForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editAddressId ? 'Edit Address' : 'New Address'}</h3>
            <form onSubmit={handleAddressSave}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input className="form-control" value={addressForm.fullName}
                    onChange={(e) => setAddressForm((p) => ({ ...p, fullName: e.target.value }))}
                    required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input className="form-control" value={addressForm.phone}
                    onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))}
                    required />
                </div>
              </div>
              <div className="form-group">
                <label>Address Line 1</label>
                <input className="form-control" value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm((p) => ({ ...p, addressLine1: e.target.value }))}
                  required />
              </div>
              <div className="form-group">
                <label>Address Line 2</label>
                <input className="form-control" value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm((p) => ({ ...p, addressLine2: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input className="form-control" value={addressForm.city}
                    onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                    required />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input className="form-control" value={addressForm.state}
                    onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))}
                    required />
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input className="form-control" value={addressForm.pincode}
                    onChange={(e) => setAddressForm((p) => ({ ...p, pincode: e.target.value }))}
                    required pattern="[0-9]{6}" />
                </div>
              </div>
              <label className="checkbox-label">
                <input type="checkbox" checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm((p) => ({ ...p, isDefault: e.target.checked }))} />
                Set as default address
              </label>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Save Address</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddressForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  /* ───────── main render ───────── */
  return (
    <div className="dashboard-page">
      <SEO title="My Account" description="Manage your Hindustani Odhni account. View orders, update profile, manage addresses and track shipments." canonical="/dashboard" noIndex={true} />
      <div className="container">
        <h1 className="page-title">My Account</h1>

        <div className="dashboard-layout">
          {/* sidebar tabs */}
          <aside className="dashboard-sidebar">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`tab-btn ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </aside>

          {/* content */}
          <section className="dashboard-content">
            {tab === 'orders' && renderOrders()}
            {tab === 'profile' && renderProfile()}
            {tab === 'addresses' && renderAddresses()}
          </section>
        </div>
      </div>

      {/* ─── Cancel Order Modal ─── */}
      {cancelModal && (
        <div className="modal-overlay" onClick={() => setCancelModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3 style={{ color: '#e74c3c', marginBottom: '0.5rem' }}>Cancel Order</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Are you sure you want to cancel this order? This cannot be undone.
              {orders.find((o) => o._id === cancelModal)?.isPaid && (
                <span style={{ display: 'block', marginTop: 8, color: '#065f46', fontWeight: 600 }}>
                  💰 A full refund will be initiated automatically.
                </span>
              )}
            </p>
            <div className="form-group">
              <label>Reason for cancellation</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="e.g. Found a better price, ordered by mistake, changed my mind…"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                style={{ background: '#e74c3c', borderColor: '#e74c3c' }}
                onClick={handleCancelOrder}
                disabled={actionLoading || !reasonText.trim()}
              >
                {actionLoading ? 'Cancelling…' : 'Confirm Cancellation'}
              </button>
              <button className="btn btn-outline" onClick={() => setCancelModal(null)}>
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Return Order Modal ─── */}
      {returnModal && (
        <div className="modal-overlay" onClick={() => setReturnModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h3 style={{ color: '#8e44ad', marginBottom: '0.5rem' }}>Return Order</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
              You can return this order within 2 days of delivery. After approval, we'll arrange a pickup
              and process your refund once we receive the product.
            </p>
            <div className="form-group">
              <label>Reason for return</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="e.g. Wrong size, defective product, not as described…"
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                style={{ background: '#8e44ad', borderColor: '#8e44ad' }}
                onClick={handleReturnOrder}
                disabled={actionLoading || !reasonText.trim()}
              >
                {actionLoading ? 'Submitting…' : 'Submit Return Request'}
              </button>
              <button className="btn btn-outline" onClick={() => setReturnModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
