import { Link } from 'react-router-dom';
import SkillBadge from './SkillBadge';
import './ProjectCard.css';

export default function ProjectCard({ project }) {
  if (!project) return null;

  return (
    <article className="project-card">
      <div className="card-topline">
        <span className={`status ${project.status}`}>{project.status}</span>
        <span>{new Date(project.created_at).toLocaleDateString()}</span>
      </div>

      <h3><Link to={`/projects/${project.id}`}>{project.title}</Link></h3>
      <p>{project.description || 'No description provided.'}</p>

      <div className="meta-row budget-row">
        <strong>${project.budget_min}</strong>
        <span>to</span>
        <strong>${project.budget_max}</strong>
      </div>

      <div className="badge-row">
        {project.skills && project.skills.length > 0 ? (
          project.skills.map((skill) => <SkillBadge key={skill.id || skill.name} skill={skill} />)
        ) : (
          <span className="muted small-text">No skills listed</span>
        )}
      </div>

      <p className="muted">
        Client:{' '}
        {project.client ? (
          <Link to={`/freelancers/${project.client.id}`}>{project.client.name}</Link>
        ) : (
          `#${project.client_id}`
        )}
      </p>
    </article>
  );
}
