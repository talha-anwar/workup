import { useState } from 'react';
import { createReport, REPORT_REASONS } from '../api/reports';
import { useAuth } from '../context/AuthContext';
import './ReportModal.css';
export default function ReportModal({ reportedUserId, projectId, reviewId, onClose }) {
  const { token } = useAuth();
  const [reason, setReason] = useState('other');
  const [details, setDetails] = useState('');
  const [message, setMessage] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    try {
      await createReport({ reported_user_id: Number(reportedUserId), reason, details, project_id: projectId || null, review_id: reviewId || null }, token);
      setMessage('Report submitted.');
    } catch (err) { setMessage(err.message); }
  };
  return (
    <section className="report-modal">
      <div className="modal-card">
        <button className="icon-button" onClick={onClose}>×</button>
        <h2>Report this user</h2>
        <form onSubmit={submit} className="stack-form">
          <label>Reason<select value={reason} onChange={(e) => setReason(e.target.value)}>{REPORT_REASONS.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}</select></label>
          <label>Details<textarea value={details} onChange={(e) => setDetails(e.target.value)} /></label>
          <button>Submit report</button>
        </form>
        {message && <p className="notice">{message}</p>}
      </div>
    </section>
  );
}
