import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import api from '../utils/api';
import { formatPrice, formatDateTime } from '../utils/helpers';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const ORDER_STATUSES = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];

const SHIPPING_STATUSES = ['shipped', 'in_transit', 'out_for_delivery', 'delivered'];

const shippingStatusLabel = {
  pending: 'Pending',
  shipped: 'Shipped',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState('Blue Dart');
  const [awbNumber, setAwbNumber] = useState('');
  const [shippingStatus, setShippingStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [pickingUp, setPickingUp] = useState(false);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data }) => {
        setOrder(data.order);
        setNewStatus(data.order.orderStatus);
        setTrackingNumber(data.order.trackingNumber || '');
        setCourier(data.order.shipping?.courier || 'Blue Dart');
        setAwbNumber(data.order.shipping?.awbNumber || '');
        setShippingStatus(data.order.shipping?.status || 'pending');
      })
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      const payload = { status: newStatus, trackingNumber };
      // When shipping, include courier details
      if (newStatus === 'shipped') {
        payload.courier = courier;
        payload.awbNumber = awbNumber || trackingNumber;
      }
      const { data } = await api.put(`/orders/${id}/status`, payload);
      setOrder(data.order);
      setAwbNumber(data.order.shipping?.awbNumber || awbNumber);
      setCourier(data.order.shipping?.courier || courier);
      setShippingStatus(data.order.shipping?.status || 'pending');
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error('Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateShippingStatus = async () => {
    setUpdating(true);
    try {
      const { data } = await api.put(`/orders/${id}/shipping-status`, { shippingStatus });
      setOrder(data.order);
      toast.success(`Shipping status updated to ${shippingStatusLabel[shippingStatus]}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkDelivered = async () => {
    if (!window.confirm('Mark this order as delivered?')) return;
    setUpdating(true);
    try {
      const { data } = await api.put(`/orders/${id}/mark-delivered`);
      setOrder(data.order);
      setNewStatus('delivered');
      setShippingStatus('delivered');
      toast.success('Order marked as delivered');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleReturnDecision = async (approved) => {
    setUpdating(true);
    try {
      const { data } = await api.put(`/orders/${id}/return-decision`, { approved });
      setOrder(data.order);
      toast.success(approved ? 'Return approved' : 'Return rejected');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setUpdating(false);
    }
  };

  const handlePickupCompleted = async () => {
    setPickingUp(true);
    try {
      const { data } = await api.put(`/orders/${id}/pickup-completed`);
      setOrder(data.order);
      toast.success(data.message || 'Pickup completed & refund processed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setPickingUp(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!window.confirm(`Process refund of ${formatPrice(order.totalPrice)} via Razorpay?`)) return;
    setRefunding(true);
    try {
      const { data } = await api.post(`/orders/${id}/refund`);
      setOrder(data.order);
      toast.success(data.message || 'Refund processed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund failed');
    } finally {
      setRefunding(false);
    }
  };

  if (loading) return <Loader />;
  if (!order) return <p className="text-center text-muted mt-24">Order not found</p>;

  return (
    <>
      <button className="back-link" onClick={() => navigate('/orders')}>
        <FiArrowLeft /> Back to Orders
      </button>

      <div className="page-heading">
        <h1>Order #{order._id.slice(-6).toUpperCase()}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`badge badge-${order.orderStatus}`}>{order.orderStatus}</span>
          <button
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            onClick={async () => {
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
        </div>
      </div>

      <div className="order-detail-grid mb-24">
        {/* Customer Info */}
        <div className="section-card">
          <div className="section-header"><h2>Customer</h2></div>
          <div className="section-body">
            <p><strong>{order.user?.name || '—'}</strong></p>
            <p>{order.user?.email}</p>
            <p>{order.user?.phone}</p>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="section-card">
          <div className="section-header"><h2>Shipping Address</h2></div>
          <div className="section-body">
            <p><strong>{order.shippingAddress?.fullName}</strong></p>
            <p>{order.shippingAddress?.addressLine1}</p>
            {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}</p>
            <p>📞 {order.shippingAddress?.phone}</p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="section-card">
          <div className="section-header"><h2>Payment</h2></div>
          <div className="section-body">
            <p>Method: <strong>{order.paymentMethod?.toUpperCase()}</strong></p>
            <p>Status: <span className={`badge ${order.isPaid ? 'badge-paid' : 'badge-unpaid'}`}>{order.isPaid ? 'Paid' : 'Unpaid'}</span></p>
            {order.paidAt && <p>Paid: {formatDateTime(order.paidAt)}</p>}
            {order.paymentResult?.razorpay_payment_id && <p className="text-muted" style={{ fontSize: '0.78rem' }}>Razorpay ID: {order.paymentResult.razorpay_payment_id}</p>}
          </div>
        </div>

        {/* Order Summary */}
        <div className="section-card">
          <div className="section-header"><h2>Summary</h2></div>
          <div className="section-body">
            <p>Items: {formatPrice(order.itemsPrice)}</p>
            <p>Shipping: {formatPrice(order.shippingPrice)}</p>
            <p>Tax (GST): {formatPrice(order.taxPrice)}</p>
            <p className="fw-700" style={{ fontSize: '1.1rem', marginTop: 8 }}>Total: {formatPrice(order.totalPrice)}</p>
            <p className="text-muted mt-8">Placed: {formatDateTime(order.createdAt)}</p>
            {order.deliveredAt && <p className="text-success">Delivered: {formatDateTime(order.deliveredAt)}</p>}
            {order.trackingNumber && <p>Tracking: {order.trackingNumber}</p>}
            {order.shipping?.courier && <p>Courier: {order.shipping.courier}</p>}
            {order.shipping?.awbNumber && <p>AWB: <span style={{ fontFamily: 'monospace' }}>{order.shipping.awbNumber}</span></p>}
            {order.shipping?.status && order.shipping.status !== 'pending' && (
              <p>Shipping Status: <span className={`badge badge-${order.shipping.status === 'delivered' ? 'delivered' : 'shipped'}`}>
                {shippingStatusLabel[order.shipping.status]}
              </span></p>
            )}
            {order.shipping?.shippedAt && <p className="text-muted" style={{ fontSize: '0.82rem' }}>Shipped: {formatDateTime(order.shipping.shippedAt)}</p>}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="section-card mb-24">
        <div className="section-header"><h2>Ordered Items</h2></div>
        <div className="table-wrapper">
          <table className="order-items-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Size</th>
                <th>Color</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.orderItems.map((item, i) => (
                <tr key={i}>
                  <td><img src={item.image || 'https://placehold.co/48x48/f1f5f9/94a3b8?text=N'} alt="" /></td>
                  <td className="fw-600">{item.name}</td>
                  <td>{item.size || '—'}</td>
                  <td>{item.color || '—'}</td>
                  <td>{item.quantity}</td>
                  <td>{formatPrice(item.price)}</td>
                  <td className="fw-600">{formatPrice(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update Status */}
      <div className="section-card mb-24">
        <div className="section-header"><h2>Update Status</h2></div>
        <div className="section-body">
          <div className="order-status-select">
            <select className="form-control" style={{ maxWidth: 200 }} value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <button className="btn btn-primary" onClick={handleUpdateStatus} disabled={updating}>
              {updating ? 'Updating…' : 'Update'}
            </button>
          </div>

          {/* Show shipping form when 'shipped' is selected */}
          {newStatus === 'shipped' && (
            <div style={{ marginTop: 16, padding: '16px 20px', background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd' }}>
              <h4 style={{ margin: '0 0 12px', color: '#0369a1', fontSize: '0.95rem' }}>📦 Blue Dart Shipping Details</h4>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <label style={{ fontSize: '0.82rem', color: '#64748b', display: 'block', marginBottom: 4 }}>Courier Partner</label>
                  <input
                    className="form-control"
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    placeholder="Blue Dart"
                  />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ fontSize: '0.82rem', color: '#64748b', display: 'block', marginBottom: 4 }}>AWB Tracking Number *</label>
                  <input
                    className="form-control"
                    value={awbNumber}
                    onChange={(e) => { setAwbNumber(e.target.value); setTrackingNumber(e.target.value); }}
                    placeholder="e.g. 12345678901"
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Blue Dart Shipping Tracking ─── */}
      {order.shipping?.awbNumber && (
        <div className="section-card mb-24" style={{ borderLeft: '4px solid #0369a1' }}>
          <div className="section-header"><h2>🚚 Shipping & Tracking</h2></div>
          <div className="section-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 16 }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Courier</span>
                <p style={{ margin: '2px 0', fontWeight: 600 }}>{order.shipping.courier}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.82rem' }}>AWB Number</span>
                <p style={{ margin: '2px 0', fontWeight: 600, fontFamily: 'monospace' }}>{order.shipping.awbNumber}</p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Shipping Status</span>
                <p style={{ margin: '2px 0' }}>
                  <span className={`badge badge-${order.shipping.status === 'delivered' ? 'delivered' : 'shipped'}`}>
                    {shippingStatusLabel[order.shipping.status] || order.shipping.status}
                  </span>
                </p>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Shipped On</span>
                <p style={{ margin: '2px 0' }}>{order.shipping.shippedAt ? formatDateTime(order.shipping.shippedAt) : '—'}</p>
              </div>
              {order.shipping.deliveredAt && (
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Delivered On</span>
                  <p style={{ margin: '2px 0', color: '#27ae60', fontWeight: 600 }}>{formatDateTime(order.shipping.deliveredAt)}</p>
                </div>
              )}
            </div>

            {order.shipping.trackingUrl && (
              <a
                href={order.shipping.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#0369a1', borderColor: '#0369a1', fontSize: '0.85rem', marginBottom: 16 }}
              >
                🔍 Track on {order.shipping.courier}
              </a>
            )}

            {/* Update shipping status */}
            {order.shipping.status !== 'delivered' && (
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginTop: 8 }}>
                <label style={{ fontSize: '0.82rem', color: '#64748b', display: 'block', marginBottom: 6 }}>Update Shipping Status</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <select
                    className="form-control"
                    style={{ maxWidth: 200 }}
                    value={shippingStatus}
                    onChange={(e) => setShippingStatus(e.target.value)}
                  >
                    {SHIPPING_STATUSES.map((s) => (
                      <option key={s} value={s}>{shippingStatusLabel[s]}</option>
                    ))}
                  </select>
                  <button className="btn btn-outline" onClick={handleUpdateShippingStatus} disabled={updating}>
                    {updating ? 'Updating…' : 'Update'}
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ background: '#27ae60', borderColor: '#27ae60' }}
                    onClick={handleMarkDelivered}
                    disabled={updating}
                  >
                    ✅ Mark Delivered
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Cancellation Request ─── */}
      {order.cancellation?.requested && (
        <div className="section-card mb-24" style={{ borderLeft: '4px solid #e74c3c' }}>
          <div className="section-header"><h2>🚫 Cancellation Request</h2></div>
          <div className="section-body">
            <p><strong>Reason:</strong> {order.cancellation.reason}</p>
            <p className="text-muted" style={{ fontSize: '0.82rem' }}>
              Requested: {order.cancellation.requestedAt ? formatDateTime(order.cancellation.requestedAt) : '—'}
            </p>
            {order.cancellation.approved === true && (
              <p style={{ color: '#27ae60', fontWeight: 600, marginTop: 8 }}>✅ Approved {order.cancellation.decidedAt && `on ${formatDateTime(order.cancellation.decidedAt)}`}</p>
            )}
            {order.cancellation.approved === false && (
              <p style={{ color: '#e74c3c', fontWeight: 600, marginTop: 8 }}>❌ Rejected</p>
            )}
          </div>
        </div>
      )}

      {/* ─── Return Request ─── */}
      {order.returnRequest?.requested && (
        <div className="section-card mb-24" style={{ borderLeft: '4px solid #8e44ad' }}>
          <div className="section-header"><h2>🔄 Return Request</h2></div>
          <div className="section-body">
            <p><strong>Reason:</strong> {order.returnRequest.reason}</p>
            <p className="text-muted" style={{ fontSize: '0.82rem' }}>
              Requested: {order.returnRequest.requestedAt ? formatDateTime(order.returnRequest.requestedAt) : '—'}
            </p>

            {order.returnRequest.approved === null && (
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: 12 }}>
                <button className="btn btn-primary" onClick={() => handleReturnDecision(true)} disabled={updating}>
                  ✅ Approve Return
                </button>
                <button className="btn btn-outline" style={{ borderColor: '#e74c3c', color: '#e74c3c' }} onClick={() => handleReturnDecision(false)} disabled={updating}>
                  ❌ Reject Return
                </button>
              </div>
            )}

            {order.returnRequest.approved === true && (
              <>
                <p style={{ color: '#27ae60', fontWeight: 600, marginTop: 8 }}>✅ Return Approved</p>
                {!order.returnRequest.pickupCompleted ? (
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 8, background: '#8e44ad', borderColor: '#8e44ad' }}
                    onClick={handlePickupCompleted}
                    disabled={pickingUp}
                  >
                    {pickingUp ? 'Processing…' : '📦 Mark Pickup Completed & Process Refund'}
                  </button>
                ) : (
                  <p style={{ color: '#27ae60', marginTop: 4 }}>📦 Pickup completed</p>
                )}
              </>
            )}

            {order.returnRequest.approved === false && (
              <p style={{ color: '#e74c3c', fontWeight: 600, marginTop: 8 }}>❌ Return Rejected</p>
            )}
          </div>
        </div>
      )}

      {/* ─── Refund Status ─── */}
      {(order.refund?.status === 'initiated' || order.refund?.status === 'completed') && (
        <div className="section-card mb-24" style={{ borderLeft: '4px solid #27ae60' }}>
          <div className="section-header"><h2>💰 Refund</h2></div>
          <div className="section-body">
            <p><strong>Amount:</strong> {formatPrice(order.refund.amount || order.totalPrice)}</p>
            <p><strong>Status:</strong>{' '}
              <span className={`badge ${order.refund.status === 'completed' ? 'badge-paid' : 'badge-processing'}`}>
                {order.refund.status === 'completed' ? 'Completed ✓' : 'Initiated'}
              </span>
            </p>
            {order.refund.razorpayRefundId && (
              <p className="text-muted" style={{ fontSize: '0.82rem' }}>Refund ID: {order.refund.razorpayRefundId}</p>
            )}
            {order.refund.refundedAt && (
              <p className="text-muted" style={{ fontSize: '0.82rem' }}>Refunded: {formatDateTime(order.refund.refundedAt)}</p>
            )}
          </div>
        </div>
      )}

      {/* Manual Refund Button — for orders that need refund but weren't auto-processed */}
      {order.isPaid && order.paymentMethod === 'razorpay' &&
        ['cancelled', 'returned'].includes(order.orderStatus) &&
        order.refund?.status !== 'completed' && (
        <div className="section-card mb-24">
          <div className="section-header"><h2>⚠️ Refund Required</h2></div>
          <div className="section-body">
            <p>This order was {order.orderStatus} but refund has not been completed.</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: 8, background: '#27ae60', borderColor: '#27ae60' }}
              onClick={handleProcessRefund}
              disabled={refunding}
            >
              {refunding ? 'Processing…' : `💰 Process Refund — ${formatPrice(order.totalPrice)}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
