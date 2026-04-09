import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchUserDrafts, publishDraft, deletePost } from '../services/api';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiEye, FiClock } from 'react-icons/fi';
import './DraftsPage.css';

const DraftsPage = () => {
    const [drafts, setDrafts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const { user } = useAuth();

    const fetchDrafts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetchUserDrafts(user.token, currentPage, 10);
            setDrafts(response.posts);
            setTotalPages(response.pagination.totalPages);
        } catch (error) {
            toast.error('Failed to fetch drafts');
            console.error('Error fetching drafts:', error);
        } finally {
            setLoading(false);
        }
    }, [user.token, currentPage]);

    useEffect(() => {
        fetchDrafts();
    }, [fetchDrafts]);

    const handlePublish = async (postId) => {
        try {
            await publishDraft(postId, user.token);
            toast.success('Draft published successfully!');
            fetchDrafts(); // Refresh the list
        } catch (error) {
            toast.error('Failed to publish draft');
            console.error('Error publishing draft:', error);
        }
    };

    const handleDelete = async (postId) => {
        if (window.confirm('Are you sure you want to delete this draft?')) {
            try {
                await deletePost(postId, user.token);
                toast.success('Draft deleted successfully!');
                setDrafts(prev => prev.filter(d => d._id !== postId)); // Remove from UI
            } catch (error) {
                // If 404, remove from UI anyway
                if (error.response && error.response.status === 404) {
                    setDrafts(prev => prev.filter(d => d._id !== postId));
                    toast('Draft already deleted.', { icon: '⚠️' });
                } else {
                    toast.error('Failed to delete draft');
                }
                if (error.response) {
                    console.error('Error deleting draft:', error.response.data);
                } else {
                    console.error('Error deleting draft:', error.message || error);
                }
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const truncateText = (text, maxLength = 150) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    if (loading) {
        return <div className="drafts-loading">Loading drafts...</div>;
    }

    return (
        <div className="drafts-page">
            <div className="drafts-shell">
                <h1 className="drafts-title">
                    <FiClock size={24} />
                    My Drafts
                </h1>
                <p className="drafts-subtitle">
                    Manage your unpublished posts and drafts
                </p>

                {drafts.length === 0 ? (
                    <div className="drafts-empty">
                        <FiClock size={48} className="drafts-empty-icon" />
                        <h3>No drafts yet</h3>
                        <p>Start writing to create your first draft!</p>
                        <Link to="/posts/create" className="drafts-create-btn">
                            Create New Post
                        </Link>
                    </div>
                ) : (
                    <div className="drafts-grid">
                        {drafts.map((draft) => (
                            <article key={draft._id} className="draft-card">
                                <div className="draft-card-main">
                                    <div>
                                        <h3 className="draft-card-title">
                                            {draft.title}
                                        </h3>
                                        <p className="draft-card-excerpt">
                                            {truncateText(draft.content.replace(/<[^>]*>/g, ''))}
                                        </p>

                                        <div className="draft-card-meta">
                                            <span className="draft-updated">
                                                <FiClock size={14} />
                                                Last updated: {formatDate(draft.updatedAt)}
                                            </span>

                                            {draft.tags && draft.tags.length > 0 && (
                                                <div className="draft-tags">
                                                    {draft.tags.slice(0, 3).map((tag, index) => (
                                                        <span key={index}>
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                    {draft.tags.length > 3 && (
                                                        <span className="draft-tags-more">
                                                            +{draft.tags.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="draft-card-actions">
                                        <Link
                                            to={`/posts/${draft._id}/edit`}
                                            className="draft-action-btn"
                                        >
                                            <FiEdit size={14} />
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handlePublish(draft._id)}
                                            className="draft-action-btn publish"
                                        >
                                            <FiEye size={14} />
                                            Publish
                                        </button>
                                        <button
                                            onClick={() => handleDelete(draft._id)}
                                            className="draft-action-btn danger"
                                        >
                                            <FiTrash2 size={14} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="drafts-pagination">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="drafts-pagination-btn"
                        >
                            Previous
                        </button>
                        <span className="drafts-pagination-info">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="drafts-pagination-btn"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DraftsPage; 
