import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { fetchUserProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProfilePostItem from '../components/ProfilePostItem';
import ProfilePostItemSkeleton from '../components/ProfilePostItemSkeleton';
import MediaPreview from '../components/MediaPreview';
import './ProfilePage.css';
import { FaTwitter, FaGithub, FaLinkedin } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { Link } from 'react-router-dom';

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

    if (loading) {
        return (
            <div className="profile-page-container">
                <div className="profile-container">
                    <aside className="profile-card profile-card-loading" />
                    <main className="profile-posts-shell">
                        <section className="profile-featured-card">
                            <h2>Loading posts...</h2>
                        </section>
                        <div className="profile-posts-list">
                            {[1, 2, 3].map((i) => <ProfilePostItemSkeleton key={i} />)}
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (error) {
        return <p className="profile-page-feedback error">{error}</p>;
    }

    if (!profileData || !profileData.user) {
        return <p className="profile-page-feedback">User not found.</p>;
    }

    const { user, posts } = profileData;
    const isOwnProfile = loggedInUser?._id === user._id;

    // Split posts for carousel and grid
    const carouselPosts = posts.slice(0, 3);
    const gridPosts = posts.slice(3);
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);

    const formatSocialHandle = (url = '', fallback) => {
        try {
            const parsed = new URL(url);
            return parsed.pathname.replace(/^\//, '') || fallback;
        } catch (e) {
            return fallback;
        }
    };

    return (
        <div className="profile-page-container">
            <div className="profile-container">
                <aside className="profile-card">
                    <img
                        className="profile-avatar"
                        src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                        alt={`${user.username}'s profile`}
                    />
                    <span className="profile-kicker">Profile</span>
                    <h1>{user.username}</h1>
                    <p className="profile-bio">{user.bio || 'No bio available.'}</p>

                    <div className="profile-metrics">
                        <div>
                            <strong>{posts.length}</strong>
                            <span>Posts</span>
                        </div>
                        <div>
                            <strong>{totalLikes}</strong>
                            <span>Likes</span>
                        </div>
                    </div>

                    <div className="profile-socials">
                        {user.socialLinks?.twitter && (
                            <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter profile">
                                <FaTwitter size="20" />
                                <span>{formatSocialHandle(user.socialLinks.twitter, 'Twitter')}</span>
                            </a>
                        )}
                        {user.socialLinks?.github && (
                            <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile">
                                <FaGithub size="20" />
                                <span>{formatSocialHandle(user.socialLinks.github, 'GitHub')}</span>
                            </a>
                        )}
                        {user.socialLinks?.linkedin && (
                            <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile">
                                <FaLinkedin size="20" />
                                <span>{formatSocialHandle(user.socialLinks.linkedin, 'LinkedIn')}</span>
                            </a>
                        )}
                    </div>

                    {isOwnProfile && (
                        <RouterLink to="/profile/edit" className="btn edit-profile-btn">
                            Edit Profile
                        </RouterLink>
                    )}
                </aside>

                <main className="profile-posts-shell">
                    <section className="profile-featured-card">
                        <div className="profile-section-heading">
                            <h2>Featured Stories</h2>
                            <p>Latest highlights from {user.username}</p>
                        </div>

                        {carouselPosts.length > 0 ? (
                            <div className="featured-carousel-container">
                                <Swiper
                                    modules={[Navigation, Pagination, Autoplay, EffectFade]}
                                    spaceBetween={24}
                                    slidesPerView={1}
                                    loop={true}
                                    effect="fade"
                                    autoplay={{ delay: 7000, disableOnInteraction: false }}
                                    pagination={{ clickable: true }}
                                    navigation={true}
                                    className="profile-featured-carousel"
                                >
                                    {carouselPosts.map(post => (
                                        <SwiperSlide key={post._id}>
                                            <Link to={`/posts/${post._id}`} className="profile-featured-slide-link">
                                                <div className="profile-featured-slide-content">
                                                    <div className="profile-featured-slide-media-background">
                                                        <MediaPreview post={post} className="profile-featured-slide-media" />
                                                    </div>
                                                    <div className="profile-featured-slide-overlay">
                                                        <h3 className="profile-featured-slide-title">{post.title}</h3>
                                                        <p>{post.content?.replace(/<[^>]+>/g, '').slice(0, 120) || 'Open story'}</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        ) : (
                            <p className="profile-empty-state">This user has not posted anything yet.</p>
                        )}
                    </section>

                    {gridPosts.length > 0 && (
                        <section className="profile-grid-section">
                            <div className="profile-section-heading">
                                <h3 className="profile-posts-grid-heading">More Posts</h3>
                                <p>Browse the full archive from this author.</p>
                            </div>
                            <div className="profile-posts-list">
                                {gridPosts.map(post => (
                                    <ProfilePostItem key={post._id} post={post} />
                                ))}
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ProfilePage;