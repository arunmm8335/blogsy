import React, { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { BsEmojiSmile, BsPaperclip, BsTypeBold, BsTypeItalic, BsTypeUnderline, BsImage, BsAt } from 'react-icons/bs';

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

  const handleEmojiClick = (emojiObject) => {
    setContent(prevContent => prevContent + emojiObject.emoji);
    setShowPicker(false);
  };

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

  return (
    <form onSubmit={handleSubmit} className="dribbble-editor-form" style={{ width: '100%' }}>
      <div className={`dribbble-editor-container${isFocused ? ' focused' : ''}`}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="dribbble-editor-textarea"
          disabled={loading}
          rows={1}
          style={{ resize: 'none' }}
        />
        <div className="dribbble-editor-toolbar">
          <button type="button" className="editor-icon-btn" tabIndex={-1}><BsTypeBold /></button>
          <button type="button" className="editor-icon-btn" tabIndex={-1}><BsTypeItalic /></button>
          <button type="button" className="editor-icon-btn" tabIndex={-1}><BsTypeUnderline /></button>
          <span className="toolbar-divider" />
          <button type="button" className="editor-icon-btn" tabIndex={-1}><BsPaperclip /></button>
          <button type="button" className="editor-icon-btn" tabIndex={-1}><BsImage /></button>
          <button type="button" className="editor-icon-btn" onClick={() => setShowPicker(val => !val)} disabled={loading}><BsEmojiSmile /></button>
          <button type="button" className="editor-icon-btn" tabIndex={-1}><BsAt /></button>
          <div style={{ flex: 1 }} />
          <button type="submit" className="btn dribbble-submit-btn" disabled={!content.trim() || loading}>
            {loading ? <span className="spinner" /> : buttonText}
          </button>
        </div>
        {/* <div className="comment-char-count" style={{fontSize: '0.92rem', color: '#bbb', marginTop: 2, textAlign: 'right'}}>{content.length} / 500</div> */}
        {showPicker && (
          <div className="emoji-picker-container">
            <EmojiPicker onEmojiClick={handleEmojiClick} theme="light" />
          </div>
        )}
      </div>
      {error && <div className="comment-error" style={{ color: 'var(--primary-color)', marginTop: '0.5rem' }}>{error}</div>}
      <style>{`
        .dribbble-editor-form {
          width: 100%;
        }
        .dribbble-editor-container {
          background: var(--tag-background);
          border-radius: 16px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          padding: 1.2rem 1.5rem 1rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          border: 2px solid transparent;
          transition: border 0.18s, box-shadow 0.18s;
        }
        .dribbble-editor-container.focused {
          border: 2px solid var(--primary-color);
          box-shadow: 0 0 0 2px var(--primary-color);
          box-shadow: 0 0 0 2px rgba(230, 90, 62, 0.2);
        }
        .dribbble-editor-textarea {
          width: 100%;
          min-height: 44px;
          max-height: 180px;
          border: none;
          background: transparent;
          font-size: 1.08rem;
          font-family: inherit;
          color: var(--text-color);
          outline: none;
          resize: none;
          padding: 0;
          margin-bottom: 0.2rem;
        }
        .dribbble-editor-toolbar {
          display: flex;
          align-items: center;
          gap: 0.2rem;
          margin-top: 0.2rem;
        }
        .editor-icon-btn {
          background: none;
          border: none;
          color: var(--secondary-text-color);
          font-size: 1.18rem;
          cursor: pointer;
          padding: 0.18rem 0.5rem;
          border-radius: 4px;
          transition: background 0.15s, color 0.15s;
          display: flex;
          align-items: center;
        }
        .editor-icon-btn:hover {
          background: var(--card-border);
          color: var(--primary-color);
        }
        .toolbar-divider {
          width: 1px;
          height: 22px;
          background: var(--card-border);
          margin: 0 0.5rem;
          display: inline-block;
        }
        .dribbble-submit-btn {
          background: var(--primary-color);
          color: var(--button-text-color);
          border: none;
          border-radius: 8px;
          padding: 0.45rem 1.3rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s;
          margin-left: 0.8rem;
        }
        .dribbble-submit-btn:disabled {
          background: var(--card-border);
          color: var(--secondary-text-color);
          cursor: not-allowed;
        }
        .emoji-picker-container {
          position: absolute;
          z-index: 10;
        }
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid var(--card-border);
          border-top: 2px solid var(--primary-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          vertical-align: middle;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </form>
  );
};

export default CommentForm;