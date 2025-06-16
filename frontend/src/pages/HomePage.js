import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchPosts } from '../services/api';
import PostItem from '../components/PostItem';
import FeaturedPostsCarousel from '../components/FeaturedPostsCarousel';
import PostItemSkeleton from '../components/PostItemSkeleton';
import Pagination from '../components/Pagination';
import './HomePage.css';
import { Helmet } from 'react-helmet-async';

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const getPostsData = async () => {
      try {
        setLoading(true);
        const currentPage = Number(new URLSearchParams(location.search).get('page')) || 1;
        setPage(currentPage);

        const [paginated, featured] = await Promise.all([
          fetchPosts(currentPage, 9),
          fetchPosts(1, 3),
        ]);

        setPosts(paginated.posts);
        setTotalPages(paginated.pages);
        setFeaturedPosts(featured.posts);
      } catch (err) {
        setError('Failed to load posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    getPostsData();
  }, [location.search]);

  const handlePageChange = (newPage) => {
    navigate(`/?page=${newPage}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const featuredPostIds = new Set(featuredPosts.map(p => p._id));
  const gridPosts = page === 1
    ? posts.filter(p => !featuredPostIds.has(p._id))
    : posts;

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
        ) : gridPosts.length > 0 ? (
          <div className="posts-grid">
            {gridPosts.map(post => <PostItem key={post._id} post={post} />)}
          </div>
        ) : (
          !loading && <p style={{ textAlign: 'center' }}>No more posts found.</p>
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
