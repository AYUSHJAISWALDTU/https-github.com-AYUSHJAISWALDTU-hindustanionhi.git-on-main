import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiEye } from 'react-icons/fi';
import api from '../utils/api';
import { formatPrice, formatDate } from '../utils/helpers';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const STATUSES = ['all', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (status !== 'all') params.status = status;
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const { data } = await api.get('/orders', { params });
      setOrders(data.orders);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, status]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  return (
    <>
      <div className="page-heading"><h1>Orders</h1></div>

      <form className="filters-bar" onSubmit={handleSearch}>
        <div className="search-input">
          <FiSearch className="search-icon" />
          <input className="form-control" placeholder="Search order ID, name, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-control" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button type="submit" className="btn btn-outline btn-sm">Filter</button>
      </form>

      {loading ? <Loader /> : (
        <div className="section-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td className="fw-600">#{o._id.slice(-6).toUpperCase()}</td>
                    <td>{o.user?.name || '—'}<br /><small className="text-muted">{o.user?.email}</small></td>
                    <td>{o.orderItems?.length || 0}</td>
                    <td className="fw-600">{formatPrice(o.totalPrice)}</td>
                    <td>
                      <span className={`badge ${o.isPaid ? 'badge-paid' : 'badge-unpaid'}`}>{o.isPaid ? 'Paid' : 'Unpaid'}</span>
                      <br /><small className="text-muted">{o.paymentMethod?.toUpperCase()}</small>
                    </td>
                    <td><span className={`badge badge-${o.orderStatus}`}>{o.orderStatus}</span></td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>
                      <button className="btn-icon" title="View Details" onClick={() => navigate(`/orders/${o._id}`)}>
                        <FiEye />
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan="8" className="text-center text-muted">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
