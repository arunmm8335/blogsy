import React from 'react';
import './PostItem.css';
import './PostItemSkeleton.css';

const PostItemSkeleton = () => {
  return (
    <div className="post-item-card post-item-skeleton" aria-hidden="true">
      <div className="post-item-image-wrapper post-item-skeleton-box" />
      <div className="post-item-content">
        <div className="post-tags">
          <span className="post-item-skeleton-pill" />
          <span className="post-item-skeleton-pill" />
        </div>

        <div className="post-item-body">
          <div className="post-item-skeleton-line title" />
          <div className="post-item-skeleton-line subtitle" />
        </div>

        <div className="post-stats">
          <div className="post-item-skeleton-dot" />
          <div className="post-item-skeleton-count" />
          <div className="post-item-skeleton-dot" />
          <div className="post-item-skeleton-count" />
        </div>
      </div>
    </div>
  );
};

export default PostItemSkeleton;