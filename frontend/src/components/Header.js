import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FaUserCircle } from 'react-icons/fa';
import SearchBox from './SearchBox';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme, availableThemes } = useTheme();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* --- LEFT CORNER --- */}
        <Link to="/" className="logo">Blogsy</Link>

        {/* --- RIGHT CORNER --- */}
        <div className="header-right-side">
          <SearchBox />

          <nav className="main-nav">
            <NavLink to="/about">About</NavLink>
            {user && <NavLink to="/posts/create">Create Post</NavLink>}
            {user && <NavLink to="/drafts">Drafts</NavLink>}
          </nav>

          {/* --- THEME SWITCHER DROPDOWN --- */}
          <select
            className="theme-switcher-dropdown"
            value={theme}
            onChange={e => setTheme(e.target.value)}
            style={{ marginLeft: '1rem', padding: '0.3rem 0.7rem', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--card-background)', color: 'var(--text-color)' }}
            aria-label="Select theme"
          >
            {availableThemes.map(t => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>

          <div className="user-actions">
            {user ? (
              <>
                <button onClick={onLogout} className="logout-btn">Logout</button>
                <Link to={`/profile/${user.username}`} className="profile-link">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="profile-avatar-icon"
                    />
                  ) : (
                    <FaUserCircle className="profile-avatar-icon" />
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;