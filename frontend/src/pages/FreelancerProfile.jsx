import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getUserReviews } from '../api/reviews';
import { getSkills } from '../api/skills';
import {
  getFreelancerProfile,
  getUser,
  getUserProfileStats,
  updateFreelancerProfile,
  updateUser,
} from '../api/users';
import ReportModal from '../components/ReportModal';
import ReviewCard from '../components/ReviewCard';
import SkillBadge from '../components/SkillBadge';
import { useAuth } from '../context/AuthContext';
import './FreelancerProfile.css';

const EMPTY_STATS = {
  completed_projects_count: 0,
  posted_projects_count: 0,
  completed_projects: [],
  posted_projects: [],
};

export default function FreelancerProfile() {
  const { userId } = useParams();
  const { user, token, setUser } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [reviews, setReviews] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [form, setForm] = useState({ name: '', bio: '', hourly_rate: 0 });
  const [showReport, setShowReport] = useState(false);
  const [openDetails, setOpenDetails] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isOwn = user?.id === Number(userId);

  const load = async () => {
    setError('');

    try {
      const userData = await getUser(userId);
      const profileData = await getFreelancerProfile(userId).catch(() => null);
      const reviewData = await getUserReviews(userId).catch(() => []);
      const statsData = await getUserProfileStats(userId).catch(() => EMPTY_STATS);

      setProfileUser(userData);
      setProfile(profileData);
      setReviews(reviewData);
      setStats(statsData || EMPTY_STATS);
      setForm({
        name: userData.name,
        bio: profileData?.bio || '',
        hourly_rate: profileData?.hourly_rate || 0,
      });
      setSelectedSkills((profileData?.skills || []).map((skill) => skill.id));
    } catch (err) {
      setError(err.message || 'Failed to load profile.');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    async function loadSkills() {
      if (!isOwn || !profile) return;

      try {
        const data = await getSkills();
        setSkills(data);
      } catch {
        setSkills([]);
      }
    }

    loadSkills();
  }, [isOwn, profile]);

  const toggleSkill = (skillId) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter((id) => id !== skillId));
    } else {
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };

  const toggleDetails = (key) => {
    setOpenDetails((current) => (current === key ? '' : key));
  };

  const save = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const updatedUser = await updateUser(userId, { name: form.name }, token);

      await updateFreelancerProfile(
        userId,
        {
          bio: form.bio,
          hourly_rate: Number(form.hourly_rate),
          skill_ids: selectedSkills,
        },
        token
      );

      if (isOwn) setUser(updatedUser);

      setMessage('Profile updated.');
      load();
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    }
  };

  const renderProjectRows = (items, emptyText) => {
    if (!items.length) return <p className="empty">{emptyText}</p>;

    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Budget</th>
              <th>Status</th>
              <th>Client</th>
            </tr>
          </thead>
          <tbody>
            {items.map((project) => (
              <tr key={project.id}>
                <td><Link to={`/projects/${project.id}`}>{project.title}</Link></td>
                <td>${project.budget_min} - ${project.budget_max}</td>
                <td><span className={`status ${project.status}`}>{String(project.status).replaceAll('_', ' ')}</span></td>
                <td>{project.client?.name || `#${project.client_id}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (!profileUser && !error) {
    return (
      <main className="freelancer-profile-page page-shell">
        <p className="empty">Loading profile...</p>
      </main>
    );
  }

  const profileLabel = profile ? 'Freelancer' : profileUser?.role === 'client' ? 'Client' : 'Profile';

  return (
    <main className="freelancer-profile-page page-shell">
      <section className="detail-card profile-hero" style={{ position: 'relative' }}>
        {user && !isOwn && (
          <button
            type="button"
            className="secondary danger"
            onClick={() => setShowReport(true)}
            style={{ position: 'absolute', top: '20px', right: '20px' }}
          >
            Report user
          </button>
        )}

        <div className="avatar-circle large-avatar">
          {(profileUser?.name || 'U').charAt(0)}
        </div>

        <div>
          <p className="eyebrow">{profileLabel}</p>
          <h1>{profileUser?.name || 'User'}</h1>

          {profile ? (
            <>
              <p>{profile.bio || 'No bio yet.'}</p>
              <strong>${profile.hourly_rate || 0}/hr</strong>

              <div className="badge-row profile-skills">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill) => (
                    <SkillBadge key={skill.id || skill.name} skill={skill} />
                  ))
                ) : (
                  <span className="muted small-text">No skills listed</span>
                )}
              </div>
            </>
          ) : (
            <p>
              This user has posted {stats.posted_projects_count} project{stats.posted_projects_count === 1 ? '' : 's'}.
            </p>
          )}
        </div>
      </section>

      <section className="profile-stats-grid">
        <button type="button" className="profile-stat-card" onClick={() => toggleDetails('completed')}>
          <span>Projects completed</span>
          <strong>{stats.completed_projects_count}</strong>
          <small>Tap to view details</small>
        </button>

        <button type="button" className="profile-stat-card" onClick={() => toggleDetails('posted')}>
          <span>Projects posted</span>
          <strong>{stats.posted_projects_count}</strong>
          <small>Tap to view details</small>
        </button>
      </section>

      {openDetails === 'completed' && (
        <section className="panel">
          <h2>Completed projects</h2>
          {renderProjectRows(stats.completed_projects || [], 'No completed projects yet.')}
        </section>
      )}

      {openDetails === 'posted' && (
        <section className="panel">
          <h2>Posted projects</h2>
          {renderProjectRows(stats.posted_projects || [], 'No posted projects yet.')}
        </section>
      )}

      {isOwn && profile && (
        <section className="panel">
          <h2>Edit profile</h2>

          <form className="stack-form" onSubmit={save}>
            <label>
              Name
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>

            <label>
              Bio
              <textarea
                value={form.bio}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
              />
            </label>

            <label>
              Hourly rate
              <input
                type="number"
                value={form.hourly_rate}
                onChange={(event) => setForm({ ...form, hourly_rate: event.target.value })}
              />
            </label>

            <div>
              <label>Skills</label>

              <div className="skill-picker">
                {skills.map((skill) => (
                  <label className="skill-check" key={skill.id}>
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(skill.id)}
                      onChange={() => toggleSkill(skill.id)}
                    />
                    <span>{skill.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit">Save changes</button>
          </form>
        </section>
      )}

      {message && <p className="notice">{message}</p>}
      {error && <p className="error">{error}</p>}

      <section className="panel">
        <h2>Reviews</h2>

        <div className="cards-grid">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {!reviews.length && <p className="empty">No reviews yet.</p>}
      </section>

      {showReport && (
        <ReportModal
          reportedUserId={Number(userId)}
          onClose={() => setShowReport(false)}
        />
      )}
    </main>
  );
}
