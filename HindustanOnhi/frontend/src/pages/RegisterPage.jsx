import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/common/SEO';
import toast from 'react-hot-toast';

/**
 * RegisterPage — new user registration form
 */
export default function RegisterPage() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <SEO title="Create Your Account" description="Join the Hindustani Odhni family. Create an account to shop handcrafted Indian ethnic fashion, track orders & get exclusive offers." canonical="/register" noIndex={true} />
      <div className="auth-card">
        <div className="logo">
          <h2>🪷 Hindustan<span>Onhi</span></h2>
        </div>
        <h1>Create Account</h1>
        <p className="subtitle">Join the HindustanOnhi family</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              className="form-control"
              placeholder="Enter 10-digit phone number"
              value={form.phone}
              onChange={handleChange}
              required
              pattern="[0-9]{10}"
              title="Enter a valid 10-digit phone number"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              className="form-control"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
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

        {/* Google Sign Up */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                await googleLogin(credentialResponse.credential);
                navigate('/');
              } catch (err) {
                toast.error(err.response?.data?.message || 'Google sign up failed');
              }
            }}
            onError={() => toast.error('Google sign up failed')}
            theme="outline"
            size="large"
            width="100%"
            text="signup_with"
            shape="rectangular"
          />
        </div>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
