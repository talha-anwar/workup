import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminProjects, updateAdminProjectStatus } from '../api/admin';
import AdminNav from '../components/AdminNav';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

const PROJECT_STATUSES = ['', 'open', 'in_progress', 'completed', 'cancelled'];
const PAGE_SIZE = 25;

export default function AdminProjects() {
  const { token } = useAuth();
  const [filters, setFilters] = useState({ title: '', status: '' });
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = async (override = {}) => {
    setLoading(true);
    setError('');

    const nextOffset = override.offset ?? offset;
    const nextFilters = override.filters ?? filters;

    try {
      const data = await getAdminProjects(token, {
        title: nextFilters.title,
        status: nextFilters.status,
        limit: PAGE_SIZE,
        offset: nextOffset,
        view_all: false,
      });

      setProjects(data.items || []);
      setTotal(data.total || 0);
      setOffset(data.offset || nextOffset);
    } catch (err) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ offset: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setOffset(0);
    load({ offset: 0 });
  };

  const clearFilters = () => {
    const emptyFilters = { title: '', status: '' };
    setFilters(emptyFilters);
    setOffset(0);
    load({ filters: emptyFilters, offset: 0 });
  };

  const cancelProject = async (id) => {
    setMessage('');
    setError('');

    try {
      await updateAdminProjectStatus(id, 'cancelled', token);
      setMessage('Project cancelled successfully.');
      load();
    } catch (err) {
      setError(err.message || 'Failed to cancel project.');
    }
  };

  const goToPage = (pageNumber) => {
    const nextOffset = (pageNumber - 1) * PAGE_SIZE;
    setOffset(nextOffset);
    load({ offset: nextOffset });
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
        <p className="eyebrow">Admin projects</p>
        <h1>Projects</h1>
        <p>
          Search by project title and cancel projects when required. Opening or completing projects is blocked for admins.
        </p>
      </div>

      <AdminNav />

      <form className="filter-panel" onSubmit={applyFilters}>
        <label>
          Project title
          <input
            value={filters.title}
            onChange={(e) => updateFilter('title', e.target.value)}
            placeholder="Dashboard, API, mobile app..."
          />
        </label>

        <label>
          Status
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status || 'all'} value={status}>
                {status || 'All statuses'}
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

      {message && <p className="notice">{message}</p>}
      {error && <p className="error">{error}</p>}
      {loading && <p className="empty">Loading projects...</p>}

      {!loading && (
        <section className="panel">
          <div className="panel-title-row">
            <div>
              <h2>Project results</h2>
              <p className="muted small-text">
                Showing {projects.length} of {total} projects.
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
                  <th>Title</th>
                  <th>Client</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Admin action</th>
                </tr>
              </thead>

              <tbody>
                {projects.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link className="table-link" to={`/projects/${item.id}`}>
                        {item.title}
                      </Link>
                    </td>

                    <td>
                      {item.client ? (
                        <Link className="table-link" to={`/admin/users/${item.client.id}`}>
                          {item.client.name}
                        </Link>
                      ) : (
                        item.client_id
                      )}
                    </td>

                    <td>
                      ${item.budget_min} - ${item.budget_max}
                    </td>

                    <td>
                      <span className={`status ${item.status}`}>
                        {item.status}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="secondary danger"
                        disabled={item.status === 'cancelled'}
                        onClick={() => cancelProject(item.id)}
                      >
                        {item.status === 'cancelled' ? 'Cancelled' : 'Cancel project'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {projects.length === 0 && <p className="empty">No projects found.</p>}

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