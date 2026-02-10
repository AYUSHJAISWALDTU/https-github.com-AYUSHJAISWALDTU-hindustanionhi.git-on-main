import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AdminLayout from './components/AdminLayout';
import Loader from './components/Loader';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductFormPage from './pages/ProductFormPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import UsersPage from './pages/UsersPage';
import CartsPage from './pages/CartsPage';
import CategoriesPage from './pages/CategoriesPage';

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Loader /></div>;
  if (!admin) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Loader /></div>;
  if (admin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id/edit" element={<ProductFormPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="carts" element={<CartsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
