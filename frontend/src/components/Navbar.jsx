import { Link, NavLink, useNavigate } from 'react-router-dom';
import { canClient, useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, activeRole, setActiveRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link className="brand" to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/'}>
        WorkUp
      </Link>

      <div className="nav-links">
        {user && <NavLink to="/search">Browse</NavLink>}

        {/* ✅ Hide Dashboard only for admin */}
        {user && user.role !== 'admin' && (
          <NavLink to="/dashboard">Dashboard</NavLink>
        )}

        {canClient(user, activeRole) && (
          <NavLink to="/post-project">Post Project</NavLink>
        )}

        {user && <NavLink to="/settings">Settings</NavLink>}

        {user?.role === 'admin' && (
          <NavLink to="/admin">Admin</NavLink>
        )}
      </div>

      <div className="nav-auth">
        {user?.role === 'both' && (
          <div className="role-switch" aria-label="Switch account mode">
            <button
              type="button"
              className={activeRole === 'client' ? 'active' : ''}
              onClick={() => setActiveRole('client')}
            >
              Client
            </button>
            <button
              type="button"
              className={activeRole === 'freelancer' ? 'active' : ''}
              onClick={() => setActiveRole('freelancer')}
            >
              Freelancer
            </button>
          </div>
        )}

        {user ? (
          <>
            <span>{user.name}</span>
            <button className="secondary" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link className="button-link" to="/register">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}