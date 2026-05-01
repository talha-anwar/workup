import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchFreelancers, searchProjects } from '../api/search';
import ProjectCard from '../components/ProjectCard';
import SkillBadge from '../components/SkillBadge';
import './Search.css';

const TABS = {
  projects: 'projects',
  freelancers: 'freelancers',
};

const PAGE_SIZE = 12;

export default function Search() {
  const [activeTab, setActiveTab] = useState(TABS.projects);
  const [filters, setFilters] = useState({
    name: '',
    skill: '',
    budget_min: '',
    budget_max: '',
    min_rate: '',
    max_rate: '',
  });

  const [allResults, setAllResults] = useState([]);
  const [results, setResults] = useState([]);
  const [offset, setOffset] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(allResults.length / PAGE_SIZE));

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filterByName = (items) => {
    const searchName = filters.name.trim().toLowerCase();

    if (!searchName) return items;

    return items.filter((item) => {
      if (activeTab === TABS.projects) {
        return item.title?.toLowerCase().includes(searchName);
      }

      return item.user?.name?.toLowerCase().includes(searchName);
    });
  };

  const paginate = (items, newOffset = 0) => {
    const safeOffset = Math.max(0, newOffset);
    setResults(items.slice(safeOffset, safeOffset + PAGE_SIZE));
    setOffset(safeOffset);
  };

  const goToPage = (pageNumber) => {
    const nextOffset = (pageNumber - 1) * PAGE_SIZE;
    paginate(allResults, nextOffset);
  };

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      let data;

      if (activeTab === TABS.projects) {
        data = await searchProjects({
          skill: filters.skill,
          budget_min: filters.budget_min,
          budget_max: filters.budget_max,
        });
      } else {
        data = await searchFreelancers({
          skill: filters.skill,
          min_rate: filters.min_rate,
          max_rate: filters.max_rate,
        });
      }

      const filtered = filterByName(data || []);
      setAllResults(filtered);
      paginate(filtered, 0);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSubmit = (event) => {
    event.preventDefault();
    load();
  };

  const clearFilters = () => {
    const emptyFilters = {
      name: '',
      skill: '',
      budget_min: '',
      budget_max: '',
      min_rate: '',
      max_rate: '',
    };

    setFilters(emptyFilters);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
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
    <main className="search-page page-shell">
      <div className="page-heading">
        <p className="eyebrow">Marketplace</p>
        <h1>Search WorkUp</h1>
        <p>Browse projects or freelancers.</p>
      </div>

      <div className="admin-nav">
        <button
          type="button"
          className={activeTab === TABS.projects ? 'active' : ''}
          onClick={() => setActiveTab(TABS.projects)}
        >
          Projects
        </button>

        <button
          type="button"
          className={activeTab === TABS.freelancers ? 'active' : ''}
          onClick={() => setActiveTab(TABS.freelancers)}
        >
          Freelancers
        </button>
      </div>

      <form className="filter-panel" onSubmit={handleSubmit}>
        <label>
          {activeTab === TABS.projects ? 'Project title' : 'Freelancer name'}
          <input
            value={filters.name}
            onChange={(e) => updateFilter('name', e.target.value)}
            placeholder={activeTab === TABS.projects ? 'Search project title' : 'Search freelancer name'}
          />
        </label>

        <label>
          Skill
          <input
            value={filters.skill}
            onChange={(e) => updateFilter('skill', e.target.value)}
            placeholder="React"
          />
        </label>

        {activeTab === TABS.projects ? (
          <>
            <label>
              Budget min
              <input
                type="number"
                value={filters.budget_min}
                onChange={(e) => updateFilter('budget_min', e.target.value)}
              />
            </label>

            <label>
              Budget max
              <input
                type="number"
                value={filters.budget_max}
                onChange={(e) => updateFilter('budget_max', e.target.value)}
              />
            </label>
          </>
        ) : (
          <>
            <label>
              Min rate
              <input
                type="number"
                value={filters.min_rate}
                onChange={(e) => updateFilter('min_rate', e.target.value)}
              />
            </label>

            <label>
              Max rate
              <input
                type="number"
                value={filters.max_rate}
                onChange={(e) => updateFilter('max_rate', e.target.value)}
              />
            </label>
          </>
        )}

        <div className="filter-actions">
          <button type="submit">Search</button>
          <button type="button" className="secondary" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
      {loading && <p className="notice">Loading results...</p>}

      {!loading && (
        <section className="panel">
          <div className="panel-title-row">
            <div>
              <h2>
                {activeTab === TABS.projects ? 'Project results' : 'Freelancer results'}
              </h2>
              <p className="muted small-text">
                Showing {results.length} of {allResults.length}{' '}
                {activeTab === TABS.projects ? 'projects' : 'freelancers'}.
              </p>
            </div>

            <div className="actions">
              <button
                type="button"
                className="secondary"
                disabled={currentPage === 1}
                onClick={prevPage}
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

          <div
            className="admin-scroll-panel"
            style={{
              maxHeight: '600px',
              overflowY: 'auto',
              paddingRight: '12px',
            }}
          >
            <div className="cards-grid">
              {results.map((item) =>
                activeTab === TABS.projects ? (
                  <ProjectCard key={item.id} project={item} />
                ) : (
                  <article className="profile-card" key={item.user_id}>
                    <div className="avatar-circle">
                      {(item.user?.name || 'F').charAt(0)}
                    </div>

                    <h3>
                      <Link to={`/freelancers/${item.user_id}`}>
                        {item.user?.name || `Freelancer #${item.user_id}`}
                      </Link>
                    </h3>

                    <p>{item.bio || 'No bio available.'}</p>

                    <strong>${item.hourly_rate || 0}/hr</strong>

                    <div className="badge-row">
                      {item.skills && item.skills.length > 0 ? (
                        item.skills.map((skill) => (
                          <SkillBadge key={skill.id || skill.name} skill={skill} />
                        ))
                      ) : (
                        <span className="muted small-text">No skills listed</span>
                      )}
                    </div>
                  </article>
                )
              )}
            </div>
          </div>

          {!results.length && <p className="empty">No results found.</p>}

          {allResults.length > PAGE_SIZE && (
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
                onClick={prevPage}
              >
                Previous
              </button>

              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={page === currentPage ? 'active-page' : 'secondary'}
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