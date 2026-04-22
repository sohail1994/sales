import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar navbar-light bg-white border-bottom px-3 py-2 no-print">
      <span className="navbar-brand mb-0 h6 text-muted">
        <i className="bi bi-calendar3 me-1" />
        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </span>
      <div className="d-flex align-items-center gap-3">
        <span className="badge bg-primary rounded-pill">
          <i className="bi bi-person-circle me-1" />{user?.name || 'User'}
        </span>
        <span className="badge bg-secondary text-capitalize">{user?.role}</span>
        <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-1" />Logout
        </button>
      </div>
    </nav>
  );
}
