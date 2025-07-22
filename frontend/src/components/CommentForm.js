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
        <button type="button" className="editor-icon-btn" tabIndex={-1} onClick={() => applyFormatting('bold')} title="Bold"><BsTypeBold /></button>
        <button type="button" className="editor-icon-btn" tabIndex={-1} onClick={() => applyFormatting('italic')} title="Italic"><BsTypeItalic /></button>
        <button type="button" className="editor-icon-btn" tabIndex={-1} onClick={() => applyFormatting('underline')} title="Underline"><BsTypeUnderline /></button>
        <span className="toolbar-divider" />
        <button type="button" className="editor-icon-btn" tabIndex={-1}><BsPaperclip /></button>
        <button type="button" className="editor-icon-btn" tabIndex={-1} onClick={() => imageInputRef.current && imageInputRef.current.click()} title="Insert Image"><BsImage /></button>
        <input type="file" accept="image/*" ref={imageInputRef} style={{ display: 'none' }} onChange={handleImageUpload} />
        <button type="button" className="editor-icon-btn" onClick={() => setShowPicker(val => !val)} disabled={loading} title="Emoji"><BsEmojiSmile /></button>
        <button type="button" className="editor-icon-btn" tabIndex={-1}><BsAt /></button>
        <button type="submit" className="btn dribbble-submit-btn" disabled={!content.trim() || loading}>
          {loading ? <span className="spinner" /> : buttonText}
        </button>
        {/* <div className="comment-char-count" style={{fontSize: '0.92rem', color: '#bbb', marginTop: 2, textAlign: 'right'}}>{content.length} / 500</div> */}
        {showPicker && (
          <div className="emoji-row-container" style={{
            position: 'absolute',
            left: '50%',
            top: '100%',
            transform: 'translateX(-50%)',
            maxWidth: 420,
            width: '95vw',
            marginTop: 8,
            marginBottom: 10,
            borderRadius: 18,
            boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
            background: 'var(--background-color, #23242a)',
            padding: '6px 14px',
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            zIndex: 20
          }}>
            {emojiList.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                className="emoji-btn"
                style={{
                  fontSize: 20,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  margin: '0 2px',
                  padding: 0,
                  lineHeight: 1,
                  borderRadius: '50%',
                  transition: 'background 0.15s',
                }}
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
      {error && <div className="comment-error" style={{ color: 'var(--primary-color)', marginTop: '0.5rem' }}>{error}</div>}
      <style>{`
        .dribbble-editor-form {
          width: 100%;
        }
        .dribbble-editor-container {
          background: var(--tag-background);
          border-radius: 999px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
          padding: 0.5rem 1.2rem;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 0.18rem;
          border: 1.5px solid var(--card-border);
          transition: border 0.18s, box-shadow 0.18s;
          position: relative;
        }
        .dribbble-editor-container.focused {
          border: 1.5px solid var(--primary-color);
          box-shadow: 0 0 0 2px var(--primary-color, #e55a3e33);
        }
        .dribbble-editor-textarea {
          width: 100%;
          min-height: 44px;
          max-height: 120px;
          border: none;
          background: transparent;
          font-size: 1.08rem;
          font-family: inherit;
          color: var(--text-color);
          outline: none;
          resize: none;
          padding: 0.4rem 0.7rem;
          margin-bottom: 0;
          border-radius: 999px;
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
        .emoji-row-container {
          position: absolute;
          left: 50%;
          top: 100%;
          transform: translateX(-50%);
          max-width: 420px;
          width: 95vw;
          margin-top: 8px;
          margin-bottom: 10px;
          border-radius: 18px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.14);
          background: var(--background-color, #23242a);
          padding: 6px 14px;
          display: flex;
          overflow-x: auto;
          overflow-y: hidden;
          white-space: nowrap;
          z-index: 20;
        }
        .emoji-btn {
          font-size: 20px;
          background: none;
          border: none;
          cursor: pointer;
          margin: 0 2px;
          padding: 0;
          line-height: 1;
          border-radius: 50%;
          transition: background 0.15s;
        }
        .emoji-btn:hover {
          background: var(--tag-background);
        }
      `}</style>
    </form>
  );
};

export default CommentForm;
