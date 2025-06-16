import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/api';
import './EditProfilePage.css';

const EditProfilePage = () => {
    const { user, token, updateUserInContext } = useAuth();
    const navigate = useNavigate();
    
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
                // Set dob and mobile from context as well
                dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
                mobile: user.mobile || ''
            });
            // --- FIX for image preview source ---
            // The user object from context now has the full Cloudinary URL
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
            
            // 1. Update the user in the global context (for the header)
            updateUserInContext(updatedUser);

            toast.success('Profile updated successfully!', { id: toastId });
            
            // --- THIS IS THE FINAL FIX ---
            // 2. Force a full reload of the profile page to get the fresh data from the server.
            window.location.href = `/profile/${updatedUser.username}`;
            // ---------------------------

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

    return (
        <div className="edit-profile-container">
            <form className="edit-profile-form" onSubmit={handleSubmit}>
                <h1>Edit Your Profile</h1>
                
                <div className="form-group">
                    <label>Profile Picture</label>
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
                </div>

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
                    <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell us about yourself..." />
                </div>
                <div className="form-group">
                    <label htmlFor="dob">Date of Birth</label>
                    <input type="date" id="dob" name="dob" value={formData.dob} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="mobile">Mobile Number</label>
                    <input type="tel" id="mobile" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="+1 (555) 555-5555" />
                </div>

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

                <div className="form-actions">
                    <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfilePage;