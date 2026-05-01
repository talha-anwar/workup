import SkillBadge from './SkillBadge';
import './BidCard.css';

export default function BidCard({ bid, canManage = false, onStatusChange }) {
  if (!bid) return null;

  return (
    <article className="bid-card">
      <div className="card-topline">
        <strong>{bid.freelancer?.user?.name || `Freelancer #${bid.freelancer_id}`}</strong>
        <span className={`status ${bid.status}`}>{bid.status}</span>
      </div>

      <p>{bid.cover_letter || 'No cover letter provided.'}</p>

      <div className="badge-row">
        {bid.freelancer?.skills?.map((skill) => <SkillBadge key={skill.id || skill.name} skill={skill} />)}
      </div>

      <div className="meta-row budget-row">
        <span><strong>${bid.amount}</strong> proposed</span>
        <span><strong>{bid.delivery_days}</strong> days</span>
      </div>

      {canManage && bid.status === 'pending' && (
        <div className="actions">
          <button onClick={() => onStatusChange?.(bid.id, 'accepted')}>Accept</button>
          <button className="secondary danger" onClick={() => onStatusChange?.(bid.id, 'rejected')}>Reject</button>
        </div>
      )}
    </article>
  );
}
