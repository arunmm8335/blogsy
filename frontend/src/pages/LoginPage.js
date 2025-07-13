import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const { email, password } = formData;
  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userData = await loginUser(formData);
      login(userData);
      toast.success(`Welcome back, ${userData.username}!`);
      navigate('/');
    } catch (err) {
      const errorMessage = err.message || 'Login failed.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="form-title">Sign in</h2>
      <form onSubmit={onSubmit}>
        <div className="auth-card-form-group">
          <span className="material-icons">mail</span>
          <input type="email" name="email" value={email} onChange={onChange} placeholder="Email Address" required />
        </div>
        <div className="auth-card-form-group">
          <span className="material-icons">lock</span>
          <input type="password" name="password" value={password} onChange={onChange} placeholder="Password" required />
        </div>
        <div className="form-options">
          <label className="remember-me">
            <input type="checkbox" /> Remember Me
          </label>
          <Link to="/forgot-password" className="forgot-password">Lost your password?</Link>
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="btn-auth" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in now'}
        </button>
      </form>

      {/* --- THIS IS THE NEW ADDITION --- */}
      <p className="form-switch-text">
        Don't have an account yet? <Link to="/register">Sign Up</Link>
      </p>
      {/* ---------------------------------- */}
    </>
  );
};

export default LoginPage;