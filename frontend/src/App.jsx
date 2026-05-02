import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import { canClient, useAuth } from './context/AuthContext';
import AdminPanel from './pages/AdminPanel';
import AdminProjects from './pages/AdminProjects';
import AdminReports from './pages/AdminReports';
import AdminUserProfile from './pages/AdminUserProfile';
import AdminUsers from './pages/AdminUsers';
import Dashboard from './pages/Dashboard';
import FreelancerProfile from './pages/FreelancerProfile';
import Home from './pages/Home';
import Login from './pages/Login';
import PostProject from './pages/PostProject';
import ProjectDetail from './pages/ProjectDetail';
import Register from './pages/Register';
import Search from './pages/Search';
import Settings from './pages/Settings';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function RedirectLoggedIn({ children }) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
}

function RequireRole({ children, allowed }) {
  const { user, activeRole } = useAuth();

  if (!allowed(user, activeRole)) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
}

function RedirectAdminFromDashboard({ children }) {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={
            <RedirectLoggedIn>
              <Login />
            </RedirectLoggedIn>
          }
        />

        <Route
          path="/register"
          element={
            <RedirectLoggedIn>
              <Register />
            </RedirectLoggedIn>
          }
        />

        <Route
          path="/search"
          element={
            <RequireAuth>
              <Search />
            </RequireAuth>
          }
        />

        <Route
          path="/projects/:id"
          element={
            <RequireAuth>
              <ProjectDetail />
            </RequireAuth>
          }
        />

        <Route
          path="/freelancers/:userId"
          element={
            <RequireAuth>
              <FreelancerProfile />
            </RequireAuth>
          }
        />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <RedirectAdminFromDashboard>
                <Dashboard />
              </RedirectAdminFromDashboard>
            </RequireAuth>
          }
        />

        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />

        <Route
          path="/post-project"
          element={
            <RequireAuth>
              <RequireRole allowed={canClient}>
                <PostProject />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireRole allowed={(user) => user?.role === 'admin'}>
                <AdminPanel />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/users"
          element={
            <RequireAuth>
              <RequireRole allowed={(user) => user?.role === 'admin'}>
                <AdminUsers />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/users/:userId"
          element={
            <RequireAuth>
              <RequireRole allowed={(user) => user?.role === 'admin'}>
                <AdminUserProfile />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/projects"
          element={
            <RequireAuth>
              <RequireRole allowed={(user) => user?.role === 'admin'}>
                <AdminProjects />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <RequireAuth>
              <RequireRole allowed={(user) => user?.role === 'admin'}>
                <AdminReports />
              </RequireRole>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}