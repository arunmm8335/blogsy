import React from 'react';
import './ProfilePostItemSkeleton.css';

const ProfilePostItemSkeleton = () => {
    return (
        <div className="post-item-card skeleton" aria-hidden="true">
            <div className="post-item-image-wrapper skeleton-box" />
            <div className="post-item-content">
                <div className="post-tags">
                    <span className="skeleton-pill skeleton-box" />
                    <span className="skeleton-pill skeleton-box" />
                </div>
                <div className="post-item-body">
                    <div className="skeleton-line title skeleton-box" />
                    <div className="skeleton-line subtitle skeleton-box" />
                </div>
                <div className="post-stats">
                    <div className="skeleton-dot skeleton-box" />
                    <div className="skeleton-count skeleton-box" />
                    <div className="skeleton-dot skeleton-box" />
                    <div className="skeleton-count skeleton-box" />
                </div>
            </div>
        </div>
    );
};

export default ProfilePostItemSkeleton; 