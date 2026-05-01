import './ReviewCard.css';
export default function ReviewCard({ review }) {
  if (!review) return null;
  return (
    <article className="review-card">
      <div className="card-topline"><strong>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</strong><span>{new Date(review.created_at).toLocaleDateString()}</span></div>
      <p>{review.comment || 'No written feedback.'}</p>
      <p className="muted">By {review.reviewer?.name || `User #${review.reviewer_id}`}</p>
    </article>
  );
}
