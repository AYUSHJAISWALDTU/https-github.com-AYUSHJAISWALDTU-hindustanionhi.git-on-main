import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatPrice, formatDate } from '../utils/helpers';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';
import {
  FiUser, FiPackage, FiMapPin, FiEdit2, FiTrash2, FiPlus, FiChevronRight,
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
    shipped: '#3498db',
    delivered: '#27ae60',
    cancelled: '#e74c3c',
  };
  return map[s] || '#888';
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
    </div>
  );
}
