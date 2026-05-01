import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSkills } from '../api/skills';
import { getFreelancerProfile, updateFreelancerProfile, updateUser } from '../api/users';
import { canFreelancer, useAuth } from '../context/AuthContext';
import './Settings.css';

export default function Settings() {
  const { user, token, activeRole, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const showFreelancerFields = canFreelancer(user, activeRole) && user?.role !== 'admin';

  useEffect(() => {
    setName(user?.name || '');
  }, [user?.name]);

  useEffect(() => {
    async function loadSettings() {
      if (!showFreelancerFields) return;

      try {
        const skillData = await getSkills();
        setSkills(skillData);
      } catch {
        setSkills([]);
      }

      try {
        const profile = await getFreelancerProfile(user.id);
        setBio(profile.bio || '');
        setHourlyRate(profile.hourly_rate || '');
        setSelectedSkills((profile.skills || []).map((skill) => skill.id));
      } catch {
        // Client-only accounts do not have freelancer profiles.
      }
    }

    loadSettings();
  }, [user?.id, showFreelancerFields]);

  const toggleSkill = (skillId) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter((id) => id !== skillId));
    } else {
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const updatedUser = await updateUser(user.id, { name }, token);
      setUser(updatedUser);

      if (showFreelancerFields) {
        await updateFreelancerProfile(user.id, {
          bio,
          hourly_rate: hourlyRate === '' ? 0 : Number(hourlyRate),
          skill_ids: selectedSkills,
        }, token);
      }

      setMessage('Settings saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <main className="settings-page page-shell narrow-page">
      <section className="auth-card settings-card">
        <p className="eyebrow">Account</p>
        <h1>Profile settings</h1>
        <p className="muted">Update your basic profile information.</p>

        <form className="stack-form" onSubmit={saveSettings}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label>
            Email
            <input value={user?.email || ''} disabled />
          </label>

          <label>
            Account role
            <input value={user?.role || ''} disabled />
          </label>

          {showFreelancerFields && (
            <>
              <label>
                Bio
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows="4" />
              </label>

              <label>
                Hourly rate
                <input
                  type="number"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
              </label>

              <div>
                <label>Freelancer skills</label>
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
                {skills.length === 0 && <p className="muted small-text">No skills available yet. Run the backend seed script.</p>}
              </div>
            </>
          )}

          <button disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</button>
        </form>

        {message && <p className="notice">{message}</p>}
        {error && <p className="error">{error}</p>}

        <button className="secondary danger-button" onClick={handleLogout}>Logout</button>
      </section>
    </main>
  );
}
