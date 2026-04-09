import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchPosts } from '../services/api';
import PostItem from '../components/PostItem';
import FeaturedPostsCarousel from '../components/FeaturedPostsCarousel';
import PostItemSkeleton from '../components/PostItemSkeleton';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';
import { Helmet } from 'react-helmet-async'; // <-- Import Helmet

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const getPaginatedPosts = async (currentPage) => {
      try {
        setLoading(true);
        const data = await fetchPosts(currentPage, 9);
        setPosts(data.posts);
        setTotalPages(data.pages);

        // Always set featured posts from the first 3 posts of the current page
        setFeaturedPosts(data.posts.slice(0, 3));
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const pageFromUrl = new URLSearchParams(location.search).get('page') || 1;
    const currentPageNumber = Number(pageFromUrl);
    setPage(currentPageNumber);

    getPaginatedPosts(currentPageNumber);
  }, [location.search]);

  const handlePageChange = (newPage) => {
    navigate(`/?page=${newPage}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show first 3 posts in featured carousel, rest in grid for all pages
  const gridPosts = posts.slice(3);
  const hasAnyPosts = posts.length > 0;
  const hasGridPosts = gridPosts.length > 0;

  // -----------------------


  return (
    <>
      <Helmet>
        <title>Blogsy - Share Your Voice, Build Your Community</title>
        <meta name="description" content="Welcome to Blogsy, a modern platform for readers and writers. Explore a world of ideas, share your unique voice, and connect with a vibrant community." />
      </Helmet>

      <div className="homepage-container">
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        {featuredPosts.length > 0 && <FeaturedPostsCarousel posts={featuredPosts} />}
        <h2 className="posts-grid-title">Latest Articles</h2>

        {loading ? (
          <div className="posts-grid">
            {Array(6).fill(0).map((_, index) => <PostItemSkeleton key={index} />)}
          </div>
        ) : hasAnyPosts && hasGridPosts ? (
          <div className="posts-grid">
            {gridPosts.map(post => <PostItem key={post._id} post={post} />)}
          </div>
        ) : hasAnyPosts ? (
          <section className="homepage-caught-up" aria-live="polite">
            <h3>You are all caught up</h3>
            <p>There are no additional articles right now. Check back soon for fresh stories.</p>
          </section>
        ) : (
          <section className="homepage-empty-state" aria-live="polite">
            <div className="empty-state-badge">Welcome to Blogsy</div>
            <h3>The community feed is waiting for its first story</h3>
            <p>
              Start the conversation by publishing your first article, or return later to explore
              posts from writers around the world.
            </p>

            <div className="homepage-empty-actions">
              <button
                type="button"
                className="empty-action-primary"
                onClick={() => navigate(user ? '/posts/create' : '/register')}
              >
                {user ? 'Write First Article' : 'Create Account to Publish'}
              </button>
              <button
                type="button"
                className="empty-action-secondary"
                onClick={() => navigate('/about')}
              >
                Discover Blogsy
              </button>
            </div>

            <div className="empty-state-prompts">
              <span>Try writing about:</span>
              <div className="prompt-chips">
                <span>What I learned this week</span>
                <span>My best productivity stack</span>
                <span>A beginner-friendly tutorial</span>
              </div>
            </div>
          </section>
        )}

        {totalPages > 1 && (
          <Pagination
            pages={totalPages}
            currentPage={page}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </>
  );
};

export default HomePage;