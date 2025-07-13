// In /src/pages/CreatePostPage.js

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createPost } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDropzone } from 'react-dropzone';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FiUploadCloud, FiX } from 'react-icons/fi';

// --- STYLES ARE NOW SYNCED WITH YOUR index.css VARIABLES ---
const pageStyles = `
  .create-post-container { max-width: 1100px; margin: 2rem auto; padding: 0 1rem; }
  .create-post-panel {
    background-color: var(--card-background);
    color: var(--text-color);
    padding: 2.5rem;
    border-radius: 12px;
    border: 1px solid var(--card-border);
  }
  .create-post-panel h1 { text-align: center; margin-bottom: 2.5rem; font-size: 2rem; font-weight: 700; }
  .form-grid { display: grid; grid-template-columns: 1fr; gap: 2.5rem; }
  @media (min-width: 1024px) { .form-grid { grid-template-columns: 2fr 1fr; } }
  .form-group { margin-bottom: 1.5rem; }
  .form-group label {
    display: block;
    margin-bottom: 0.75rem;
    font-weight: 500;
    color: var(--secondary-text-color);
  }
  .form-group input[type="text"] {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid var(--card-border);
    background-color: var(--background-color);
    border-radius: 6px;
    color: var(--text-color);
    font-size: 1rem;
  }
  .editor-container .ql-toolbar {
    border: 1px solid var(--card-border);
    border-bottom: 0px;
    background-color: var(--card-background);
  }
  .editor-container .ql-container {
    border: 1px solid var(--card-border);
    background-color: var(--background-color);
    color: var(--text-color);
    min-height: 250px;
  }
  .editor-container .ql-snow .ql-stroke { stroke: var(--secondary-text-color); }
  .editor-container .ql-snow .ql-picker-label { color: var(--secondary-text-color); }
  .dropzone {
    border: 2px dashed var(--card-border);
    background-color: var(--background-color);
    border-radius: 6px; padding: 2rem; text-align: center; cursor: pointer;
  }
  .dropzone-active { border-color: var(--primary-color); }
  .dropzone-icon { font-size: 2.5rem; color: var(--secondary-text-color); margin-bottom: 1rem; }
  .previews-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
  .preview-item { position: relative; border-radius: 6px; overflow: hidden; border: 1px solid var(--card-border); aspect-ratio: 16 / 9; }
  .preview-media { width: 100%; height: 100%; object-fit: cover; }
  .remove-file-btn { position: absolute; top: 5px; right: 5px; background: rgba(0, 0, 0, 0.6); color: white; border: none; border-radius: 50%; cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
  .publish-btn {
    width: 100%;
    padding: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 6px;
    background-color: var(--primary-color);
    color: var(--button-text-color);
    border: none; cursor: pointer;
  }
  .publish-btn:hover { background-color: var(--primary-hover-color); }
  .publish-btn:disabled { background-color: var(--secondary-text-color); cursor: not-allowed; }
`;

