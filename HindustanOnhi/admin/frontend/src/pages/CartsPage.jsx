import { useEffect, useState } from 'react';
import { FiTrash2, FiShoppingCart } from 'react-icons/fi';
import api from '../utils/api';
import { formatPrice, formatDateTime } from '../utils/helpers';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

export default function CartsPage() {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [clearId, setClearId] = useState(null);

  const fetchCarts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === 'abandoned') params.abandoned = 'true';
      if (filter === 'active') params.abandoned = 'false';
      const { data } = await api.get('/carts', { params });
      setCarts(data.carts);
    } catch {
      toast.error('Failed to load carts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCarts(); }, [filter]);

  const handleClear = async () => {
    try {
      await api.delete(`/carts/${clearId}`);
      setCarts((prev) => prev.filter((c) => c._id !== clearId));
      toast.success('Cart cleared');
    } catch {
      toast.error('Failed to clear cart');
    } finally {
      setClearId(null);
    }
  };

  return (
    <>
      <div className="page-heading"><h1>Active Carts</h1></div>

      <div className="filters-bar">
        <select className="form-control" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Carts</option>
          <option value="active">Active</option>
          <option value="abandoned">Abandoned (24h+)</option>
        </select>
      </div>

      {loading ? <Loader /> : (
        <div className="section-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Last Updated</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {carts.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <span className="fw-600">{c.user?.name || '—'}</span>
                      <br />
                      <small className="text-muted">{c.user?.email}</small>
                    </td>
                    <td>
                      {c.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <img
                            src={item.product?.images?.[0]?.url || 'https://placehold.co/30x30/f1f5f9/94a3b8?text=N'}
                            alt=""
                            style={{ width: 30, height: 30, borderRadius: 4, objectFit: 'cover' }}
                          />
                          <span style={{ fontSize: '0.82rem' }}>{item.product?.name?.slice(0, 20) || 'Product'} × {item.quantity}</span>
                        </div>
                      ))}
                    </td>
                    <td className="fw-600">{formatPrice(c.totalPrice)}</td>
                    <td>{formatDateTime(c.updatedAt)}</td>
                    <td>
                      {c.isAbandoned
                        ? <span className="badge badge-abandoned">Abandoned</span>
                        : <span className="badge badge-active">Active</span>
                      }
                    </td>
                    <td>
                      <button className="btn-icon danger" title="Clear Cart" onClick={() => setClearId(c._id)}>
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
                {carts.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted" style={{ padding: 40 }}>
                      <FiShoppingCart style={{ fontSize: '2rem', opacity: 0.3, marginBottom: 8 }} />
                      <br />No active carts
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {clearId && (
        <ConfirmModal
          title="Clear Cart"
          message="This will remove all items from this user's cart. Continue?"
          onConfirm={handleClear}
          onCancel={() => setClearId(null)}
        />
      )}
    </>
  );
}
