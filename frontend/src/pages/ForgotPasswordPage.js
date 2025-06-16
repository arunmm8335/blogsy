// src/pages/ForgotPasswordPage.js
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            const { data } = await axios.post('/api/auth/forgot-password', { email });
            setMessage(data.message);
            toast.success("Request sent!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        // This can be wrapped in your AuthLayout
        <>
            <h2 className="form-title">Forgot Password</h2>
            <p className="form-subtitle">Enter your email address and we will send you a link to reset your password.</p>
            <form onSubmit={onSubmit}>
                <div className="form-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn-auth" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
            </form>
            {message && <p className="success-message" style={{marginTop: '1rem', textAlign: 'center'}}>{message}</p>}
        </>
    );
};

export default ForgotPasswordPage;