const CreatePostPage = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const onDrop = useCallback(acceptedFiles => { const newFiles = acceptedFiles.map(file => Object.assign(file, { preview: URL.createObjectURL(file) })); setMediaFiles(prevFiles => [...prevFiles, ...newFiles]); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [], 'video/*': [], 'audio/*': [] } });
  const removeFile = (fileToRemove, e) => { e.stopPropagation(); setMediaFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove)); URL.revokeObjectURL(fileToRemove.preview); };

  function imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        // For now, we'll use a simple approach - add the file to mediaFiles
        // and let the user handle it through the media upload section
        const newFile = Object.assign(file, { preview: URL.createObjectURL(file) });
        setMediaFiles(prevFiles => [...prevFiles, newFile]);
        toast.success('Image added to media files. You can insert it in the content editor.');
      }
    };
  }

  const quillModules = {
    toolbar: {
      container: '#quill-toolbar',
      handlers: {
        image: imageHandler
      }
    },
  };

  const renderPreview = (file) => {
    const { type, preview, name } = file;
    if (type && type.startsWith('image/')) {
      return <img src={preview} alt={name} className="preview-media" />;
    }
    return <div style={{ padding: '1rem', fontSize: '0.8rem' }}>{name}</div>;
  };

  const onSubmit = async (e) => {
    e.preventDefault(); 
    if (!title.trim() || !content.trim()) return toast.error("Title and content are required."); 
    setLoading(true); 
    const postFormData = new FormData(); 
    postFormData.append('title', title); 
    postFormData.append('content', content); 
    postFormData.append('tags', tags); 
    postFormData.append('status', 'published'); // Default to published
    mediaFiles.forEach(file => postFormData.append('media', file));
    try { 
      const newPost = await createPost(postFormData, user.token); 
      toast.success('Post published successfully!'); 
      navigate(`/posts/${newPost._id}`); 
    } catch (err) { 
      toast.error(err.message || 'Failed to create post.'); 
    } finally { 
      setLoading(false); 
    }
  };

  const saveAsDraft = async () => {
    if (!title.trim() && !content.trim()) {
      return toast.error("Please add at least a title or content to save as draft.");
    }
    setLoading(true);
    const postFormData = new FormData();
    postFormData.append('title', title || 'Untitled Draft');
    postFormData.append('content', content || '');
    postFormData.append('tags', tags);
    postFormData.append('status', 'draft');
    mediaFiles.forEach(file => postFormData.append('media', file));
    
    try {
      const newPost = await createPost(postFormData, user.token);
      toast.success('Draft saved successfully!');
      navigate(`/posts/${newPost._id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to save draft.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <style>{pageStyles}</style>
      <div className="create-post-container">
        <div className="create-post-panel">
          <h1>Create a New Post</h1>
          <form onSubmit={onSubmit}>
            <div className="form-grid">
              <div className="form-main">
                <div className="form-group">
                  <label htmlFor="title">Title</label>
                  <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Content</label>
                  <div className="editor-container">
                    <ReactQuill theme="snow" value={content} onChange={setContent} />
                  </div>
                </div>
              </div>
              <div className="form-sidebar">
                <div className="form-group">
                  <label htmlFor="tags">Tags (comma-separated)</label>
                  <input type="text" id="tags" value={tags} onChange={e => setTags(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Attach Media</label>
                  <div {...getRootProps({ className: `dropzone ${isDragActive ? 'dropzone-active' : ''}` })}>
                    <input {...getInputProps()} />
                    <FiUploadCloud className="dropzone-icon" />
                    <p>Drag files here, or click to browse</p>
                  </div>
                </div>
                {mediaFiles.length > 0 && (
                  <div className="previews-container">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="preview-item">
                        {renderPreview(file)}
                        <button type="button" onClick={(e) => removeFile(file, e)} className="remove-file-btn">
                          <FiX size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="publish-btn" disabled={loading} style={{ flex: 2 }}>
                {loading ? 'Publishing...' : 'Publish Post'}
              </button>
              <button 
                type="button" 
                onClick={saveAsDraft} 
                disabled={loading} 
                style={{ 
                  flex: 1,
                  padding: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  borderRadius: '6px',
                  backgroundColor: 'var(--secondary-text-color)',
                  color: 'var(--button-text-color)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Saving...' : 'Save as Draft'}
              </button>
            </div>
          </form>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setShowPreview(p => !p)} className="preview-toggle-btn" style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', background: 'var(--primary-color)', color: 'var(--button-text-color)', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              {showPreview ? 'Hide Live Preview' : 'Show Live Preview'}
            </button>
          </div>
          {showPreview && (
            <div className="live-preview" style={{ marginTop: '2rem', background: 'var(--card-background)', borderRadius: '12px', boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)', padding: '2rem', border: '1px solid var(--card-border)' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.2rem' }}>{title || 'Post Title'}</h2>
              <div style={{ color: 'var(--secondary-text-color)', marginBottom: '1rem' }}>
                {tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                  <span key={tag} style={{ marginRight: '0.7rem', background: 'var(--tag-background)', color: 'var(--primary-color)', borderRadius: '12px', padding: '0.2rem 0.7rem', fontSize: '0.95rem' }}>#{tag}</span>
                ))}
              </div>
              <div dangerouslySetInnerHTML={{ __html: content || '<p><em>Start writing your post...</em></p>' }} style={{ fontSize: '1.15rem', lineHeight: 1.7 }} />
              {mediaFiles.length > 0 && (
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {mediaFiles.map((file, index) => (
                    <div key={index} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--card-border)', width: '120px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background-color)' }}>
                      {file.type.startsWith('image/') ? (
                        <img src={file.preview} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '0.9rem', color: 'var(--secondary-text-color)' }}>{file.name}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
export default CreatePostPage;