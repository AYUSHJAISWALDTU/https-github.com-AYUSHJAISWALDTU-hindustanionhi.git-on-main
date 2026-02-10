import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX } from 'react-icons/fi';
import API from '../utils/api';
import ProductCard from '../components/common/ProductCard';
import Loader from '../components/common/Loader';
import SEO from '../components/common/SEO';
import { trackViewProductList, trackSearch } from '../utils/analytics';

/**
 * ShopPage — product listing with filters, sorting, and pagination
 */
export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sizes: searchParams.get('sizes') || '',
    fabric: searchParams.get('fabric') || '',
    sort: searchParams.get('sort') || 'newest',
    search: searchParams.get('search') || '',
    page: Number(searchParams.get('page')) || 1,
  });

  // Fetch categories
  useEffect(() => {
    API.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Find category ID from slug
        let categoryId = '';
        if (filters.category && categories.length > 0) {
          const cat = categories.find((c) => c.slug === filters.category);
          if (cat) categoryId = cat._id;
        }

        const params = new URLSearchParams();
        if (categoryId) params.set('category', categoryId);
        if (filters.minPrice) params.set('minPrice', filters.minPrice);
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
        if (filters.sizes) params.set('sizes', filters.sizes);
        if (filters.fabric) params.set('fabric', filters.fabric);
        if (filters.sort) params.set('sort', filters.sort === 'newest' ? '' : filters.sort);
        if (filters.search) params.set('search', filters.search);
        params.set('page', filters.page);
        params.set('limit', '12');

        const { data } = await API.get(`/products?${params.toString()}`);
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setTotal(data.total);

        // Track product list view & search
        trackViewProductList(filters.category || 'Shop All', data.products);
        if (filters.search) trackSearch(filters.search);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };

    // Wait for categories to load if category filter is set
    if (filters.category && categories.length === 0) return;
    fetchProducts();
  }, [filters, categories]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val && val !== 'newest' && val !== 1) params.set(key, val);
    });
    setSearchParams(params, { replace: true });
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      sizes: '',
      fabric: '',
      sort: 'newest',
      search: '',
      page: 1,
    });
  };

  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
  const fabricOptions = ['Cotton', 'Silk', 'Georgette', 'Rayon', 'Velvet', 'Organza', 'Linen', 'Tissue'];
  const colorSwatches = [
    { name: 'Red', hex: '#DC143C' },
    { name: 'Blue', hex: '#4169E1' },
    { name: 'Green', hex: '#228B22' },
    { name: 'Pink', hex: '#FF69B4' },
    { name: 'Yellow', hex: '#FFD700' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Maroon', hex: '#800000' },
    { name: 'Navy', hex: '#000080' },
    { name: 'Gold', hex: '#DAA520' },
    { name: 'Orange', hex: '#FF8C00' },
  ];

  const getCategoryTitle = () => {
    if (filters.category) {
      const cat = categories.find((c) => c.slug === filters.category);
      return cat ? cat.name : 'Shop';
    }
    return filters.search ? `Search: "${filters.search}"` : 'All Products';
  };

  const getSEOTitle = () => {
    if (filters.category) {
      const cat = categories.find((c) => c.slug === filters.category);
      if (cat) return `Buy ${cat.name} Online — Ethnic ${cat.name} for Women`;
    }
    if (filters.search) return `Search Results for "${filters.search}"`;
    return 'Shop All Indian Ethnic Wear Online — Odhnis, Sarees, Kurtis & More';
  };

  const getSEODescription = () => {
    if (filters.category) {
      const cat = categories.find((c) => c.slug === filters.category);
      if (cat) return `Browse our curated collection of ${cat.name.toLowerCase()} at Hindustani Odhni. Handcrafted with premium fabrics. Free shipping on orders above ₹999. Buy now!`;
    }
    return 'Shop premium Indian ethnic fashion. Handloom odhnis, cotton dupattas, silk sarees, kurtis, lehengas & festive wear. Free delivery across India.';
  };

  const getSEOKeywords = () => {
    const base = 'Indian ethnic wear online, buy ethnic fashion';
    if (filters.category) {
      const cat = categories.find((c) => c.slug === filters.category);
      if (cat) return `buy ${cat.name.toLowerCase()} online, ${cat.name.toLowerCase()} for women, ${base}, Hindustani Odhni`;
    }
    return `handloom odhni online, cotton odhni for women, ${base}, Hindustani Odhni`;
  };

  return (
    <div className="listing-page container">
      <SEO
        title={getSEOTitle()}
        description={getSEODescription()}
        keywords={getSEOKeywords()}
        canonical={filters.category ? `/shop?category=${filters.category}` : '/shop'}
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Shop', url: '/shop' },
          ...(filters.category
            ? [{ name: getCategoryTitle(), url: `/shop?category=${filters.category}` }]
            : []),
        ]}
      />
      {/* Header */}
      <div className="listing-header">
        <div>
          <h1>{getCategoryTitle()}</h1>
          <span className="results-count">{total} products found</span>
        </div>
        <div className="listing-controls">
          <div className="listing-sort">
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Layout: Filters + Products */}
      <div className="listing-layout">
        {/* Filters Sidebar */}
        <aside className={`filters-sidebar ${filtersOpen ? 'open' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Filters</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={clearFilters}
                style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}
              >
                Clear All
              </button>
              <button
                className="mobile-menu-close"
                onClick={() => setFiltersOpen(false)}
                style={{ display: filtersOpen ? 'block' : 'none' }}
              >
                <FiX />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="filter-section">
            <h3>Search</h3>
            <input
              type="text"
              placeholder="Search products..."
              className="form-control"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="filter-section">
            <h3>Category</h3>
            <div className="filter-option" onClick={() => updateFilter('category', '')}>
              <input type="radio" checked={!filters.category} readOnly />
              <span>All Categories</span>
            </div>
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="filter-option"
                onClick={() => updateFilter('category', cat.slug)}
              >
                <input type="radio" checked={filters.category === cat.slug} readOnly />
                <span>{cat.name}</span>
              </div>
            ))}
          </div>

          {/* Price Range */}
          <div className="filter-section">
            <h3>Price Range</h3>
            <div className="price-range">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => updateFilter('minPrice', e.target.value)}
              />
              <span>—</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => updateFilter('maxPrice', e.target.value)}
              />
            </div>
          </div>

          {/* Size */}
          <div className="filter-section">
            <h3>Size</h3>
            {sizeOptions.map((size) => (
              <label key={size} className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.sizes.split(',').includes(size)}
                  onChange={(e) => {
                    const current = filters.sizes ? filters.sizes.split(',') : [];
                    const updated = e.target.checked
                      ? [...current, size]
                      : current.filter((s) => s !== size);
                    updateFilter('sizes', updated.join(','));
                  }}
                />
                <span>{size}</span>
              </label>
            ))}
          </div>

          {/* Fabric */}
          <div className="filter-section">
            <h3>Fabric</h3>
            {fabricOptions.map((fab) => (
              <div
                key={fab}
                className="filter-option"
                onClick={() => updateFilter('fabric', filters.fabric === fab ? '' : fab)}
              >
                <input type="radio" checked={filters.fabric === fab} readOnly />
                <span>{fab}</span>
              </div>
            ))}
          </div>

          {/* Colors */}
          <div className="filter-section">
            <h3>Color</h3>
            <div className="filter-colors">
              {colorSwatches.map((color) => (
                <div
                  key={color.name}
                  className="color-swatch"
                  style={{
                    background: color.hex,
                    border: color.hex === '#FFFFFF' ? '2px solid #ddd' : '2px solid transparent',
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div>
          {loading ? (
            <Loader />
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🔍</div>
              <h3>No products found</h3>
              <p>Try adjusting your filters or search term</p>
              <button onClick={clearFilters} className="btn btn-secondary">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={filters.page <= 1}
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      className={pg === filters.page ? 'active' : ''}
                      onClick={() => setFilters((prev) => ({ ...prev, page: pg }))}
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    disabled={filters.page >= totalPages}
                    onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Button */}
      <button className="filter-btn-mobile" onClick={() => setFiltersOpen(true)}>
        <FiFilter /> Filters
      </button>
    </div>
  );
}
