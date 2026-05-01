import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProject } from '../api/projects';
import { getSkills } from '../api/skills';
import { useAuth } from '../context/AuthContext';
import './PostProject.css';

export default function PostProject() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', budget_min: '', budget_max: '' });
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSkills() {
      try {
        const data = await getSkills();
        setSkills(data);
      } catch {
        setSkills([]);
      }
    }

    loadSkills();
  }, []);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSkill = (skillId) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter((id) => id !== skillId));
    } else {
      setSelectedSkills([...selectedSkills, skillId]);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const project = await createProject({
        title: form.title,
        description: form.description,
        budget_min: Number(form.budget_min),
        budget_max: Number(form.budget_max),
        skill_ids: selectedSkills,
      }, token);

      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="post-project-page page-shell narrow-page">
      <section className="form-card">
        <p className="eyebrow">Client workspace</p>
        <h1>Post a project</h1>
        <p className="muted">Describe the work clearly so freelancers can send accurate bids.</p>

        <form onSubmit={onSubmit} className="stack-form">
          <label>
            Title
            <input required value={form.title} onChange={(e) => update('title', e.target.value)} />
          </label>

          <label>
            Description
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)} />
          </label>

          <div className="two-column-form">
            <label>
              Budget min
              <input type="number" required value={form.budget_min} onChange={(e) => update('budget_min', e.target.value)} />
            </label>

            <label>
              Budget max
              <input type="number" required value={form.budget_max} onChange={(e) => update('budget_max', e.target.value)} />
            </label>
          </div>

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
            {skills.length === 0 && <p className="muted small-text">No skills found yet. Run the backend seed script to add demo skills.</p>}
          </div>

          <button disabled={loading}>{loading ? 'Posting...' : 'Post project'}</button>
        </form>

        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}
