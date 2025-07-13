import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaGithub } from 'react-icons/fa';
import './AuthLayout.css';

const AuthLayout = ({ children, pageTitle, image }) => {
  const wrapperStyle = {
    backgroundImage: `url(${image})`,
  };
  const currentYear = new Date().getFullYear();

  return (
    <div className="auth-page-wrapper" style={wrapperStyle}>
      <header className="auth-header">
        <Link to="/" className="auth-logo">Blogsy</Link>
        <Link to="/" className="back-to-site-link">Back to Site</Link>
      </header>

      <div className="auth-container">
        <div className="welcome-panel">
          <h1 className="welcome-title">{pageTitle}</h1>

          {/* --- THIS IS THE FIX --- */}
          {/* The social icons are now part of the same paragraph as the welcome text */}
          <p className="welcome-text">
            Explore a world of ideas. Share your voice, connect with readers, and build your community.
            <span className="welcome-socials-inline">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
            </span>
          </p>
          {/* ------------------------- */}
        </div>
        <div className="form-panel">
          {children}
        </div>
      </div>

      <footer className="auth-footer">
        <p className="auth-footer-text">© {currentYear} Blogsy. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default AuthLayout;