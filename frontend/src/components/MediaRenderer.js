import React from 'react';

const MediaRenderer = ({ item, postTitle, index, className }) => {
    const type = String(item?.fileType || '').toLowerCase();
    const mediaUrl = item?.url || '';
    const looksLikeAudio = /\.(mp3|wav|aac|m4a|ogg)$/i.test(mediaUrl) || type === 'audio';
    const looksLikeVideo = /\.(mp4|webm|mov|mkv)$/i.test(mediaUrl) || type === 'video';

    if (looksLikeVideo) {
        return (
            <video
                src={mediaUrl}
                controls
                className={className || "media-item"}
                aria-label={`${postTitle || 'Post'} video ${index + 1}`}
            >
                Your browser does not support the video tag.
            </video>
        );
    }

    if (looksLikeAudio) {
        return (
            <div className={className || "media-item"}>
                <audio controls src={mediaUrl} aria-label={`${postTitle || 'Post'} audio ${index + 1}`}>
                    Your browser does not support the audio element.
                </audio>
            </div>
        );
    }

    if (mediaUrl) {
        return (
            <img
                src={mediaUrl}
                alt={`${postTitle || 'Post'} media ${index + 1}`}
                className={className || "media-item"}
            />
        );
    }

    return (
        <div className={className || "media-item"}>Media unavailable</div>
    );
};

export default MediaRenderer;