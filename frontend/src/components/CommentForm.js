import React, { useState } from 'react';
import { BsEmojiSmile, BsPaperclip, BsTypeBold, BsTypeItalic, BsTypeUnderline, BsImage, BsAt } from 'react-icons/bs';
import './CommentForm.css';

const CommentForm = ({ onSubmit, initialValue = '', placeholder, buttonText }) => {
  const [content, setContent] = useState(initialValue);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = React.useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-grow textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // Refocus after submit
  React.useEffect(() => {
    if (!loading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && content.trim()) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit(content);
      setContent('');
    } catch (err) {
      setError('Failed to submit comment.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to apply formatting to selected text
  const applyFormatting = (formatType) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    let before = content.substring(0, start);
    let selected = content.substring(start, end);
    let after = content.substring(end);
    let formatted;
    if (formatType === 'bold') {
      formatted = `**${selected || 'bold text'}**`;
    } else if (formatType === 'italic') {
      formatted = `*${selected || 'italic text'}*`;
    } else if (formatType === 'underline') {
      formatted = `__${selected || 'underline text'}__`;
    } else {
      return;
    }
    const newContent = before + formatted + after;
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        before.length + formatted.length,
        before.length + formatted.length
      );
    }, 0);
  };

  // Handle image upload (insert [image] placeholder)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setContent(prev => prev + ' [image] ');
    }
  };
  const imageInputRef = React.useRef();

  // Emoji row for single-row picker
  const emojiList = [
    '😀', '😁', '😂', '🤣', '😊', '😍', '😎', '😢', '😭', '😡', '👍', '🙏', '👏', '🔥', '🎉', '💯', '🥳', '😅', '😉', '😇', '😜', '🤔', '😏', '😬', '😱', '😴', '🤩', '😋', '😤', '😮', '😆', '😐', '😑', '😒', '😔', '😕', '🙄', '😲', '😳', '😵', '😡', '🤯', '🥺', '🤗', '🤭', '🤫', '🤥', '😶', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👻', '💀', '👽', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'
  ];
  const handleEmojiRowClick = (emoji) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = content.substring(0, start);
    const after = content.substring(end);
    setContent(before + emoji + after);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
    setShowPicker(false);
  };

  return (
    <form onSubmit={handleSubmit} className="comment-editor-form">
      <div className={`comment-editor-container${isFocused ? ' focused' : ''}`}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="comment-editor-textarea"
          disabled={loading}
          rows={1}
          style={{ resize: 'none' }}
        />
        <div className="comment-editor-toolbar">
          <button type="button" className="editor-icon-btn" tabIndex={-1} onClick={() => applyFormatting('bold')} title="Bold"><BsTypeBold /></button>
          <button type="button" className="editor-icon-btn" tabIndex={-1} onClick={() => applyFormatting('italic')} title="Italic"><BsTypeItalic /></button>
          <button type="button" className="editor-icon-btn" tabIndex={-1} onClick={() => applyFormatting('underline')} title="Underline"><BsTypeUnderline /></button>
          <span className="toolbar-divider" />
          <button type="button" className="editor-icon-btn" tabIndex={-1}><BsPaperclip /></button>
          <button type="button" className="editor-icon-btn" tabIndex={-1} onClick={() => imageInputRef.current && imageInputRef.current.click()} title="Insert Image"><BsImage /></button>
          <input type="file" accept="image/*" ref={imageInputRef} className="image-input" onChange={handleImageUpload} />
          <button type="button" className="editor-icon-btn" onClick={() => setShowPicker(val => !val)} disabled={loading} title="Emoji"><BsEmojiSmile /></button>
          <button type="button" className="editor-icon-btn" tabIndex={-1}><BsAt /></button>
        </div>

        <button type="submit" className="comment-submit-btn" disabled={!content.trim() || loading}>
          {loading ? <span className="spinner" /> : buttonText}
        </button>

        {showPicker && (
          <div className="emoji-row-container">
            {emojiList.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                className="emoji-btn"
                onClick={() => handleEmojiRowClick(emoji)}
                tabIndex={0}
                aria-label={`Insert emoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <div className="comment-error">{error}</div>}
    </form>
  );
};

export default CommentForm;
