import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminUsers, updateUserStatus } from '../api/admin';
import AdminNav from '../components/AdminNav';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

const USER_STATUSES = ['active', 'suspended', 'banned'];
const USER_ROLES = ['', 'client', 'freelancer', 'both', 'admin'];
const PAGE_SIZE = 25;

export default function AdminUsers() {
  const { token } = useAuth();
  const [filters, setFilters] = useState({ email: '', role: '', status: '' });
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadUsers = async (override = {}) => {
    setLoading(true);
    setError('');

    const nextOffset = override.offset ?? offset;
    const nextFilters = override.filters ?? filters;

    try {
      const data = await getAdminUsers(token, {
        email: nextFilters.email,
        role: nextFilters.role,
        status: nextFilters.status,
        limit: PAGE_SIZE,
        offset: nextOffset,
      });

      setUsers(data.items || []);
      setTotal(data.total || 0);
      setOffset(data.offset || nextOffset);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers({ offset: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setOffset(0);
    loadUsers({ offset: 0 });
  };

  const clearFilters = () => {
    const emptyFilters = { email: '', role: '', status: '' };
    setFilters(emptyFilters);
    setOffset(0);
    loadUsers({ filters: emptyFilters, offset: 0 });
  };

  const setStatus = async (id, status) => {
    try {
      await updateUserStatus(id, status, token);
      loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user status.');
    }
  };

  const goToPage = (pageNumber) => {
    const nextOffset = (pageNumber - 1) * PAGE_SIZE;
    setOffset(nextOffset);
    loadUsers({ offset: nextOffset });
  };

  const previousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 10;

    let start = Math.max(1, currentPage - 4);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  };

  return (
    <main className="admin-panel-page page-shell">
      <div className="page-heading">
        <p className="eyebrow">Admin users</p>
        <h1>Users</h1>
        <p>
          Search by email/Gmail, open profiles by clicking names, and retain all user records while banning or suspending accounts.
        </p>
      </div>

      <AdminNav />

      <form className="filter-panel" onSubmit={applyFilters}>
        <label>
          Email / Gmail
          <input
            value={filters.email}
            onChange={(e) => updateFilter('email', e.target.value)}
            placeholder="name@gmail.com"
          />
        </label>

        <label>
          Role
          <select value={filters.role} onChange={(e) => updateFilter('role', e.target.value)}>
            {USER_ROLES.map((role) => (
              <option key={role || 'all'} value={role}>
                {role || 'All roles'}
              </option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {USER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <div className="filter-actions">
          <button type="submit">Search</button>
          <button type="button" className="secondary" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
      {loading && <p className="empty">Loading users...</p>}

      {!loading && (
        <section className="panel">
          <div className="panel-title-row">
            <div>
              <h2>User results</h2>
              <p className="muted small-text">
                Showing {users.length} of {total} users.
              </p>
            </div>

            <div className="actions">
              <button
                type="button"
                className="secondary"
                disabled={currentPage === 1}
                onClick={previousPage}
              >
                Previous
              </button>

              <button
                type="button"
                className="secondary"
                disabled={currentPage === totalPages}
                onClick={nextPage}
              >
                Next
              </button>
            </div>
          </div>

          <div className="table-wrap admin-scroll-panel">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {users.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link className="table-link" to={`/admin/users/${item.id}`}>
                        {item.name}
                      </Link>
                    </td>
                    <td>{item.email}</td>
                    <td>{item.role}</td>
                    <td>
                      <select
                        value={item.status}
                        disabled={item.role === 'admin'}
                        onChange={(e) => setStatus(item.id, e.target.value)}
                      >
                        {USER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && <p className="empty">No users found.</p>}

          {total > PAGE_SIZE && (
            <div
              className="pagination-bar"
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                marginTop: '22px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="secondary"
                disabled={currentPage === 1}
                onClick={previousPage}
              >
                Previous
              </button>

              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  style={{
                    minWidth: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    border: page === currentPage ? '1px solid #4f46e5' : '1px solid #dbe4f0',
                    background: page === currentPage ? '#4f46e5' : '#fff',
                    color: page === currentPage ? '#fff' : '#1f2a44',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className="secondary"
                disabled={currentPage === totalPages}
                onClick={nextPage}
              >
                Next
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}