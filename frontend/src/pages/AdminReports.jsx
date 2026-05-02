import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAdminReports, updateReportStatus } from '../api/admin';
import AdminNav from '../components/AdminNav';
import { useAuth } from '../context/AuthContext';
import './AdminPanel.css';

const REPORT_STATUSES = ['pending', 'reviewed', 'dismissed'];
const REPORT_REASONS = ['', 'spam', 'fake_review', 'inappropriate_content', 'payment_fraud', 'harassment', 'other'];
const PAGE_SIZE = 25;

export default function AdminReports() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    reason: '',
    reported_user_id: '',
  });

  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = async (override = {}) => {
    setLoading(true);
    setError('');

    const nextOffset = override.offset ?? offset;
    const nextFilters = override.filters ?? filters;

    try {
      const data = await getAdminReports(token, {
        status: nextFilters.status,
        reason: nextFilters.reason,
        reported_user_id: nextFilters.reported_user_id,
        limit: PAGE_SIZE,
        offset: nextOffset,
        view_all: false,
      });

      setReports(data.items || []);
      setTotal(data.total || 0);
      setOffset(data.offset || nextOffset);
    } catch (err) {
      setError(err.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const statusFromUrl = searchParams.get('status') || '';
    const nextFilters = {
      status: statusFromUrl,
      reason: filters.reason,
      reported_user_id: filters.reported_user_id,
    };

    setFilters(nextFilters);
    setOffset(0);
    load({ filters: nextFilters, offset: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, searchParams]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = (event) => {
    event.preventDefault();

    const nextParams = {};
    if (filters.status) nextParams.status = filters.status;

    setSearchParams(nextParams);
    setOffset(0);
    load({ offset: 0 });
  };

  const clearFilters = () => {
    const emptyFilters = { status: '', reason: '', reported_user_id: '' };

    setFilters(emptyFilters);
    setSearchParams({});
    setOffset(0);
    load({ filters: emptyFilters, offset: 0 });
  };

  const setStatus = async (id, status) => {
    try {
      await updateReportStatus(id, status, token);
      load();
    } catch (err) {
      setError(err.message || 'Failed to update report status.');
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
        <p className="eyebrow">Admin reports</p>
        <h1>Reports</h1>
        <p>Review moderation reports, open reported profiles, and update report review status.</p>
      </div>

      <AdminNav />

      <form className="filter-panel" onSubmit={applyFilters}>
        <label>
          Status
          <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {REPORT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label>
          Reason
          <select value={filters.reason} onChange={(e) => updateFilter('reason', e.target.value)}>
            {REPORT_REASONS.map((reason) => (
              <option key={reason || 'all'} value={reason}>
                {reason || 'All reasons'}
              </option>
            ))}
          </select>
        </label>

        <label>
          Reported user ID
          <input
            type="number"
            min="1"
            value={filters.reported_user_id}
            onChange={(e) => updateFilter('reported_user_id', e.target.value)}
            placeholder="42"
          />
        </label>

        <div className="filter-actions">
          <button type="submit">Apply filters</button>
          <button type="button" className="secondary" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </form>

      {filters.status === 'pending' && <p className="notice">Pending reports view is active.</p>}
      {error && <p className="error">{error}</p>}
      {loading && <p className="empty">Loading reports...</p>}

      {!loading && (
        <section className="panel">
          <div className="panel-title-row">
            <div>
              <h2>Report queue</h2>
              <p className="muted small-text">
                Showing {reports.length} of {total} reports.
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
                  <th>ID</th>
                  <th>Reason</th>
                  <th>Reporter</th>
                  <th>Reported</th>
                  <th>Linked item</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {reports.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.reason}</td>

                    <td>
                      {item.reporter ? (
                        <Link className="table-link" to={`/admin/users/${item.reporter.id}`}>
                          {item.reporter.name}
                        </Link>
                      ) : (
                        item.reporter_id
                      )}
                    </td>

                    <td>
                      {item.reported_user ? (
                        <Link className="table-link" to={`/admin/users/${item.reported_user.id}`}>
                          {item.reported_user.name}
                        </Link>
                      ) : (
                        item.reported_user_id
                      )}
                    </td>

                    <td>
                      {item.project_id && (
                        <Link className="table-link" to={`/projects/${item.project_id}`}>
                          Project #{item.project_id}
                        </Link>
                      )}
                      {item.review_id && <span> Review #{item.review_id}</span>}
                      {!item.project_id && !item.review_id && (
                        <span className="muted">Profile report</span>
                      )}
                    </td>

                    <td>
                      <select value={item.status} onChange={(e) => setStatus(item.id, e.target.value)}>
                        {REPORT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="details-cell">{item.details || 'No details'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {reports.length === 0 && <p className="empty">No reports found.</p>}

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