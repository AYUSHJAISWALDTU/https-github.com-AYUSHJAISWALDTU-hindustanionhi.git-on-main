import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers, FiPackage, FiDollarSign, FiClock, FiShoppingBag,
  FiPlus, FiEye, FiAlertTriangle,
} from 'react-icons/fi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../utils/api';
import { formatPrice, formatDate, truncate } from '../utils/helpers';
import Loader from '../components/Loader';

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [dashRes, salesRes, topRes, catRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/dashboard/sales-by-date?days=30'),
          api.get('/dashboard/top-products?limit=5'),
          api.get('/dashboard/category-sales'),
        ]);
        setStats(dashRes.data.data);
        setSalesData(salesRes.data.data);
        setTopProducts(topRes.data.data);
        setCategorySales(catRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <Loader />;
  if (!stats) return <p className="text-center text-muted mt-24">Failed to load dashboard</p>;

  return (
    <>
      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="btn btn-primary" onClick={() => navigate('/products/new')}>
          <FiPlus /> Add Product
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/orders')}>
          <FiEye /> View Orders
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon blue"><FiUsers /></div>
          <div className="stat-info">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><FiPackage /></div>
          <div className="stat-info">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiDollarSign /></div>
          <div className="stat-info">
            <h3>{formatPrice(stats.totalRevenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><FiClock /></div>
          <div className="stat-info">
            <h3>{stats.pendingOrders}</h3>
            <p>Pending Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FiShoppingBag /></div>
          <div className="stat-info">
            <h3>{stats.totalProducts}</h3>
            <p>Products</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Sales Area Chart */}
        <div className="chart-card">
          <h3>Sales Revenue (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(d) => d.slice(5)}
              />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => [formatPrice(v), 'Revenue']}
                labelFormatter={(l) => `Date: ${l}`}
              />
              <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fill="url(#colorRev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="chart-card">
          <h3>Category-wise Sales</h3>
          {categorySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categorySales}
                  dataKey="totalRevenue"
                  nameKey="categoryName"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ categoryName, percent }) =>
                    `${categoryName} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {categorySales.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatPrice(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted" style={{ paddingTop: 60 }}>No sales data yet</p>
          )}
        </div>
      </div>

      {/* Top Products Bar Chart */}
      <div className="section-card mb-24">
        <div className="section-header">
          <h2>Top Selling Products</h2>
        </div>
        <div className="section-body">
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="productName"
                  width={160}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(n) => truncate(n, 22)}
                />
                <Tooltip formatter={(v, name) => [name === 'totalSold' ? `${v} units` : formatPrice(v), name === 'totalSold' ? 'Sold' : 'Revenue']} />
                <Bar dataKey="totalSold" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted">No sales data yet</p>
          )}
        </div>
      </div>

      {/* Recent Orders + Low Stock */}
      <div className="charts-grid">
        {/* Recent Orders */}
        <div className="section-card">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/orders')}>View All</button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o) => (
                  <tr key={o._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${o._id}`)}>
                    <td className="fw-600">#{o._id.slice(-6).toUpperCase()}</td>
                    <td>{o.user?.name || '—'}</td>
                    <td>{formatPrice(o.totalPrice)}</td>
                    <td><span className={`badge badge-${o.orderStatus}`}>{o.orderStatus}</span></td>
                    <td>{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
                {stats.recentOrders.length === 0 && (
                  <tr><td colSpan="5" className="text-center text-muted">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock */}
        <div className="section-card">
          <div className="section-header">
            <h2><FiAlertTriangle style={{ marginRight: 6, color: '#ef4444' }} /> Low Stock Alert</h2>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockProducts.map((p) => (
                  <tr key={p._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/products/${p._id}/edit`)}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="product-thumb" />}
                      {truncate(p.name, 25)}
                    </td>
                    <td className={p.totalStock <= 2 ? 'low-stock' : 'text-danger'}>{p.totalStock}</td>
                  </tr>
                ))}
                {stats.lowStockProducts.length === 0 && (
                  <tr><td colSpan="2" className="text-center text-muted">All products well stocked ✓</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
