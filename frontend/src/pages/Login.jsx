import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { login as loginRequest } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const adminLogin = searchParams.get('admin') === '1';

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginRequest(form.email, form.password);

      if (adminLogin && data.user?.role !== 'admin') {
        setError('This login page is only for admin accounts.');
        return;
      }

      if (!adminLogin && data.user?.role === 'admin') {
        setError('Admin accounts must use the admin login button on the home page.');
        return;
      }

      login(data.access_token, data.user);

      if (data.user?.role === 'admin') {
        navigate('/admin', { replace: true });
        return;
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page auth-page">
      <section className="auth-card">
        <p className="eyebrow">
          {adminLogin ? 'Private access' : 'Welcome back'}
        </p>

        <h1>{adminLogin ? 'Admin Login' : 'Login'}</h1>

        <p className="muted">
          {adminLogin
            ? 'Only existing admin accounts can sign in here.'
            : 'Login with your WorkUp account.'}
        </p>

        <form onSubmit={onSubmit} className="stack-form">
          <label>
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {!adminLogin && (
          <p className="muted">
            Need an account? <Link to="/register">Register</Link>
          </p>
        )}

        {adminLogin && (
          <p className="muted">
            Not an admin? <Link to="/login">Use normal login</Link>
          </p>
        )}
      </section>
    </main>
  );
}