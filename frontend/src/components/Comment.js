import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FaRegThumbsUp, FaRegThumbsDown, FaRegCommentDots, FaRegTrashAlt, FaRegEdit } from 'react-icons/fa';
import CommentForm from './CommentForm';
import './Comment.css';

const Comment = ({
  comment,
  onReply,
  activeReplyId,
  setActiveReplyId,
  user,
  onEdit,
  onDelete,
  highlightNew,
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
    <div className={`comment-item${highlightNew ? ' highlight-new' : ''}${comment.parentId ? ' comment-reply' : ''}`}>
      <div className="comment-avatar-wrap">
        <img
          src={
            comment.authorId?.profilePicture ||
            `https://ui-avatars.com/api/?name=${comment.authorId?.username || 'U'}&background=random`
          }
          alt={comment.authorId?.username}
          className="comment-avatar"
        />
      </div>

      <div className="comment-body">
        <div className="comment-meta">
          <span className="comment-author">{comment.authorId?.username || 'Unknown User'}</span>
          <span className="comment-time">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>

        {isEditing ? (
          <div className="comment-edit-wrap">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              className="comment-edit-textarea"
            />
            <div className="comment-edit-actions">
              <button onClick={handleEditSubmit} className="comment-inline-btn">Save</button>
              <button onClick={() => setIsEditing(false)} className="comment-inline-btn subtle">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="comment-content">{comment.content}</p>
        )}

        <div className="comment-actions">
          <button
            className={`comment-action-btn ${hasLiked ? 'active' : ''}`}
            title="Like"
            onClick={handleLikeToggle}
          >
            <FaRegThumbsUp />
            <span>{comment.likes?.length || 0}</span>
          </button>
          <button
            className={`comment-action-btn ${hasDisliked ? 'active' : ''}`}
            title="Dislike"
            onClick={handleDislikeToggle}
          >
            <FaRegThumbsDown />
            <span>{comment.dislikes?.length || 0}</span>
          </button>
          <button
            className="comment-action-btn"
            title="Reply"
            onClick={() => setActiveReplyId(isReplying ? null : comment._id)}
          >
            <FaRegCommentDots />
            <span>Reply</span>
          </button>
          {isOwn && (
            <>
              <button className="comment-action-btn" title="Edit" onClick={() => setIsEditing(true)}>
                <FaRegEdit />
                <span>Edit</span>
              </button>
              <button className="comment-action-btn danger" title="Delete" onClick={handleDelete}>
                <FaRegTrashAlt />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>

        {isReplying && (
          <div className="reply-form-wrap">
            <CommentForm
              onSubmit={handleReplySubmit}
              placeholder={`Replying to ${comment.authorId?.username}...`}
              buttonText="Reply"
            />
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="comment-replies-wrap">
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

export default Comment;
