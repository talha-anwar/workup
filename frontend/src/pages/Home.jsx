import { Link, Navigate } from 'react-router-dom';
import hero from '../assets/hero.png';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export default function Home() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="home-page page-shell">
      <section className="hero-grid">
        <div>
          <p className="eyebrow">Freelance marketplace</p>
          <h1>Find talent, post work, and manage projects in one place.</h1>
          <p className="lead">
            WorkUp connects clients with freelancers through project posts, bids,
            contracts, reviews, reports, and admin moderation.
          </p>

          <div className="actions">
            <Link className="button-link" to="/register">Create Account</Link>
            <Link className="secondary button-link" to="/login">Login</Link>
          </div>
        </div>

        <img className="hero-image" src={hero} alt="WorkUp collaboration illustration" />
      </section>

      <section className="feature-grid">
        <article>
          <h3>For clients</h3>
          <p>Post projects, review bids, and accept the best proposal.</p>
        </article>
        <article>
          <h3>For freelancers</h3>
          <p>Login first, then browse open work and submit proposals.</p>
        </article>
      </section>

      <Link className="admin-corner-link" to="/login?admin=1">Admin Login</Link>
    </main>
  );
}
