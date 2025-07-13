import React from 'react';

const MediaPreview = ({ post, className }) => {
  // Determine the file type and URL from the post's media array
  const mediaItem = post.media && post.media.length > 0 ? post.media[0] : null;
  const url = mediaItem ? mediaItem.url : post.coverImage;
  const fileType = mediaItem ? mediaItem.fileType : 'image'; // Assume image if no media

  if (!url) {
    // Return a placeholder if no media is available
    return <div className={`${className} media-placeholder`} />;
  }

  // If the first media item is a video, render a <video> tag
  if (fileType === 'video') {
    return (
      <video 
        src={url} 
        className={className}
        muted         // Mute by default for a good UX
        autoPlay      // Autoplay can be nice for previews, but consider performance
        loop          // Loop the video
        playsInline   // Important for mobile browsers
        aria-label={`${post.title} preview`}
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  // Otherwise, default to rendering an <img> tag
  return <img src={url} alt={post.title} className={className} />;
};

export default MediaPreview;