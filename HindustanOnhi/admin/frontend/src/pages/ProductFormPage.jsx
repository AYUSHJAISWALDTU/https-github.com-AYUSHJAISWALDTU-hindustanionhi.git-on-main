import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiUploadCloud, FiX } from 'react-icons/fi';
import api from '../utils/api';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const OCCASIONS = ['', 'casual', 'festive', 'wedding', 'party', 'office', 'daily'];
const COLLECTIONS = ['', 'festive', 'wedding', 'daily-wear'];
const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    category: '',
    fabric: '',
    occasion: '',
    productCollection: '',
    tags: [],
    isFeatured: false,
    isNewArrival: false,
    isTrending: false,
    isActive: true,
  });
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  // New fields
  const [sizeChart, setSizeChart] = useState([]);
  const [fabricDetails, setFabricDetails] = useState({ fabric: '', lining: '', transparency: '', washCare: [] });
  const [styleWithIds, setStyleWithIds] = useState([]);
  const [modelInfo, setModelInfo] = useState({ height: '', wearingSize: '' });
  const [allProducts, setAllProducts] = useState([]);

  // Temp inputs
  const [newTag, setNewTag] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [newWashCare, setNewWashCare] = useState('');

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
    api.get('/products?limit=200').then(({ data }) => setAllProducts(data.products || [])).catch(() => {});

    if (isEdit) {
      api.get(`/products/${id}`).then(({ data }) => {
        const p = data.product;
        setForm({
          name: p.name || '',
          description: p.description || '',
          price: p.price || '',
          comparePrice: p.comparePrice || '',
          category: p.category?._id || '',
          fabric: p.fabric || '',
          occasion: p.occasion || '',
          productCollection: p.productCollection || '',
          tags: p.tags || [],
          isFeatured: p.isFeatured || false,
          isNewArrival: p.isNewArrival || false,
          isTrending: p.isTrending || false,
          isActive: p.isActive !== false,
        });
        setSizes(p.sizes || []);
        setColors(p.colors || []);
        setExistingImages(p.images || []);
        setSizeChart(p.sizeChart || []);
        setFabricDetails(p.fabricDetails || { fabric: '', lining: '', transparency: '', washCare: [] });
        setStyleWithIds((p.styleWith || []).map((s) => (typeof s === 'string' ? s : s._id)));
        setModelInfo(p.modelInfo || { height: '', wearingSize: '' });
        setLoading(false);
      }).catch(() => {
        toast.error('Product not found');
        navigate('/products');
      });
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  // Sizes
  const addSize = (size) => {
    if (sizes.find((s) => s.size === size)) return;
    setSizes([...sizes, { size, stock: 0 }]);
  };
  const updateSizeStock = (idx, stock) => {
    setSizes(sizes.map((s, i) => (i === idx ? { ...s, stock: Number(stock) } : s)));
  };
  const removeSize = (idx) => setSizes(sizes.filter((_, i) => i !== idx));

  // Colors
  const addColor = () => {
    if (!newColorName.trim()) return;
    setColors([...colors, { name: newColorName.trim(), hex: newColorHex }]);
    setNewColorName('');
    setNewColorHex('#000000');
  };
  const removeColor = (idx) => setColors(colors.filter((_, i) => i !== idx));

  // Tags
  const addTag = () => {
    if (!newTag.trim() || form.tags.includes(newTag.trim())) return;
    setForm((f) => ({ ...f, tags: [...f.tags, newTag.trim()] }));
    setNewTag('');
  };
  const removeTag = (idx) => setForm((f) => ({ ...f, tags: f.tags.filter((_, i) => i !== idx) }));

  // Images
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles((prev) => [...prev, ...files]);
  };
  const removeNewFile = (idx) => setNewFiles(newFiles.filter((_, i) => i !== idx));
  const removeExistingImage = (imgId) => setExistingImages(existingImages.filter((img) => img._id !== imgId));

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category || !form.description) {
      return toast.error('Fill all required fields');
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'tags') {
          fd.append(key, JSON.stringify(val));
        } else {
          fd.append(key, val);
        }
      });
      fd.append('sizes', JSON.stringify(sizes));
      fd.append('colors', JSON.stringify(colors));
      fd.append('images', JSON.stringify(existingImages));
      fd.append('sizeChart', JSON.stringify(sizeChart));
      fd.append('fabricDetails', JSON.stringify(fabricDetails));
      fd.append('styleWith', JSON.stringify(styleWithIds));
      fd.append('modelInfo', JSON.stringify(modelInfo));

      newFiles.forEach((f) => fd.append('imageFiles', f));

      if (isEdit) {
        await api.put(`/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated!');
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product created!');
      }
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="product-form-page">
      <button className="back-link" onClick={() => navigate('/products')}>
        <FiArrowLeft /> Back to Products
      </button>

      <div className="page-heading">
        <h1>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="section-card mb-24">
          <div className="section-header"><h2>Basic Info</h2></div>
          <div className="section-body">
            <div className="form-group">
              <label>Product Name *</label>
              <input className="form-control" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea className="form-control" name="description" value={form.description} onChange={handleChange} rows={4} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price (₹) *</label>
                <input type="number" className="form-control" name="price" value={form.price} onChange={handleChange} min="0" required />
              </div>
              <div className="form-group">
                <label>Compare Price (₹)</label>
                <input type="number" className="form-control" name="comparePrice" value={form.comparePrice} onChange={handleChange} min="0" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select className="form-control" name="category" value={form.category} onChange={handleChange} required>
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Fabric</label>
                <input className="form-control" name="fabric" value={form.fabric} onChange={handleChange} placeholder="e.g. Cotton, Silk" />
              </div>
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label>Occasion</label>
                <select className="form-control" name="occasion" value={form.occasion} onChange={handleChange}>
                  {OCCASIONS.map((o) => <option key={o} value={o}>{o || 'None'}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Collection</label>
                <select className="form-control" name="productCollection" value={form.productCollection} onChange={handleChange}>
                  {COLLECTIONS.map((c) => <option key={c} value={c}>{c || 'None'}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8 }}>
                <label className="form-check"><input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} /> Featured</label>
                <label className="form-check"><input type="checkbox" name="isNewArrival" checked={form.isNewArrival} onChange={handleChange} /> New Arrival</label>
                <label className="form-check"><input type="checkbox" name="isTrending" checked={form.isTrending} onChange={handleChange} /> Trending</label>
                <label className="form-check"><input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} /> Visible on Site</label>
              </div>
            </div>
          </div>
        </div>

        {/* Sizes */}
        <div className="section-card mb-24">
          <div className="section-header"><h2>Sizes & Stock</h2></div>
          <div className="section-body">
            <div className="chips-row mb-16">
              {ALL_SIZES.map((s) => (
                <button type="button" key={s} className="btn btn-sm btn-outline" onClick={() => addSize(s)} style={{ opacity: sizes.find((x) => x.size === s) ? 0.4 : 1 }}>
                  + {s}
                </button>
              ))}
            </div>
            {sizes.map((s, i) => (
              <div key={i} className="flex items-center gap-8 mb-8">
                <span className="chip">
                  {s.size}
                  <button type="button" className="chip-remove" onClick={() => removeSize(i)}><FiX /></button>
                </span>
                <input
                  type="number"
                  className="form-control"
                  style={{ width: 100 }}
                  value={s.stock}
                  onChange={(e) => updateSizeStock(i, e.target.value)}
                  min="0"
                  placeholder="Stock"
                />
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>units</span>
              </div>
            ))}
          </div>
        </div>

        {/* Colors */}
        <div className="section-card mb-24">
          <div className="section-header"><h2>Colors</h2></div>
          <div className="section-body">
            <div className="flex items-center gap-8 mb-16">
              <input className="form-control" style={{ width: 160 }} placeholder="Color name" value={newColorName} onChange={(e) => setNewColorName(e.target.value)} />
              <input type="color" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} style={{ width: 40, height: 38, border: 'none', cursor: 'pointer' }} />
              <button type="button" className="btn btn-sm btn-outline" onClick={addColor}>Add</button>
            </div>
            <div className="chips-row">
              {colors.map((c, i) => (
                <span key={i} className="chip">
                  <span className="color-swatch-sm" style={{ background: c.hex }} />
                  {c.name}
                  <button type="button" className="chip-remove" onClick={() => removeColor(i)}><FiX /></button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="section-card mb-24">
          <div className="section-header"><h2>Tags</h2></div>
          <div className="section-body">
            <div className="flex items-center gap-8 mb-16">
              <input className="form-control" style={{ width: 200 }} placeholder="Add tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} />
              <button type="button" className="btn btn-sm btn-outline" onClick={addTag}>Add</button>
            </div>
            <div className="chips-row">
              {form.tags.map((t, i) => (
                <span key={i} className="chip">
                  {t}
                  <button type="button" className="chip-remove" onClick={() => removeTag(i)}><FiX /></button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Size Chart */}
        <div className="section-card mb-24">
          <div className="section-header"><h2>📏 Size Chart</h2></div>
          <div className="section-body">
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 12 }}>
              Add measurement details for each size (in inches).
            </p>
            <div className="table-wrapper">
              <table className="order-items-table" style={{ minWidth: 500 }}>
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Bust</th>
                    <th>Waist</th>
                    <th>Hip</th>
                    <th>Length</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sizeChart.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <select className="form-control" style={{ width: 80 }} value={row.size} onChange={(e) => {
                          const updated = [...sizeChart]; updated[i] = { ...row, size: e.target.value }; setSizeChart(updated);
                        }}>
                          <option value="">—</option>
                          {ALL_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      {['bust', 'waist', 'hip', 'length'].map((field) => (
                        <td key={field}>
                          <input className="form-control" style={{ width: 70 }} placeholder='"' value={row[field] || ''} onChange={(e) => {
                            const updated = [...sizeChart]; updated[i] = { ...row, [field]: e.target.value }; setSizeChart(updated);
                          }} />
                        </td>
                      ))}
                      <td>
                        <button type="button" className="chip-remove" onClick={() => setSizeChart(sizeChart.filter((_, j) => j !== i))} style={{ color: '#e74c3c' }}><FiX /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="btn btn-sm btn-outline" style={{ marginTop: 10 }}
              onClick={() => setSizeChart([...sizeChart, { size: '', bust: '', waist: '', hip: '', length: '' }])}>
              + Add Row
            </button>
          </div>
        </div>

        {/* Fabric & Care */}
        <div className="section-card mb-24">
          <div className="section-header"><h2>🧵 Fabric & Care Details</h2></div>
          <div className="section-body">
            <div className="form-row">
              <div className="form-group">
                <label>Fabric</label>
                <input className="form-control" placeholder="e.g. 100% Cotton" value={fabricDetails.fabric}
                  onChange={(e) => setFabricDetails((f) => ({ ...f, fabric: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Lining</label>
                <input className="form-control" placeholder="e.g. No lining" value={fabricDetails.lining}
                  onChange={(e) => setFabricDetails((f) => ({ ...f, lining: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Transparency</label>
                <select className="form-control" value={fabricDetails.transparency}
                  onChange={(e) => setFabricDetails((f) => ({ ...f, transparency: e.target.value }))}>
                  <option value="">Select</option>
                  <option value="Opaque">Opaque</option>
                  <option value="Slightly Transparent">Slightly Transparent</option>
                  <option value="Transparent">Transparent</option>
                  <option value="Semi-Sheer">Semi-Sheer</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Wash Care Instructions</label>
              <div className="flex items-center gap-8 mb-8">
                <input className="form-control" style={{ flex: 1 }} placeholder="e.g. Hand wash separately" value={newWashCare}
                  onChange={(e) => setNewWashCare(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newWashCare.trim()) { setFabricDetails((f) => ({ ...f, washCare: [...(f.washCare || []), newWashCare.trim()] })); setNewWashCare(''); }
                    }
                  }} />
                <button type="button" className="btn btn-sm btn-outline" onClick={() => {
                  if (newWashCare.trim()) { setFabricDetails((f) => ({ ...f, washCare: [...(f.washCare || []), newWashCare.trim()] })); setNewWashCare(''); }
                }}>Add</button>
              </div>
              <div className="chips-row">
                {(fabricDetails.washCare || []).map((w, i) => (
                  <span key={i} className="chip">
                    {w}
                    <button type="button" className="chip-remove" onClick={() => setFabricDetails((f) => ({ ...f, washCare: f.washCare.filter((_, j) => j !== i) }))}><FiX /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Model / Fit Info */}
        <div className="section-card mb-24">
          <div className="section-header"><h2>👤 Model & Fit Info</h2></div>
          <div className="section-body">
            <div className="form-row">
              <div className="form-group">
                <label>Model Height</label>
                <input className="form-control" placeholder={`e.g. 5'8"`} value={modelInfo.height}
                  onChange={(e) => setModelInfo((m) => ({ ...m, height: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Wearing Size</label>
                <select className="form-control" value={modelInfo.wearingSize}
                  onChange={(e) => setModelInfo((m) => ({ ...m, wearingSize: e.target.value }))}>
                  <option value="">Select</option>
                  {ALL_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Style With */}
        <div className="section-card mb-24">
          <div className="section-header"><h2>✨ Style With This</h2></div>
          <div className="section-body">
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 12 }}>
              Select products that go well with this item (e.g. dupatta, palazzo, earrings).
            </p>
            <select className="form-control" style={{ marginBottom: 12 }}
              onChange={(e) => {
                const val = e.target.value;
                if (val && !styleWithIds.includes(val)) setStyleWithIds([...styleWithIds, val]);
                e.target.value = '';
              }}>
              <option value="">— Select product to add —</option>
              {allProducts
                .filter((p) => p._id !== id && !styleWithIds.includes(p._id))
                .map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
            </select>
            <div className="chips-row">
              {styleWithIds.map((sid) => {
                const p = allProducts.find((pr) => pr._id === sid);
                return (
                  <span key={sid} className="chip">
                    {p?.name || sid.slice(-6)}
                    <button type="button" className="chip-remove" onClick={() => setStyleWithIds(styleWithIds.filter((x) => x !== sid))}><FiX /></button>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="section-card mb-24">
          <div className="section-header"><h2>Product Images</h2></div>
          <div className="section-body">
            <p style={{ color: '#64748b', fontSize: '0.82rem', marginBottom: 12 }}>
              Upload multiple views: Front, Side, Back, Close-up (fabric), Model full view
            </p>
            <label className="image-upload-zone">
              <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              <FiUploadCloud className="upload-icon" />
              <p>Click to upload images (max 5MB each)</p>
            </label>

            <div className="image-preview-grid">
              {existingImages.map((img) => (
                <div key={img._id} className="image-preview">
                  <img src={img.url} alt={img.alt} />
                  <button type="button" className="remove-img" onClick={() => removeExistingImage(img._id)}><FiX /></button>
                </div>
              ))}
              {newFiles.map((f, i) => (
                <div key={i} className="image-preview">
                  <img src={URL.createObjectURL(f)} alt="" />
                  <button type="button" className="remove-img" onClick={() => removeNewFile(i)}><FiX /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-8">
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button type="button" className="btn btn-outline btn-lg" onClick={() => navigate('/products')}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
