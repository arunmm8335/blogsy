// /src/components/Comment.js

import React from 'react';
import { Link } from 'react-router-dom';
import CommentForm from './CommentForm';

const Comment = ({ comment, onReply, activeReplyId, setActiveReplyId }) => {
  const isReplying = activeReplyId === comment._id;

  const handleReplySubmit = (content) => {
    onReply(content, comment._id);
  };

  return (
    <>
      <style>{`
        .comment-item {
            display: flex;
            gap: 1rem;
            padding: 1.25rem 0;
            border-top: 1px solid var(--card-border);
        }
        .comments-list > .comment-item:first-child {
            border-top: none;
            padding-top: 0;
        }
        .comment-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
            margin-top: 5px;
        }
        .comment-body {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .comment-meta {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
        }
        .comment-author-link {
            font-weight: 600;
            font-size: 1rem;
            color: var(--text-color);
            text-decoration: none;
        }
        .comment-author-link:hover { text-decoration: underline; }
        .comment-date {
            font-size: 0.85rem;
            color: var(--secondary-text-color);
        }
        .comment-content {
            font-size: 1rem;
            color: var(--text-color);
            line-height: 1.6;
            white-space: pre-wrap;
        }
        .comment-actions {
            margin-top: 0.75rem;
        }
        
        /* --- THIS IS THE NEW PROFESSIONAL REPLY BUTTON STYLE --- */
        .reply-btn {
            background-color: var(--tag-background, #2d3748); /* Use tag bg or a default */
            border: 1px solid var(--card-border);
            color: var(--secondary-text-color);
            cursor: pointer;
            font-size: 0.8rem; /* Smaller font for a compact look */
            font-weight: 600;
            padding: 0.25rem 0.75rem; /* Vertical and horizontal padding */
            border-radius: 6px; /* Slightly rounded corners */
            transition: all 0.2s ease-in-out;
        }
        .reply-btn:hover {
            background-color: var(--primary-color);
            color: var(--button-text-color);
            border-color: var(--primary-color);
        }
        /* -------------------------------------------------------- */

        .comment-replies {
            margin-top: 1.25rem;
            margin-left: 1.5rem;
            padding-left: 1.5rem;
            border-left: 2px solid var(--card-border);
        }
        .reply-form-container {
            margin-top: 1rem;
        }
      `}</style>
      
      <div className="comment-item">
        <img
          src={comment.authorId?.profilePicture || `https://ui-avatars.com/api/?name=${comment.authorId?.username || 'U'}&background=random`}
          alt={comment.authorId?.username}
          className="comment-avatar"
        />
        <div className="comment-body">
          <div className="comment-meta">
            <Link to={`/profile/${comment.authorId?.username}`} className="comment-author-link">
              {comment.authorId?.username || 'Unknown User'}
            </Link>
            <span className="comment-date">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="comment-content">{comment.content}</p>
          <div className="comment-actions">
            <button className="reply-btn" onClick={() => setActiveReplyId(isReplying ? null : comment._id)}>
              {isReplying ? 'Cancel' : 'Reply'}
            </button>
          </div>

          {isReplying && (
            <div className="reply-form-container">
              <CommentForm
                onSubmit={handleReplySubmit}
                placeholder={`Replying to ${comment.authorId?.username}...`}
                buttonText="Post Reply"
              />
            </div>
          )}
          
          {comment.replies && comment.replies.length > 0 && (
            <div className="comment-replies">
              {comment.replies.map(reply => (
                <Comment
                  key={reply._id}
                  comment={reply}
                  onReply={onReply}
                  activeReplyId={activeReplyId}
                  setActiveReplyId={setActiveReplyId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Comment;