import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginRequest, register } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import './Register.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'freelancer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(form.name, form.email, form.password, form.role);
      const data = await loginRequest(form.email, form.password);
      login(data.access_token, data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page auth-page">
      <section className="auth-card">
        <h1>Create your account</h1>
        <p>Choose the role you want to use on WorkUp.</p>

        <form onSubmit={onSubmit} className="stack-form">
          <label>
            Name
            <input required value={form.name} onChange={(e) => update('name', e.target.value)} />
          </label>

          <label>
            Email
            <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
          </label>

          <label>
            Password
            <input
              type="password"
              minLength="6"
              required
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />
          </label>

          <label>
            Role
            <select value={form.role} onChange={(e) => update('role', e.target.value)}>
              <option value="freelancer">Freelancer</option>
              <option value="client">Client</option>
              <option value="both">Both</option>
            </select>
          </label>

          <button disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
        </form>

        {error && <p className="error">{error}</p>}
        <p>Already registered? <Link to="/login">Login</Link></p>
      </section>
    </main>
  );
}
