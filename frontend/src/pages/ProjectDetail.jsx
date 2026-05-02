import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProjectBids, submitBid, updateBidStatus } from '../api/bids';
import { getProject } from '../api/projects';
import BidCard from '../components/BidCard';
import ReportModal from '../components/ReportModal';
import SkillBadge from '../components/SkillBadge';
import { canClient, canFreelancer, useAuth } from '../context/AuthContext';
import './ProjectDetail.css';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user, token, activeRole } = useAuth();
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidForm, setBidForm] = useState({ amount: '', delivery_days: '', cover_letter: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  const isOwner = user?.id === project?.client_id;
  const clientMode = canClient(user, activeRole);
  const freelancerMode = canFreelancer(user, activeRole);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getProject(id);
      setProject(data);

      if (token && user?.id === data.client_id && clientMode) {
        const bidData = await getProjectBids(id, token);
        setBids(bidData);
      } else {
        setBids([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, user?.id, activeRole]);

  const sendBid = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await submitBid(
        id,
        {
          amount: Number(bidForm.amount),
          delivery_days: Number(bidForm.delivery_days),
          cover_letter: bidForm.cover_letter,
        },
        token
      );
      setMessage('Bid submitted successfully.');
      setBidForm({ amount: '', delivery_days: '', cover_letter: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const changeBid = async (bidId, status) => {
    try {
      await updateBidStatus(bidId, status, token);
      setMessage(`Bid ${status}.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <main className="project-detail-page page-shell"><p>Loading project...</p></main>;
  }

  if (error && !project) {
    return <main className="project-detail-page page-shell"><p className="error">{error}</p></main>;
  }

  return (
    <main className="project-detail-page page-shell">
      <section className="detail-card">
        <div className="card-topline">
          <span className={`status ${project.status}`}>{project.status}</span>
          <span>{new Date(project.created_at).toLocaleDateString()}</span>
        </div>

        <h1>{project.title}</h1>
        <p>{project.description || 'No description provided.'}</p>

        <div className="meta-row">
          <strong>${project.budget_min}</strong>
          <span>to</span>
          <strong>${project.budget_max}</strong>
        </div>

        <div className="badge-row">
          {project.skills?.map((skill) => <SkillBadge key={skill.id || skill.name} skill={skill} />)}
        </div>

        <p className="muted">
          Posted by{' '}
          {project.client ? (
            <Link to={`/freelancers/${project.client.id}`}>{project.client.name}</Link>
          ) : (
            `#${project.client_id}`
          )}
        </p>

        {user && user.id !== project.client_id && (
          <button className="secondary" onClick={() => setShowReport(true)}>Report client</button>
        )}
      </section>

      {message && <p className="notice">{message}</p>}
      {error && <p className="error">{error}</p>}

      {user?.role === 'both' && isOwner && activeRole === 'freelancer' && (
        <p className="notice">Switch to Client mode in the navbar to manage bids for this project.</p>
      )}

      {freelancerMode && !isOwner && project.status === 'open' && (
        <section className="panel">
          <h2>Submit a bid</h2>
          <form onSubmit={sendBid} className="stack-form">
            <label>
              Amount
              <input
                type="number"
                required
                value={bidForm.amount}
                onChange={(event) => setBidForm({ ...bidForm, amount: event.target.value })}
              />
            </label>

            <label>
              Delivery days
              <input
                type="number"
                required
                value={bidForm.delivery_days}
                onChange={(event) => setBidForm({ ...bidForm, delivery_days: event.target.value })}
              />
            </label>

            <label>
              Cover letter
              <textarea
                value={bidForm.cover_letter}
                onChange={(event) => setBidForm({ ...bidForm, cover_letter: event.target.value })}
              />
            </label>

            <button type="submit">Send bid</button>
          </form>
        </section>
      )}

      {clientMode && isOwner && (
        <section className="panel">
          <h2>Bids received</h2>
          <div className="cards-grid">
            {bids.map((bid) => (
              <BidCard key={bid.id} bid={bid} canManage onStatusChange={changeBid} />
            ))}
          </div>
          {bids.length === 0 && <p className="empty">No bids yet.</p>}
        </section>
      )}

      {showReport && (
        <ReportModal reportedUserId={project.client_id} projectId={project.id} onClose={() => setShowReport(false)} />
      )}
    </main>
  );
}
