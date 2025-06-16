// In /src/pages/PostPageSkeleton.js
import React from 'react';
import Skeleton from 'react-loading-skeleton';
import './PostPage.css'; // Reuse styles

const PostPageSkeleton = () => {
  return (
    <div className="post-page-container">
        <Skeleton height={400} className="post-page-image" />
        <h1><Skeleton width={`70%`} /></h1>
        <div className="post-page-details">
            <p><Skeleton width={200} /></p>
        </div>
        <div className="post-page-content">
            <Skeleton count={3} />
            <br />
            <Skeleton count={4} />
        </div>
    </div>
  );
};

export default PostPageSkeleton;