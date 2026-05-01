import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyBids } from '../api/bids';
import { completeContractWork, getMyContracts, submitContractWork } from '../api/contracts';
import { getMyProjects } from '../api/projects';
import { getMyReports } from '../api/reports';
import { createReview } from '../api/reviews';
import { canClient, canFreelancer, useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const { user, token, activeRole } = useAuth();
  const [projects, setProjects] = useState([]);
  const [bids, setBids] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [reports, setReports] = useState([]);
  const [submissionForms, setSubmissionForms] = useState({});
  const [reviewForms, setReviewForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isAdmin = user?.role === 'admin';
  const clientMode = !isAdmin && canClient(user, activeRole);
  const freelancerMode = !isAdmin && canFreelancer(user, activeRole);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      if (!isAdmin) {
        const contractData = await getMyContracts(token).catch(() => []);
        const reportData = await getMyReports(token).catch(() => []);
        setContracts(contractData);
        setReports(reportData);
      }

      if (clientMode) {
        const projectData = await getMyProjects(token);
        setProjects(projectData);
      } else {
        setProjects([]);
      }

      if (freelancerMode) {
        const bidData = await getMyBids(token);
        setBids(bidData);
      } else {
        setBids([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user) loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.id, activeRole]);

  const formatMoney = (value) => `$${Number(value || 0).toFixed(0)}`;
  const formatStatus = (value) => String(value || '').replaceAll('_', ' ');

  const isClientContract = (contract) => contract.bid?.project?.client_id === user?.id;
  const isFreelancerContract = (contract) => contract.bid?.freelancer_id === user?.id;
  const hasReviewed = (contract) => contract.reviews?.some((review) => review.reviewer_id === user?.id);

  const getRevieweeId = (contract) => {
    if (isClientContract(contract)) return contract.bid?.freelancer_id;
    return contract.bid?.project?.client_id;
  };

  const getOtherPartyName = (contract) => {
    if (isClientContract(contract)) return contract.bid?.freelancer?.user?.name || 'freelancer';
    return contract.bid?.project?.client?.name || 'client';
  };

  const visibleContracts = contracts.filter((item) => {
    if (clientMode) return isClientContract(item);
    if (freelancerMode) return isFreelancerContract(item);
    return true;
  });
  const activeContracts = visibleContracts.filter((item) => item.status === 'active' || item.status === 'submitted');
  const completedContracts = visibleContracts.filter((item) => item.status === 'completed');

  const updateSubmissionForm = (contractId, value) => {
    setSubmissionForms((prev) => ({ ...prev, [contractId]: value }));
  };

  const updateReviewForm = (contractId, key, value) => {
    setReviewForms((prev) => ({
      ...prev,
      [contractId]: {
        rating: '5',
        comment: '',
        ...(prev[contractId] || {}),
        [key]: value,
      },
    }));
  };

  const submitWork = async (event, contract) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await submitContractWork(
        contract.id,
        { submission_message: submissionForms[contract.id] || '' },
        token
      );
      setSubmissionForms((prev) => ({ ...prev, [contract.id]: '' }));
      setMessage('Work submitted. The client can now review and complete it.');
      loadDashboard();
    } catch (err) {
      setError(err.message || 'Failed to submit work.');
    }
  };

  const completeWork = async (contract) => {
    setMessage('');
    setError('');

    try {
      await completeContractWork(contract.id, token);
      setMessage('Contract completed. Both sides can now leave a review.');
      loadDashboard();
    } catch (err) {
      setError(err.message || 'Failed to complete contract.');
    }
  };

  const sendReview = async (event, contract) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const form = reviewForms[contract.id] || { rating: '5', comment: '' };

    try {
      await createReview(
        contract.id,
        {
          reviewee_id: getRevieweeId(contract),
          rating: Number(form.rating),
          comment: form.comment,
        },
        token
      );
      setReviewForms((prev) => ({ ...prev, [contract.id]: { rating: '5', comment: '' } }));
      setMessage('Review submitted.');
      loadDashboard();
    } catch (err) {
      setError(err.message || 'Failed to submit review.');
    }
  };

  const renderContractAction = (contract) => {
    const canActAsFreelancer = freelancerMode && isFreelancerContract(contract);
    const canActAsClient = clientMode && isClientContract(contract);
    const canReview = contract.status === 'completed' && !hasReviewed(contract) && (canActAsFreelancer || canActAsClient);

    if (canActAsFreelancer && contract.status === 'active') {
      return (
        <form className="mini-action-form" onSubmit={(event) => submitWork(event, contract)}>
          <textarea
            rows="2"
            value={submissionForms[contract.id] || ''}
            onChange={(event) => updateSubmissionForm(contract.id, event.target.value)}
            placeholder="Write what you delivered..."
          />
          <button type="submit">Submit work</button>
        </form>
      );
    }

    if (canActAsClient && contract.status === 'submitted') {
      return (
        <div className="mini-action-form">
          <p className="muted small-text">Review the submission, then complete the contract.</p>
          <button type="button" onClick={() => completeWork(contract)}>
            Mark completed
          </button>
        </div>
      );
    }

    if (canReview) {
      const form = reviewForms[contract.id] || { rating: '5', comment: '' };

      return (
        <form className="mini-action-form" onSubmit={(event) => sendReview(event, contract)}>
          <label>
            Review {getOtherPartyName(contract)}
            <select
              value={form.rating}
              onChange={(event) => updateReviewForm(contract.id, 'rating', event.target.value)}
            >
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
          </label>
          <textarea
            rows="2"
            value={form.comment}
            onChange={(event) => updateReviewForm(contract.id, 'comment', event.target.value)}
            placeholder="Write your review..."
          />
          <button type="submit">Submit review</button>
        </form>
      );
    }

    if (contract.status === 'submitted' && canActAsFreelancer) {
      return <span className="muted small-text">Waiting for client completion.</span>;
    }

    if (contract.status === 'active' && canActAsClient) {
      return <span className="muted small-text">Waiting for freelancer submission.</span>;
    }

    if (contract.status === 'completed' && hasReviewed(contract)) {
      return <span className="muted small-text">Review submitted.</span>;
    }

    return <span className="muted small-text">No action available.</span>;
  };

  return (
    <main className="dashboard-page page-shell">
      <div className="page-heading split-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>Dashboard</h1>
          <p>
            Signed in as {user?.name} ({user?.role}
            {user?.role === 'both' ? ` - using ${activeRole} mode` : ''}).
          </p>
        </div>
      </div>

      {message && <p className="notice">{message}</p>}
      {error && <p className="error">{error}</p>}
      {loading && <p className="empty">Loading your dashboard...</p>}

      {!loading && !isAdmin && (
        <>
          <section className="dashboard-stats">
            {clientMode && (
              <article>
                <p>Projects posted</p>
                <strong>{projects.length}</strong>
              </article>
            )}

            {freelancerMode && (
              <article>
                <p>Bids sent</p>
                <strong>{bids.length}</strong>
              </article>
            )}

            <article>
              <p>Active work</p>
              <strong>{activeContracts.length}</strong>
            </article>

            <article>
              <p>Completed contracts</p>
              <strong>{completedContracts.length}</strong>
            </article>

            <article>
              <p>Reports filed</p>
              <strong>{reports.length}</strong>
            </article>
          </section>

          {clientMode && (
            <section className="panel">
              <div className="panel-title-row">
                <div>
                  <h2>My projects</h2>
                  <p className="muted small-text">Manage projects you posted.</p>
                </div>
                <Link className="button-link" to="/post-project">Post a project</Link>
              </div>

              <div className="table-wrap dashboard-scroll-panel">
                <table>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Budget</th>
                      <th>Status</th>
                      <th>Posted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id}>
                        <td><Link to={`/projects/${project.id}`}>{project.title}</Link></td>
                        <td>{formatMoney(project.budget_min)} - {formatMoney(project.budget_max)}</td>
                        <td><span className={`status ${project.status}`}>{formatStatus(project.status)}</span></td>
                        <td>{new Date(project.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {projects.length === 0 && <p className="empty">You have not posted any projects yet.</p>}
            </section>
          )}

          {freelancerMode && (
            <section className="panel">
              <div className="panel-title-row">
                <div>
                  <h2>My bids</h2>
                  <p className="muted small-text">Track bids you sent to clients.</p>
                </div>
                <Link className="button-link" to="/search">Browse projects</Link>
              </div>

              <div className="table-wrap dashboard-scroll-panel">
                <table>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Amount</th>
                      <th>Delivery</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bids.map((bid) => (
                      <tr key={bid.id}>
                        <td><Link to={`/projects/${bid.project_id}`}>{bid.project?.title || `Project #${bid.project_id}`}</Link></td>
                        <td>{formatMoney(bid.amount)}</td>
                        <td>{bid.delivery_days} days</td>
                        <td><span className={`status ${bid.status}`}>{formatStatus(bid.status)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {bids.length === 0 && <p className="empty">You have not submitted any bids yet.</p>}
            </section>
          )}

          <section className="panel">
            <div className="panel-title-row">
              <div>
                <h2>My contracts</h2>
                <p className="muted small-text">
                  Freelancer submits work, client completes it, then both sides can review.
                </p>
              </div>
            </div>

            <div className="table-wrap dashboard-scroll-panel">
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Your role</th>
                    <th>Agreed amount</th>
                    <th>Status</th>
                    <th>Submission</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleContracts.map((contract) => (
                    <tr key={contract.id}>
                      <td>
                        <Link to={`/projects/${contract.bid?.project_id}`}>
                          {contract.bid?.project?.title || `Project #${contract.bid?.project_id}`}
                        </Link>
                      </td>
                      <td>{isClientContract(contract) ? 'Client' : 'Freelancer'}</td>
                      <td>{formatMoney(contract.agreed_amount)}</td>
                      <td><span className={`status ${contract.status}`}>{formatStatus(contract.status)}</span></td>
                      <td className="details-cell">
                        {contract.submission_message ? (
                          <>
                            <p>{contract.submission_message}</p>
                            {contract.submitted_at && (
                              <span className="muted small-text">
                                Submitted {new Date(contract.submitted_at).toLocaleDateString()}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="muted small-text">No submission yet.</span>
                        )}
                      </td>
                      <td>{renderContractAction(contract)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {visibleContracts.length === 0 && <p className="empty">No contracts yet.</p>}
          </section>

          <section className="panel">
            <div className="panel-title-row">
              <div>
                <h2>My reports</h2>
                <p className="muted small-text">Reports you submitted to admins.</p>
              </div>
            </div>

            <div className="table-wrap dashboard-scroll-panel">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Reported user</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.id}</td>
                      <td>{formatStatus(report.reason)}</td>
                      <td><span className={`status ${report.status}`}>{formatStatus(report.status)}</span></td>
                      <td>{report.reported_user?.name || report.reported_user_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reports.length === 0 && <p className="empty">No reports filed.</p>}
          </section>
        </>
      )}
    </main>
  );
}
