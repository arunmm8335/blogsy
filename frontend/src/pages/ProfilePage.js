import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { fetchUserProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostItem from '../components/PostItem';
import './ProfilePage.css';
import { FaTwitter, FaGithub, FaLinkedin } from 'react-icons/fa';

const ProfilePage = () => {
    const { username } = useParams();
    const { user: loggedInUser } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getProfileData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchUserProfile(username);
            setProfileData(data);
        } catch (err) {
            setError("User not found or there was a server error.");
        } finally {
            setLoading(false);
        }
    }, [username]);

    useEffect(() => {
        getProfileData();
    }, [getProfileData]);

    if (loading) return <p style={{ textAlign: 'center', padding: '4rem' }}>Loading profile...</p>;
    if (error) return <p style={{ textAlign: 'center', padding: '4rem', color: 'red' }}>{error}</p>;
    if (!profileData || !profileData.user) return <p style={{ textAlign: 'center', padding: '4rem' }}>User not found.</p>;

    const { user, posts } = profileData;
    const isOwnProfile = loggedInUser?._id === user._id;

    return (
        <div className="profile-page-container">
            <div className="profile-container">
                <aside className="profile-card">
                    {/* --- THIS IS THE FINAL FIX --- */}
                    {/* The src is now simply user.profilePicture, which is the full Cloudinary URL. */}
                    <img
                        className="profile-avatar"
                        src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                        alt={`${user.username}'s profile`}
                    />
                    {/* --------------------------- */}

                    <h1>{user.username}</h1>
                    <p className="profile-bio">{user.bio || 'No bio available.'}</p>
                    
                    <div className="profile-socials">
                        {user.socialLinks?.twitter && <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer"><FaTwitter size="24" /></a>}
                        {user.socialLinks?.github && <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer"><FaGithub size="24" /></a>}
                        {user.socialLinks?.linkedin && <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"><FaLinkedin size="24" /></a>}
                    </div>

                    {isOwnProfile && (
                        <RouterLink to="/profile/edit" className="btn edit-profile-btn">
                            Edit Profile
                        </RouterLink>
                    )}
                </aside>

                <main className="profile-posts">
                    <h2>Posts by {user.username}</h2>
                    <div className="profile-posts-list"> 
                        {posts.length > 0 ? (
                            posts.map(post => <PostItem key={post._id} post={post} />)
                        ) : (
                            <p>This user has not posted anything yet.</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProfilePage;