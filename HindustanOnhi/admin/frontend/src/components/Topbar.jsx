import { FiMenu, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ title, onToggleMobile }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="admin-topbar">
      <div className="topbar-left">
        <button className="mobile-toggle" onClick={onToggleMobile}>
          <FiMenu />
        </button>
        <h1>{title}</h1>
      </div>

      <div className="topbar-right">
        <div className="topbar-admin-info">
          <span>{admin?.name || 'Admin'}</span>
          <div className="topbar-avatar">
            {admin?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
        </div>
        <button className="btn-icon" onClick={handleLogout} title="Logout">
          <FiLogOut />
        </button>
      </div>
    </header>
  );
}
