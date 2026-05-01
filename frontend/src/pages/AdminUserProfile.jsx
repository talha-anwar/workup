import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAdminUserProfile, updateReportStatus, updateUserStatus } from '../api/admin';
import AdminNav from '../components/AdminNav';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

const USER_STATUSES = ['active', 'suspended', 'banned'];
const REPORT_STATUSES = ['pending', 'reviewed', 'dismissed'];

export default function AdminUserProfile() {
  const { userId } = useParams();
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAdminUserProfile(userId, token);
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId, token]);

  const changeUserStatus = async (status) => {
    setMessage('');
    setError('');
    try {
      await updateUserStatus(userId, status, token);
      setMessage(`User marked ${status}. The profile and email remain in the database.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const changeReportStatus = async (reportId, status) => {
    setMessage('');
    setError('');
    try {
      await updateReportStatus(reportId, status, token);
      setMessage(`Report #${reportId} marked ${status}.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const user = profile?.user;

  return (
    <main className="admin-panel-page page-shell">
      <div className="page-heading">
        <p className="eyebrow">Admin profile review</p>
        <h1>{user?.name || 'User profile'}</h1>
        <p>Review account details, active reports, and moderation status without deleting the user from the database.</p>
      </div>

      <AdminNav />

      {loading && <p className="empty">Loading profile...</p>}
      {error && <p className="error">{error}</p>}
      {message && <p className="notice">{message}</p>}

      {!loading && user && (
        <>
          <section className="detail-card admin-profile-card">
            <div className="avatar-circle large-avatar">{(user.name || 'U').charAt(0)}</div>
            <div className="admin-profile-main">
              <p className="eyebrow">{user.role}</p>
              <h2>{user.name}</h2>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
              <div className="actions">
                <span className={`status ${user.status}`}>{user.status}</span>
                <span className="status pending">{profile.active_reports_count} active reports</span>
              </div>
            </div>
            <div className="admin-profile-actions">
              <label>
                Moderation status
                <select value={user.status} disabled={user.role === 'admin'} onChange={(e) => changeUserStatus(e.target.value)}>
                  {USER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              {user.role === 'admin' ? (
                <p className="muted small-text">Admin accounts cannot be modified here.</p>
              ) : (
                <p className="muted small-text">Ban or suspend keeps the email and profile record in the database.</p>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-title-row">
              <div>
                <h2>Reports on this profile</h2>
                <p className="muted small-text">Pending reports count as active reports.</p>
              </div>
              <Link className="button-link secondary" to={`/admin/reports?status=pending`}>Open pending queue</Link>
            </div>

            <div className="table-wrap admin-scroll-panel compact-scroll-panel">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Reason</th>
                    <th>Reporter</th>
                    <th>Linked item</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {(profile.reports || []).map((report) => (
                    <tr key={report.id}>
                      <td>{report.id}</td>
                      <td>{report.reason}</td>
                      <td>{report.reporter ? <Link className="table-link" to={`/admin/users/${report.reporter.id}`}>{report.reporter.name}</Link> : report.reporter_id}</td>
                      <td>
                        {report.project_id && <Link className="table-link" to={`/projects/${report.project_id}`}>Project #{report.project_id}</Link>}
                        {report.review_id && <span> Review #{report.review_id}</span>}
                        {!report.project_id && !report.review_id && <span className="muted">Profile report</span>}
                      </td>
                      <td>
                        <select value={report.status} onChange={(e) => changeReportStatus(report.id, e.target.value)}>
                          {REPORT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </td>
                      <td className="details-cell">{report.details || 'No details'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(!profile.reports || profile.reports.length === 0) && <p className="empty">No reports for this user.</p>}
          </section>
        </>
      )}
    </main>
  );
}
