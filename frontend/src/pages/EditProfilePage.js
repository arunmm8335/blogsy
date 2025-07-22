import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/api';
import './EditProfilePage.css';

const steps = [
    'Profile Picture',
    'Basic Info',
    'Contact',
    'Social Links',
    'Review & Save',
];

const EditProfilePage = () => {
    const { user, token, updateUserInContext } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        username: '', bio: '', twitter: '', github: '', linkedin: '', dob: '', mobile: ''
    });
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username || '',
                bio: user.bio || '',
                twitter: user.socialLinks?.twitter || '',
                github: user.socialLinks?.github || '',
                linkedin: user.socialLinks?.linkedin || '',
                dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
                mobile: user.mobile || ''
            });
            setPreview(user.profilePicture || '');
            setPageLoading(false);
        } else if (token === null && !user) {
            navigate('/login');
        }
    }, [user, token, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePictureFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    // --- Step Navigation ---
    const nextStep = () => {
        if (validateStep(step)) setStep((s) => Math.min(s + 1, steps.length - 1));
    };
    const prevStep = () => setStep((s) => Math.max(s - 1, 0));

    // --- Per-step validation ---
    const validateStep = (currentStep) => {
        if (currentStep === 1) {
            if (!formData.username.trim()) {
                toast.error('Username is required');
                return false;
            }
        }
        // Add more validation as needed
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading('Updating profile...');
        const updateData = new FormData();
        updateData.append('username', formData.username);
        updateData.append('bio', formData.bio);
        updateData.append('dob', formData.dob);
        updateData.append('mobile', formData.mobile);
        const socialLinks = {
            twitter: formData.twitter,
            github: formData.github,
            linkedin: formData.linkedin,
        };
        updateData.append('socialLinks', JSON.stringify(socialLinks));
        if (profilePictureFile) {
            updateData.append('profilePicture', profilePictureFile);
        }
        try {
            const updatedUser = await updateUserProfile(updateData, token);
            updateUserInContext(updatedUser);
            toast.success('Profile updated successfully!', { id: toastId });
            window.location.href = `/profile/${updatedUser.username}`;
        } catch (error) {
            const message = error.message || 'Update failed.';
            toast.error(message, { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return <p style={{ textAlign: 'center', padding: '4rem' }}>Loading...</p>;
    }

    // --- Step Content ---
    const renderStep = () => {
        switch (step) {
            case 0:
    return (
                    <section style={{ marginBottom: '2rem' }}>
                        <h2>Profile Picture</h2>
                <div className="form-group">
                    <div className="profile-picture-section">
                        <img 
                            src={preview || 'https://via.placeholder.com/150'} 
                            alt="Profile preview" 
                            className="profile-picture-preview"
                        />
                        <button type="button" className="btn" onClick={() => fileInputRef.current.click()}>
                            Change Picture
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            style={{ display: 'none' }} 
                            accept="image/*" 
                        />
                    </div>
                            <small style={{ color: 'var(--secondary-text-color)' }}>Recommended: Square image, at least 200x200px.</small>
                </div>
                    </section>
                );
            case 1:
                return (
                    <section style={{ marginBottom: '2rem' }}>
                        <h2>Basic Info</h2>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
                </div>
                 <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" value={user.email || ''} readOnly />
                </div>
                <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                            <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself..." maxLength={200} />
                            <small style={{ color: 'var(--secondary-text-color)' }}>Max 200 characters.</small>
                </div>
                    </section>
                );
            case 2:
                return (
                    <section style={{ marginBottom: '2rem' }}>
                        <h2>Contact</h2>
                <div className="form-group">
                    <label htmlFor="dob">Date of Birth</label>
                    <input type="date" id="dob" name="dob" value={formData.dob} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="mobile">Mobile Number</label>
                    <input type="tel" id="mobile" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="+1 (555) 555-5555" />
                </div>
                    </section>
                );
            case 3:
                return (
                    <section style={{ marginBottom: '2rem' }}>
                <h2>Social Links</h2>
                <div className="form-group">
                    <label htmlFor="twitter">Twitter URL</label>
                    <input type="url" id="twitter" name="twitter" value={formData.twitter} onChange={handleChange} placeholder="https://twitter.com/..." />
                </div>
                <div className="form-group">
                    <label htmlFor="github">GitHub URL</label>
                    <input type="url" id="github" name="github" value={formData.github} onChange={handleChange} placeholder="https://github.com/..." />
                </div>
                <div className="form-group">
                    <label htmlFor="linkedin">LinkedIn URL</label>
                    <input type="url" id="linkedin" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
                </div>
                    </section>
                );
            case 4:
                return (
                    <section style={{ marginBottom: '2rem' }}>
                        <h2>Review & Save</h2>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <strong>Profile Picture:</strong><br />
                            <img src={preview || 'https://via.placeholder.com/100'} alt="Preview" style={{ width: 100, height: 100, borderRadius: '50%', margin: '0.5rem 0' }} />
                        </div>
                        <div><strong>Username:</strong> {formData.username}</div>
                        <div><strong>Email:</strong> {user.email}</div>
                        <div><strong>Bio:</strong> {formData.bio}</div>
                        <div><strong>Date of Birth:</strong> {formData.dob}</div>
                        <div><strong>Mobile:</strong> {formData.mobile}</div>
                        <div><strong>Twitter:</strong> {formData.twitter}</div>
                        <div><strong>GitHub:</strong> {formData.github}</div>
                        <div><strong>LinkedIn:</strong> {formData.linkedin}</div>
                    </section>
                );
            default:
                return null;
        }
    };

    return (
        <div className="edit-profile-container">
            <form className="edit-profile-form" onSubmit={handleSubmit}>
                <h1>Edit Your Profile</h1>
                {/* Progress Indicator */}
                <div style={{ margin: '1rem 0 2rem', textAlign: 'center' }}>
                    <div style={{
                        background: 'var(--card-border)',
                        borderRadius: '8px',
                        height: '10px',
                        width: '100%',
                        marginBottom: '0.5rem',
                        overflow: 'hidden',
                        position: 'relative',
                        maxWidth: 400,
                        marginLeft: 'auto',
                        marginRight: 'auto',
                    }}>
                        <div style={{
                            background: 'var(--primary-color)',
                            height: '100%',
                            width: `${((step + 1) / steps.length) * 100}%`,
                            transition: 'width 0.3s',
                        }} />
                    </div>
                    <span style={{ fontWeight: 600 }}>Step {step + 1} of {steps.length}:</span> {steps[step]}
                </div>
                {renderStep()}
                {/* Navigation Buttons */}
                <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '2rem' }}>
                    <button type="button" className="btn btn-ghost" onClick={prevStep} disabled={step === 0}>Back</button>
                    {step < steps.length - 1 ? (
                        <button type="button" className="btn" onClick={nextStep}>
                            Next
                        </button>
                    ) : (
                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default EditProfilePage;
