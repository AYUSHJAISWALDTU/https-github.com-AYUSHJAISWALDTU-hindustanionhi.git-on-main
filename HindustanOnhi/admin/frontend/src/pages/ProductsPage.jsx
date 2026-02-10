import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiSearch } from 'react-icons/fi';
import api from '../utils/api';
import { formatPrice, truncate } from '../utils/helpers';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const { data } = await api.get('/products', { params });
      setProducts(data.products);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleToggleActive = async (id) => {
    try {
      const { data } = await api.put(`/products/${id}/toggle-active`);
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isActive: data.product.isActive } : p))
      );
      toast.success(data.product.isActive ? 'Product visible' : 'Product hidden');
    } catch {
      toast.error('Toggle failed');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/products/${deleteId}`);
      setProducts((prev) => prev.filter((p) => p._id !== deleteId));
      toast.success('Product deleted');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="page-heading">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={() => navigate('/products/new')}>
          <FiPlus /> Add Product
        </button>
      </div>

      {/* Filters */}
      <form className="filters-bar" onSubmit={handleSearch}>
        <div className="search-input">
          <FiSearch className="search-icon" />
          <input
            className="form-control"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-outline btn-sm">Search</button>
      </form>

      {loading ? (
        <Loader />
      ) : (
        <div className="section-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Sold</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <img
                        src={p.images?.[0]?.url || 'https://placehold.co/44x44/f1f5f9/94a3b8?text=No+Img'}
                        alt=""
                        className="product-thumb"
                      />
                    </td>
                    <td className="fw-600">{truncate(p.name, 32)}</td>
                    <td>{p.category?.name || '—'}</td>
                    <td>
                      {formatPrice(p.price)}
                      {p.comparePrice > p.price && (
                        <span className="text-muted" style={{ textDecoration: 'line-through', marginLeft: 6, fontSize: '0.78rem' }}>
                          {formatPrice(p.comparePrice)}
                        </span>
                      )}
                    </td>
                    <td className={p.totalStock <= 5 ? 'low-stock' : 'stock-ok'}>{p.totalStock}</td>
                    <td>{p.sold}</td>
                    <td>
                      <span className={`badge ${p.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {p.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" title="Edit" onClick={() => navigate(`/products/${p._id}/edit`)}>
                        <FiEdit2 />
                      </button>
                      <button className="btn-icon" title={p.isActive ? 'Hide' : 'Show'} onClick={() => handleToggleActive(p._id)}>
                        {p.isActive ? <FiEyeOff /> : <FiEye />}
                      </button>
                      <button className="btn-icon danger" title="Delete" onClick={() => setDeleteId(p._id)}>
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan="8" className="text-center text-muted">No products found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>
                  {i + 1}
                </button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <ConfirmModal
          title="Delete Product"
          message="This product will be permanently deleted. Continue?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  );
}
