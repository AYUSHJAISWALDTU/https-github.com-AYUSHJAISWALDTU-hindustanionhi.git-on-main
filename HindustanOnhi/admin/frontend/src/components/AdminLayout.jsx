import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const titleMap = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/orders': 'Orders',
  '/users': 'Users',
  '/carts': 'Carts',
  '/categories': 'Categories',
};

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Derive title from route
  let title = 'Admin Panel';
  for (const [path, label] of Object.entries(titleMap)) {
    if (path === '/' && location.pathname === '/') { title = label; break; }
    if (path !== '/' && location.pathname.startsWith(path)) { title = label; break; }
  }

  return (
    <div className="admin-layout">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className={`admin-main ${collapsed ? 'collapsed' : ''}`}>
        <Topbar title={title} onToggleMobile={() => setMobileOpen(!mobileOpen)} />
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
