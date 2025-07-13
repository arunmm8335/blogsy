import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { searchForPosts } from '../services/api';
import PostItem from '../components/PostItem';
import PostItemSkeleton from '../components/PostItemSkeleton';
import { FiSearch } from 'react-icons/fi';
import './SearchPage.css'; // Your existing CSS file for this page

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Read 'q' and 'sort' from the URL query string
  const queryParams = new URLSearchParams(location.search);
  const urlQuery = queryParams.get('q') || '';
  const initialSort = queryParams.get('sort') || 'relevance';

  // State for the input field controlled by the user on THIS page
  const [searchTerm, setSearchTerm] = useState(urlQuery);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState(initialSort);

  const fetchResults = useCallback(async () => {
    // Only fetch if there's a keyword in the URL
    if (!urlQuery) {
        setPosts([]);
        setLoading(false); // Make sure loading is off if there's no query
        return;
    };
    setLoading(true);
    try {
        const results = await searchForPosts(urlQuery, sortBy);
        setPosts(results);
    } catch (error) {
        console.error("Search failed:", error);
    } finally {
        setLoading(false);
    }
  }, [urlQuery, sortBy]);

  useEffect(() => {
    // setSearchTerm(urlQuery); // Sync input with URL on navigation
    fetchResults();
  }, [urlQuery, sortBy, fetchResults]);

  // This handles submitting a new search from the input bar on this page
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${searchTerm.trim()}&sort=${sortBy}`);
    }
  };

  // This handles changing the sort order
  const handleSortChange = (e) => {
    const newSortBy = e.target.value;
    setSortBy(newSortBy);
    if (urlQuery) {
        navigate(`/search?q=${urlQuery}&sort=${newSortBy}`);
    }
  };

  return (
        <div className="search-page-container">
            <div className="search-header">
                <h1>Search Articles</h1>
                <p className="search-subtitle">Find posts by title, content, tags, or author.</p>
                <form onSubmit={handleSearchSubmit} className="search-page-form">
                    <FiSearch className="search-page-icon" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        // --- UPDATE THE PLACEHOLDER TEXT ---
                        placeholder="Search for 'React', #travel, or an author like 'Arun'..."
                        className="search-page-input"
                        autoFocus
                    />
        </form>
        {/* Only show filters if a search has been performed */}
        {urlQuery && (
            <div className="search-filters">
                <label htmlFor="sort-select">Sort by:</label>
                <select id="sort-select" value={sortBy} onChange={handleSortChange}>
                    <option value="relevance">Relevance</option>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="likes">Most Liked</option>
                </select>
            </div>
        )}
      </div>
      
      {/* Conditional rendering for different states */}
      <div className="search-results-body">
        {loading ? (
            <div className="search-results-grid">
                {Array(6).fill(0).map((_, index) => <PostItemSkeleton key={index} />)}
            </div>
        ) : urlQuery ? (
            // State when a search has been performed
            <>
                <div className="search-results-info">
                    <p>Showing {posts.length} results for: <strong>"{urlQuery}"</strong></p>
                </div>
                {posts.length > 0 ? (
                    <div className="search-results-grid">
                        {posts.map(post => <PostItem key={post._id} post={post} />)}
                    </div>
                ) : (
                    <p className="no-results-message">No posts found. Please try a different keyword.</p>
                )}
            </>
        ) : (
            // Initial empty state before any search
            <p className="no-results-message">Enter a term above to start your search.</p>
        )}
      </div>
    </div>
  );
};

export default SearchPage;