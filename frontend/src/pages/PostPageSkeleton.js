import React from 'react';
import './PostPage.css';
import './PostPageSkeleton.css';

const PostPageSkeleton = () => {
  return (
    <div className="post-reader-shell post-page-skeleton" aria-hidden="true">
      <article className="post-reader-card">
        <header className="post-header">
          <div className="post-page-skeleton-line title" />
          <div className="post-page-details">
            <div className="post-page-skeleton-line meta" />
            <div className="post-page-skeleton-line meta short" />
          </div>
        </header>

        <div className="post-media-grid">
          <div className="post-media-cell hero post-page-skeleton-block" />
          <div className="post-media-cell post-page-skeleton-block" />
          <div className="post-media-cell post-page-skeleton-block" />
        </div>

        <div className="post-page-content">
          <div className="post-page-skeleton-line content" />
          <div className="post-page-skeleton-line content" />
          <div className="post-page-skeleton-line content short" />
          <div className="post-page-skeleton-line content" />
          <div className="post-page-skeleton-line content medium" />
        </div>

        <div className="post-tags-section">
          <span className="post-page-skeleton-pill" />
          <span className="post-page-skeleton-pill" />
          <span className="post-page-skeleton-pill" />
        </div>
      </article>

      <section className="comments-section">
        <div className="comments-header-row">
          <div className="post-page-skeleton-line comments-title" />
          <div className="post-page-skeleton-line comments-sort" />
        </div>
        <div className="post-page-skeleton-comment" />
        <div className="post-page-skeleton-comment" />
      </section>
    </div>
  );
};

export default PostPageSkeleton;