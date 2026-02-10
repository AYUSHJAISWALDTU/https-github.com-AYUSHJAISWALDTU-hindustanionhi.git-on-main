import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/common/SEO';
import toast from 'react-hot-toast';

/**
 * LoginPage — user authentication form
 */
export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google login failed');
    }
  };

  return (
    <div className="auth-page">
      <SEO title="Login to Your Account" description="Sign in to your Hindustani Odhni account. Access orders, wishlist and exclusive offers on Indian ethnic fashion." canonical="/login" noIndex={true} />
      <div className="auth-card">
        <div className="logo">
          <h2>🪷 Hindustan<span>Onhi</span></h2>
        </div>
        <h1>Welcome Back</h1>
        <p className="subtitle">Login to your account</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '20px 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border, #e2e8f0)' }} />
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '1px' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--color-border, #e2e8f0)' }} />
        </div>

        {/* Google Sign In */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => toast.error('Google login failed')}
            theme="outline"
            size="large"
            width="100%"
            text="signin_with"
            shape="rectangular"
          />
        </div>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create Account</Link>
        </p>

        {/* Demo credentials hint */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'var(--color-bg-alt)',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}>
          <strong>Demo:</strong> admin@hindustanonhi.com / admin123<br />
          or priya@example.com / user123
        </div>
      </div>
    </div>
  );
}
