import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiSun, FiMoon } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
import SearchBox from './SearchBox';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
          </nav>

          {/* --- THEME TOGGLE MOVED HERE --- */}
          <button onClick={toggleTheme} className="theme-toggle-btn">
            {theme === 'light' ? <FiMoon /> : <FiSun />}
          </button>

          <div className="user-actions">
            {user ? (
              <>
                <button onClick={onLogout} className="logout-btn">Logout</button>
                
                {/* --- PROFILE ICON IS NOW THE LAST ITEM FOR LOGGED-IN USERS --- */}
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
                {/* ------------------------------------------------------------- */}
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