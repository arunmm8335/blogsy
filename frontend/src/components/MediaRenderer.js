import React from 'react';

const MediaRenderer = ({ item, postTitle, index, className }) => {
    // Check if the fileType is 'video'.
    // Your post object should have a 'fileType' property on each media item.
    if (item.fileType === 'video') {
        return (
            <video
                src={item.url}
                controls // Show video controls (play, pause, volume)
                className={className || "media-item"} // Use passed className or a default
                aria-label={`${postTitle || 'Post'} video ${index + 1}`}
            >
                Your browser does not support the video tag.
            </video>
        );
    }

    // Default to rendering an image if it's not a video.
    return (
        <img
            src={item.url}
            alt={`${postTitle || 'Post'} media ${index + 1}`}
            className={className || "media-item"} // Use passed className or a default
        />
    );
};

export default MediaRenderer;