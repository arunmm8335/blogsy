import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchUserDrafts, publishDraft, deletePost } from '../services/api';
import toast from 'react-hot-toast';
import { FiEdit, FiTrash2, FiEye, FiClock } from 'react-icons/fi';

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
                fetchDrafts(); // Refresh the list
            } catch (error) {
                toast.error('Failed to delete draft');
                console.error('Error deleting draft:', error);
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
        return (
            <div style={{
                maxWidth: '1200px',
                margin: '2rem auto',
                padding: '0 1rem',
                textAlign: 'center',
                color: 'var(--text-color)'
            }}>
                <div>Loading drafts...</div>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '2rem auto',
            padding: '0 1rem',
            color: 'var(--text-color)'
        }}>
            <div style={{
                background: 'var(--card-background)',
                borderRadius: '12px',
                padding: '2rem',
                border: '1px solid var(--card-border)',
                marginBottom: '2rem'
            }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <FiClock size={24} />
                    My Drafts
                </h1>
                <p style={{ color: 'var(--secondary-text-color)', marginBottom: '2rem' }}>
                    Manage your unpublished posts and drafts
                </p>

                {drafts.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: 'var(--secondary-text-color)'
                    }}>
                        <FiClock size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <h3>No drafts yet</h3>
                        <p>Start writing to create your first draft!</p>
                        <Link to="/posts/create" style={{
                            display: 'inline-block',
                            marginTop: '1rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'var(--primary-color)',
                            color: 'var(--button-text-color)',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            fontWeight: '600'
                        }}>
                            Create New Post
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {drafts.map((draft) => (
                            <div key={draft._id} style={{
                                border: '1px solid var(--card-border)',
                                borderRadius: '8px',
                                padding: '1.5rem',
                                background: 'var(--background-color)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{
                                            fontSize: '1.25rem',
                                            fontWeight: '600',
                                            marginBottom: '0.5rem',
                                            color: 'var(--text-color)'
                                        }}>
                                            {draft.title}
                                        </h3>
                                        <p style={{
                                            color: 'var(--secondary-text-color)',
                                            marginBottom: '1rem',
                                            lineHeight: '1.6'
                                        }}>
                                            {truncateText(draft.content.replace(/<[^>]*>/g, ''))}
                                        </p>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--secondary-text-color)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}>
                                                <FiClock size={14} />
                                                Last updated: {formatDate(draft.updatedAt)}
                                            </span>
                                            {draft.tags && draft.tags.length > 0 && (
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {draft.tags.slice(0, 3).map((tag, index) => (
                                                        <span key={index} style={{
                                                            background: 'var(--tag-background)',
                                                            color: 'var(--primary-color)',
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '12px',
                                                            fontSize: '0.75rem'
                                                        }}>
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                    {draft.tags.length > 3 && (
                                                        <span style={{ color: 'var(--secondary-text-color)', fontSize: '0.75rem' }}>
                                                            +{draft.tags.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                                        <Link
                                            to={`/posts/${draft._id}/edit`}
                                            style={{
                                                padding: '0.5rem',
                                                background: 'var(--primary-color)',
                                                color: 'var(--button-text-color)',
                                                borderRadius: '6px',
                                                textDecoration: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            <FiEdit size={14} />
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handlePublish(draft._id)}
                                            style={{
                                                padding: '0.5rem',
                                                background: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            <FiEye size={14} />
                                            Publish
                                        </button>
                                        <button
                                            onClick={() => handleDelete(draft._id)}
                                            style={{
                                                padding: '0.5rem',
                                                background: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                fontSize: '0.875rem'
                                            }}
                                        >
                                            <FiTrash2 size={14} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginTop: '2rem'
                    }}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            style={{
                                padding: '0.5rem 1rem',
                                background: currentPage === 1 ? 'var(--secondary-text-color)' : 'var(--primary-color)',
                                color: 'var(--button-text-color)',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Previous
                        </button>
                        <span style={{
                            padding: '0.5rem 1rem',
                            color: 'var(--text-color)',
                            display: 'flex',
                            alignItems: 'center'
                        }}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '0.5rem 1rem',
                                background: currentPage === totalPages ? 'var(--secondary-text-color)' : 'var(--primary-color)',
                                color: 'var(--button-text-color)',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                            }}
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