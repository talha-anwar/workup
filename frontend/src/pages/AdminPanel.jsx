import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../api/admin';
import AdminNav from '../components/AdminNav';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

function prettyKey(key) {
  return key.replaceAll('_', ' ');
}

export default function AdminPanel() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');

      try {
        const data = await getAdminStats(token);
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  return (
    <main className="admin-panel-page page-shell">
      <div className="page-heading">
        <p className="eyebrow">Private area</p>
        <h1>Admin Panel</h1>
        <p>Use the separate admin sections to search, filter, review reports, and moderate accounts.</p>
      </div>

      <AdminNav />

      {loading && <p className="empty">Loading admin stats...</p>}
      {error && <p className="error">{error}</p>}

      {stats && (
        <section className="stats-grid admin-stats-grid">
          {Object.entries(stats).map(([key, value]) => {
            const content = (
              <>
                <span>{prettyKey(key)}</span>
                <strong>{value ?? 'N/A'}</strong>
              </>
            );

            if (key === 'total_reports_pending') {
              return (
                <Link className="admin-stat-card" key={key} to="/admin/reports?status=pending" title="Open pending reports">
                  {content}
                  <small>Click to review pending reports</small>
                </Link>
              );
            }

            return <article className="admin-stat-card" key={key}>{content}</article>;
          })}
        </section>
      )}

      <section className="feature-grid">
        <article>
          <h3>Users</h3>
          <p>Search users by email/Gmail, open profiles, review active reports, and suspend or ban without deleting database records.</p>
          <Link className="button-link" to="/admin/users">Manage users</Link>
        </article>
        <article>
          <h3>Projects</h3>
          <p>Search projects by title and cancel projects when moderation action is needed. Admins cannot mark work open or complete.</p>
          <Link className="button-link" to="/admin/projects">Manage projects</Link>
        </article>
        <article>
          <h3>Reports</h3>
          <p>Filter reports, review details, and change report status from one moderation queue.</p>
          <Link className="button-link" to="/admin/reports">Review reports</Link>
        </article>
      </section>
    </main>
  );
}
