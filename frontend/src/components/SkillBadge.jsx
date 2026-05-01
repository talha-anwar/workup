import './SkillBadge.css';
export default function SkillBadge({ skill }) {
  const name = typeof skill === 'string' ? skill : skill?.name;
  if (!name) return null;
  return <span className="skill-badge">{name}</span>;
}
