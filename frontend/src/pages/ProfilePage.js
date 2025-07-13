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

    if (loading) return (
        <div className="profile-page-container">
            <div className="profile-container">
                <aside className="profile-card" style={{ opacity: 0.5 }} />
                <main className="profile-posts">
                    <h2>Posts by ...</h2>
                    <div className="profile-posts-list">
                        {[1, 2, 3].map(i => <ProfilePostItemSkeleton key={i} />)}
                    </div>
                </main>
            </div>
        </div>
    );
    if (error) return <p style={{ textAlign: 'center', padding: '4rem', color: 'red' }}>{error}</p>;
    if (!profileData || !profileData.user) return <p style={{ textAlign: 'center', padding: '4rem' }}>User not found.</p>;

    const { user, posts } = profileData;
    const isOwnProfile = loggedInUser?._id === user._id;

    // Split posts for carousel and grid
    const carouselPosts = posts.slice(0, 3);
    const gridPosts = posts.slice(3);

    return (
        <div className="profile-page-container">
            <div className="profile-container">
                <aside className="profile-card">
                    <img
                        className="profile-avatar"
                        src={user.profilePicture || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                        alt={`${user.username}'s profile`}
                    />
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
                    <div className="profile-posts-carousel-card wide" style={{ background: 'none', boxShadow: 'none', padding: 0, minWidth: 0, maxWidth: '100%' }}>
                        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Posts by {user.username}</h2>
                        {carouselPosts.length > 0 ? (
                            <div className="featured-carousel-container">
                                <Swiper
                                    modules={[Navigation, Pagination, Autoplay, EffectFade]}
                                    spaceBetween={30}
                                    slidesPerView={1}
                                    loop={true}
                                    effect="fade"
                                    autoplay={{ delay: 7000, disableOnInteraction: false }}
                                    pagination={{ clickable: true }}
                                    navigation={true}
                                    className="featured-carousel"
                                >
                                    {carouselPosts.map(post => (
                                        <SwiperSlide key={post._id}>
                                            <Link to={`/posts/${post._id}`} className="featured-slide-link">
                                                <div className="featured-slide-content">
                                                    <div className="featured-slide-media-background">
                                                        <MediaPreview post={post} className="featured-slide-media" />
                                                    </div>
                                                    <div className="featured-slide-overlay">
                                                        <h1 className="featured-slide-title">{post.title}</h1>
                                                    </div>
                                                </div>
                                            </Link>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', margin: '2rem 0' }}>This user has not posted anything yet.</p>
                        )}
                    </div>
                    {/* Grid for posts 4+ */}
                    {gridPosts.length > 0 && (
                        <div style={{ width: '100%', marginTop: '2.5rem' }}>
                            <h3 className="profile-posts-grid-heading" style={{ textAlign: 'left', marginBottom: '1.2rem', fontWeight: 600 }}>
                                More Posts
                            </h3>
                            <div className="profile-posts-list">
                                {gridPosts.map(post => (
                                    <ProfilePostItem key={post._id} post={post} />
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
            <style>{`
                .profile-posts-carousel-card.wide {
                    background: var(--card-background);
                    border-radius: 16px;
                    padding: 2rem;
                    box-shadow: 0 4px 32px 0 rgba(0,0,0,0.10);
                    min-width: 600px;
                    max-width: 1100px;
                    margin: 0 auto;
                }
                .profile-featured-carousel {
                    width: 100%;
                }
                .profile-featured-slide-content {
                    position: relative;
                    min-height: 350px;
                    border-radius: 12px;
                    overflow: hidden;
                }
                .profile-featured-slide-media-background {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    z-index: 1;
                    filter: brightness(0.5) blur(2px);
                }
                .profile-featured-slide-overlay {
                    position: relative;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    color: var(--text-color);
                    padding: 2rem 1rem;
                    text-align: center;
                }
                .profile-featured-slide-title {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                }
                .profile-featured-slide-meta {
                    color: var(--secondary-text-color);
                    font-size: 1.1rem;
                }
            `}</style>
        </div>
    );
};

export default ProfilePage;