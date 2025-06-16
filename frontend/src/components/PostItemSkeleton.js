// In /src/components/PostItemSkeleton.js
import React from 'react';
import Skeleton from 'react-loading-skeleton';
import './PostItem.css'; // Reuse styles for consistent layout

const PostItemSkeleton = () => {
  return (
    <div className="post-item">
      <Skeleton height={220} />
      <div className="post-item-content">
        <h2><Skeleton width={`80%`} /></h2>
        <p><Skeleton width={`40%`} /></p>
        <div>
            <Skeleton width={70} inline style={{ marginRight: '10px' }} />
            <Skeleton width={70} inline />
        </div>
      </div>
    </div>
  );
};

export default PostItemSkeleton;