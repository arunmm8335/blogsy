import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FaRegThumbsUp, FaRegThumbsDown, FaRegCommentDots, FaEllipsisH, FaRegTrashAlt } from 'react-icons/fa';
import CommentForm from './CommentForm';

const Comment = ({
  comment,
  onReply,
  activeReplyId,
  setActiveReplyId,
  user,
  onEdit,
  onDelete,
  highlightNew,
  showAllReplies,
  setShowAllReplies,
  onLike = () => { },
  onDislike = () => { },
}) => {
  const isReplying = activeReplyId === comment._id;
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const isOwn = user && (user._id === (comment.authorId?._id || comment.authorId));
  const hasLiked = user && Array.isArray(comment.likes) && comment.likes.some(like => like === user._id || (typeof like === 'object' && like._id === user._id));
  const hasDisliked = user && Array.isArray(comment.dislikes) && comment.dislikes.some(dislike => dislike === user._id || (typeof dislike === 'object' && dislike._id === user._id));

  const handleReplySubmit = (content) => {
    onReply(content, comment._id);
  };

  const handleEditSubmit = () => {
    onEdit(comment._id, editContent);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this comment?')) onDelete(comment._id);
  };

  const handleLikeToggle = () => {
    if (!user) return;
    onLike(comment._id);
  };
  const handleDislikeToggle = () => {
    if (!user) return;
    onDislike(comment._id);
  };

  return (
    <div
      className={`comment-item${highlightNew ? ' highlight-new' : ''}${comment.parentId ? ' comment-reply' : ''}`}
      style={{
        width: comment.parentId ? 'calc(100% - 32px)' : '100%',
        marginLeft: comment.parentId ? 32 : 0,
        position: 'relative',
        padding: comment.parentId ? '0.7rem 0' : '1.1rem 0',
        marginBottom: '0.18rem',
        display: 'flex',
        gap: '0.7rem',
        alignItems: 'flex-start',
        minHeight: 44,
        overflow: 'visible'
      }}
    >
      {/* L-shaped connector from parent to reply */}
      {comment.parentId && (
        <svg
          width="32"
          height="48"
          style={{
            position: 'absolute',
            left: -32,
            top: 0,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          {/* Vertical line */}
          <line
            x1="16"
            y1="0"
            x2="16"
            y2="24"
            stroke="var(--card-border)"
            strokeWidth="2"
            strokeDasharray="2,4"
          />
          {/* Horizontal line */}
          <line
            x1="16"
            y1="24"
            x2="32"
            y2="24"
            stroke="var(--card-border)"
            strokeWidth="2"
            strokeDasharray="2,4"
          />
        </svg>
      )}

      {/* Avatar */}
      <div style={{ width: 32, height: 32 }}>
        <img
          src={
            comment.authorId?.profilePicture ||
            `https://ui-avatars.com/api/?name=${comment.authorId?.username || 'U'}&background=random`
          }
          alt={comment.authorId?.username}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            objectFit: 'cover',
            background: '#e0e0e0'
          }}
        />
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Meta */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.05rem', color: 'var(--text-color)' }}>
          <span style={{ fontWeight: 700 }}>{comment.authorId?.username || 'Unknown User'}</span>
          <span style={{ fontSize: '0.89rem', color: 'var(--secondary-text-color)' }}>
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Content or Edit */}
        {isEditing ? (
          <div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              style={{ width: '100%' }}
            />
            <button onClick={handleEditSubmit}>Save</button>
          </div>
        ) : (
          <p style={{ marginBottom: '0.18rem', color: 'var(--text-color)' }}>{comment.content}</p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.18rem', marginTop: '0.1rem' }}>
          <button
            style={{
              ...iconButtonStyle,
              color: hasLiked ? 'var(--primary-color)' : 'var(--text-color)',
            }}
            title="Like"
            onClick={handleLikeToggle}
          >
            <FaRegThumbsUp />
            <span style={{ marginLeft: 4 }}>{comment.likes?.length || 0}</span>
          </button>
          <button
            style={{
              ...iconButtonStyle,
              color: hasDisliked ? 'var(--primary-color)' : 'var(--text-color)',
            }}
            title="Dislike"
            onClick={handleDislikeToggle}
          >
            <FaRegThumbsDown />
            <span style={{ marginLeft: 4 }}>{comment.dislikes?.length || 0}</span>
          </button>
          <button
            style={{ ...iconButtonStyle, color: 'var(--text-color)' }}
            title="Reply"
            onClick={() => setActiveReplyId(isReplying ? null : comment._id)}
          >
            <FaRegCommentDots />
          </button>
          <button style={{ ...iconButtonStyle, color: 'var(--text-color)' }} title="More">
            <FaEllipsisH />
          </button>
          {isOwn && (
            <button
              style={{
                ...iconButtonStyle,
                color: 'var(--primary-color)',
                fontSize: '1.05rem',
                marginLeft: 4,
              }}
              title="Delete"
              onClick={handleDelete}
            >
              <FaRegTrashAlt />
            </button>
          )}
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div style={{ marginTop: 8 }}>
            <CommentForm
              onSubmit={handleReplySubmit}
              placeholder={`Replying to ${comment.authorId?.username}...`}
              buttonText="Post Reply"
            />
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div style={{ marginTop: '0.7rem' }}>
            {comment.replies.map((reply) => (
              <Comment
                key={reply._id}
                comment={reply}
                onReply={onReply}
                activeReplyId={activeReplyId}
                setActiveReplyId={setActiveReplyId}
                user={user}
                onEdit={onEdit}
                onDelete={onDelete}
                highlightNew={highlightNew}
                showAllReplies={showAllReplies}
                setShowAllReplies={setShowAllReplies}
                onLike={onLike}
                onDislike={onDislike}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Shared style for all action icons
const iconButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-color)',
  fontSize: '1.05rem',
  cursor: 'pointer',
  padding: '0.2rem 0.5rem',
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  gap: '0.2rem',
  transition: 'background 0.15s, color 0.15s',
};

export default Comment;
