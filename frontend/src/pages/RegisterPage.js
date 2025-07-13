import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // <-- Import Link
import toast from 'react-hot-toast'; // <-- Import toast
import { registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext'; // <-- Import useAuth for auto-login

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // <-- Get the login function from context

  const { username, email, password } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // The registerUser API now returns the user data and token
      const userData = await registerUser(formData);
      login(userData); // Automatically log the user in
      toast.success(`Welcome, ${userData.username}! Your account has been created.`);
      navigate('/'); // Redirect to home page
    } catch (err) {
      const errorMessage = err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // This JSX can be rendered inside your AuthLayout
  return (
    <>
      <h2 className="form-title">Create an Account</h2>
      <form onSubmit={onSubmit}>
        <div className="auth-card-form-group">
          <span className="material-icons">person</span>
          <input type="text" name="username" value={username} onChange={onChange} placeholder="Username" required />
        </div>
        <div className="auth-card-form-group">
          <span className="material-icons">mail</span>
          <input type="email" name="email" value={email} onChange={onChange} placeholder="Email Address" required />
        </div>
        <div className="auth-card-form-group">
          <span className="material-icons">lock</span>
          <input type="password" name="password" value={password} onChange={onChange} placeholder="Password" minLength="6" required />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="btn-auth" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {/* --- THIS IS THE NEW ADDITION --- */}
      <p className="form-switch-text">
        Already have an account? <Link to="/login">Sign In</Link>
      </p>
      {/* ---------------------------------- */}
    </>
  );
};

export default RegisterPage;