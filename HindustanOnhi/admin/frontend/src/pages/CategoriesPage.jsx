import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiFolder } from 'react-icons/fi';
import api from '../utils/api';
import Loader from '../components/Loader';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

const empty = { name: '', description: '', image: '', parent: '', isActive: true };

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => { setEditId(null); setForm({ ...empty }); setShowModal(true); };
  const openEdit = (cat) => {
    setEditId(cat._id);
    setForm({ name: cat.name, description: cat.description || '', image: cat.image || '', parent: cat.parent || '', isActive: cat.isActive });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.parent) delete payload.parent;
      if (editId) {
        const { data } = await api.put(`/categories/${editId}`, payload);
        setCategories((prev) => prev.map((c) => (c._id === editId ? { ...c, ...data.category } : c)));
        toast.success('Category updated');
      } else {
        const { data } = await api.post('/categories', payload);
        setCategories((prev) => [...prev, data.category]);
        toast.success('Category created');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/categories/${deleteId}`);
      setCategories((prev) => prev.filter((c) => c._id !== deleteId));
      toast.success('Category deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="page-heading">
        <h1>Categories</h1>
        <button className="btn btn-primary" onClick={openAdd}><FiPlus /> Add Category</button>
      </div>

      {loading ? <Loader /> : (
        <div className="section-card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat._id}>
                    <td>
                      {cat.image
                        ? <img src={cat.image} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                        : <div style={{ width: 40, height: 40, borderRadius: 6, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiFolder /></div>
                      }
                    </td>
                    <td className="fw-600">{cat.name}</td>
                    <td className="text-muted">{cat.slug}</td>
                    <td>{cat.productCount ?? '—'}</td>
                    <td>
                      <span className={`badge ${cat.isActive ? 'badge-active' : 'badge-inactive'}`}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon" title="Edit" onClick={() => openEdit(cat)}><FiEdit2 /></button>
                        <button className="btn-icon danger" title="Delete" onClick={() => setDeleteId(cat._id)}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted" style={{ padding: 40 }}>
                      <FiFolder style={{ fontSize: '2rem', opacity: 0.3, marginBottom: 8 }} /><br />No categories yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category form modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h2 style={{ marginBottom: 16 }}>{editId ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name *</label>
                <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input className="form-control" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
              </div>
              <div className="form-group">
                <label>Parent Category</label>
                <select className="form-control" value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}>
                  <option value="">None (Top-level)</option>
                  {categories.filter((c) => c._id !== editId).map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="catActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                <label htmlFor="catActive" style={{ margin: 0, fontWeight: 500 }}>Active</label>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal
          title="Delete Category"
          message="Are you sure? Categories with products cannot be deleted."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  );
}
