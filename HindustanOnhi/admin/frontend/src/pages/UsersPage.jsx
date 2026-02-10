import { useEffect, useState } from 'react';
import { FiSearch, FiEye, FiLock, FiUnlock } from 'react-icons/fi';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      const { data } = await api.get('/users', { params });
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleBlock = async (userId) => {
    try {
      const { data } = await api.put(`/users/${userId}/block`);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isBlocked: data.user.isBlocked } : u)));
      toast.success(data.user.isBlocked ? 'User blocked' : 'User unblocked');
    } catch {
      toast.error('Action failed');
    }
  };

  const viewUserDetail = async (userId) => {
    try {
      const { data } = await api.get(`/users/${userId}`);
      setSelectedUser(data.user);
    } catch {
      toast.error('Failed to load user');
    }
  };

  return (
    <>
      <div className="page-heading"><h1>Users</h1></div>

      <form className="filters-bar" onSubmit={handleSearch}>
        <div className="search-input">
          <FiSearch className="search-icon" />
          <input className="form-control" placeholder="Search by name, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-outline btn-sm">Search</button>
      </form>

      {loading ? <Loader /> : (
        <div className="section-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="fw-600">{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-confirmed' : 'badge-active'}`}>{u.role}</span></td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      {u.isBlocked
                        ? <span className="badge badge-cancelled">Blocked</span>
                        : <span className="badge badge-active">Active</span>
                      }
                    </td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" title="View Details" onClick={() => viewUserDetail(u._id)}>
                        <FiEye />
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          className={`btn-icon ${u.isBlocked ? '' : 'danger'}`}
                          title={u.isBlocked ? 'Unblock' : 'Block'}
                          onClick={() => handleToggleBlock(u._id)}
                        >
                          {u.isBlocked ? <FiUnlock /> : <FiLock />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan="7" className="text-center text-muted">No users found</td></tr>
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

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Details</h3>
              <button className="btn-icon" onClick={() => setSelectedUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="user-detail-header">
                <div className="user-avatar-large">{selectedUser.name?.charAt(0).toUpperCase()}</div>
                <div>
                  <h3 className="fw-700">{selectedUser.name}</h3>
                  <p className="text-muted">{selectedUser.email}</p>
                  {selectedUser.phone && <p className="text-muted">{selectedUser.phone}</p>}
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>Member since {formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>

              {/* Addresses */}
              <h4 className="fw-700 mb-8 mt-16">Saved Addresses ({selectedUser.addresses?.length || 0})</h4>
              {selectedUser.addresses && selectedUser.addresses.length > 0 ? (
                selectedUser.addresses.map((addr, i) => (
                  <div key={i} style={{ padding: '12px', background: '#f8fafc', borderRadius: 8, marginBottom: 8, fontSize: '0.88rem' }}>
                    <p className="fw-600">{addr.fullName} {addr.isDefault && <span className="badge badge-confirmed" style={{ marginLeft: 8 }}>Default</span>}</p>
                    <p>{addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}</p>
                    <p>{addr.city}, {addr.state} — {addr.pincode}</p>
                    <p className="text-muted">📞 {addr.phone}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted">No saved addresses</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
