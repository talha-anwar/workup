import { NavLink } from 'react-router-dom';
import './AdminNav.css';

export default function AdminNav() {
  return (
    <nav className="admin-nav" aria-label="Admin panel navigation">
      <NavLink end to="/admin">Overview</NavLink>
      <NavLink to="/admin/users">Users</NavLink>
      <NavLink to="/admin/projects">Projects</NavLink>
      <NavLink to="/admin/reports">Reports</NavLink>
    </nav>
  );
}
