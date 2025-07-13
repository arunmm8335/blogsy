import React from 'react';
import './ProfilePostItemSkeleton.css';

const ProfilePostItemSkeleton = () => {
    return (
        <div className="post-item-card skeleton">
            <div className="post-item-image-wrapper skeleton-box" style={{ height: 220 }} />
            <div className="post-item-content">
                <h2><div className="skeleton-box" style={{ width: '80%', height: '22px', margin: '0.3rem 0' }} /></h2>
                <p><div className="skeleton-box" style={{ width: '40%', height: '14px', margin: '0.2rem 0' }} /></p>
                <div>
                    <div className="skeleton-box" style={{ width: 70, height: 18, marginRight: 10, display: 'inline-block' }} />
                    <div className="skeleton-box" style={{ width: 70, height: 18, display: 'inline-block' }} />
                </div>
            </div>
        </div>
    );
};

export default ProfilePostItemSkeleton; 