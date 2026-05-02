import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function getDefaultRole(userData) {
  if (!userData) return null;
  if (userData.role === 'both') return localStorage.getItem('activeRole') || 'client';
  return userData.role;
}

export function AuthProvider({ children }) {
  const savedUser = getSavedUser();
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUserState] = useState(() => savedUser);
  const [activeRole, setActiveRoleState] = useState(() => getDefaultRole(savedUser));

  const setUser = (userData) => {
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }

    setUserState(userData || null);
    setActiveRoleState(getDefaultRole(userData));
  };

  const setActiveRole = (role) => {
    if (!user || user.role !== 'both') return;
    if (role !== 'client' && role !== 'freelancer') return;

    localStorage.setItem('activeRole', role);
    setActiveRoleState(role);
  };

  const login = (tokenValue, userData) => {
    localStorage.setItem('token', tokenValue);
    setToken(tokenValue);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeRole');
    setToken(null);
    setUserState(null);
    setActiveRoleState(null);
  };

  const value = useMemo(
    () => ({ token, user, activeRole, isAuthenticated: Boolean(token && user), login, logout, setUser, setActiveRole }),
    [token, user, activeRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function canClient(user, activeRole) {
  if (!user) return false;
  if (user.role === 'admin') return false;
  if (user.role === 'both') return activeRole ? activeRole === 'client' : true;
  return user.role === 'client';
}

export function canFreelancer(user, activeRole) {
  if (!user) return false;
  if (user.role === 'admin') return false;
  if (user.role === 'both') return activeRole ? activeRole === 'freelancer' : true;
  return user.role === 'freelancer';
}
