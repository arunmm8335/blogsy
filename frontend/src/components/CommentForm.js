import React, { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { BsEmojiSmile } from 'react-icons/bs';

const CommentForm = ({ onSubmit, initialValue = '', placeholder, buttonText }) => {
  const [content, setContent] = useState(initialValue);
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiClick = (emojiObject) => {
    setContent(prevContent => prevContent + emojiObject.emoji);
    setShowPicker(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit(content);
    setContent('');
  };

  return (
    // The className="comment-form" on this form is important for the styles in PostPage.js
    <form onSubmit={handleSubmit} className="comment-form">
      <div className="textarea-wrapper">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows="3"
        />
        <button type="button" className="emoji-toggle-btn" onClick={() => setShowPicker(val => !val)}>
          <BsEmojiSmile />
        </button>
      </div>
      
      {showPicker && (
        <div className="emoji-picker-container">
          <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
        </div>
      )}
      
      {/* --- THE FIX --- */}
      {/* This div aligns the button to the right, and the button now has the correct generic 'btn' class */}
      <div className="form-actions">
          <button type="submit" className="btn" disabled={!content.trim()}>
              {buttonText}
          </button>
      </div>
      {/* --------------- */}
    </form>
  );
};

export default CommentForm;