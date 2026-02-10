import { NavLink, useLocation } from 'react-router-dom';
import {
  FiGrid, FiShoppingBag, FiPackage, FiUsers, FiShoppingCart,
  FiFolder, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';

const navItems = [
  { to: '/', icon: <FiGrid />, label: 'Dashboard', section: 'Main' },
  { to: '/products', icon: <FiShoppingBag />, label: 'Products', section: 'Main' },
  { to: '/orders', icon: <FiPackage />, label: 'Orders', section: 'Manage' },
  { to: '/users', icon: <FiUsers />, label: 'Users', section: 'Manage' },
  { to: '/carts', icon: <FiShoppingCart />, label: 'Carts', section: 'Manage' },
  { to: '/categories', icon: <FiFolder />, label: 'Categories', section: 'Manage' },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();

  // Group items by section
  const sections = {};
  navItems.forEach((item) => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">🛡️</span>
          <span className="brand-text">
            Hindustan<span>Onhi</span>
          </span>
        </div>

        <nav className="sidebar-nav">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section}>
              <div className="nav-section-title">{section}</div>
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={`nav-item ${isActive(item.to) ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>
      </aside>
    </>
  );
}
