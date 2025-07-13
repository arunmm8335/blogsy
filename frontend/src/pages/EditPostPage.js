// In /src/pages/EditPostPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchPostById, updatePost } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDropzone } from 'react-dropzone';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FiUploadCloud, FiX } from 'react-icons/fi';
// import QuillCustomToolbar from '../components/QuillCustomToolbar';

// --- STYLES (Synced with your index.css) ---
const pageStyles = `
  .edit-post-container { max-width: 1100px; margin: 2rem auto; padding: 0 1rem; }
  .edit-post-panel { background-color: var(--card-background); color: var(--text-color); padding: 2.5rem; border-radius: 12px; border: 1px solid var(--card-border); }
  .edit-post-panel h1 { text-align: center; margin-bottom: 2.5rem; font-size: 2rem; font-weight: 700; }
  .form-grid { display: grid; grid-template-columns: 1fr; gap: 2.5rem; }
  @media (min-width: 1024px) { .form-grid { grid-template-columns: 2fr 1fr; } }
  .form-group { margin-bottom: 1.5rem; }
  .form-group label { display: block; margin-bottom: 0.75rem; font-weight: 500; color: var(--secondary-text-color); }
  .form-group input[type="text"] { width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--card-border); background-color: var(--background-color); border-radius: 6px; color: var(--text-color); font-size: 1rem; }
  .editor-container .ql-toolbar { border: 1px solid var(--card-border); border-bottom: 0px; background-color: var(--card-background); }
  .editor-container .ql-container { border: 1px solid var(--card-border); background-color: var(--background-color); color: var(--text-color); min-height: 250px; }
  .editor-container .ql-snow .ql-stroke, .editor-container .ql-snow .ql-picker-label { color: var(--secondary-text-color); }
  .dropzone { border: 2px dashed var(--card-border); background-color: var(--background-color); border-radius: 6px; padding: 2rem; text-align: center; cursor: pointer; }
  .dropzone-active { border-color: var(--primary-color); }
  .dropzone-icon { font-size: 2.5rem; color: var(--secondary-text-color); margin-bottom: 1rem; }
  .previews-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem; margin-top: 1.5rem; }
  .preview-item { position: relative; border-radius: 6px; overflow: hidden; border: 1px solid var(--card-border); aspect-ratio: 16 / 9; }
  .preview-media { width: 100%; height: 100%; object-fit: cover; }
  .remove-file-btn { position: absolute; top: 5px; right: 5px; background: rgba(0, 0, 0, 0.6); color: white; border: none; border-radius: 50%; cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
  .update-btn { width: 100%; padding: 1rem; font-size: 1.1rem; font-weight: 600; border-radius: 6px; background-color: var(--primary-color); color: var(--button-text-color); border: none; cursor: pointer; }
  .update-btn:hover { background-color: var(--primary-hover-color); }
  .update-btn:disabled { background-color: var(--secondary-text-color); cursor: not-allowed; }
`;

// --- THIS IS THE FIX ---
// The renderPreview function is now more robust.
const renderPreview = (item) => {
  const url = item.preview || item.url;
  const type = item.type || item.fileType; // Handles both new and existing files

  // It now checks if type IS 'image' OR STARTS WITH 'image/'
  if (type === 'image' || (type && type.startsWith('image/'))) {
    return <img src={url} alt="Post media" className="preview-media" />;
  }

  // It now checks if type IS 'video' OR STARTS WITH 'video/'
  if (type === 'video' || (type && type.startsWith('video/'))) {
    return <video src={url} controls className="preview-media" />;
  }

  // Fallback for other file types (like audio or documents)
  return <div style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-color)' }}>{item.name || 'Media File'}</div>
};

const EditPostPage = () => {
  const { id } = useParams(); const navigate = useNavigate(); const { user } = useAuth();
  const [title, setTitle] = useState(''); const [content, setContent] = useState(''); const [tags, setTags] = useState('');
  const [status, setStatus] = useState('published'); const [existingMedia, setExistingMedia] = useState([]); const [newMediaFiles, setNewMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    const getPostData = async () => {
      try {
        const post = await fetchPostById(id);
        console.log('Post data:', post); // Debug log
        console.log('User ID:', user?._id); // Debug log
        console.log('Post author ID:', post.authorId?._id || post.authorId); // Debug log

        // Check if user is authorized to edit this post
        const postAuthorId = post.authorId?._id || post.authorId;
        if (user?._id !== postAuthorId) {
          toast.error("You are not authorized to edit this post.");
          navigate('/');
          return;
        }
        setTitle(post.title);
        setContent(post.content || '');
        setTags(post.tags.join(', '));
        setStatus(post.status || 'published');
        if (post.media && post.media.length > 0) { setExistingMedia(post.media); }
        else if (post.coverImage) { setExistingMedia([{ url: post.coverImage, fileType: 'image', name: 'Legacy Cover Image' }]); }
      } catch (error) { toast.error("Could not fetch post data."); navigate('/'); } finally { setLoading(false); }
    };
    getPostData();
  }, [id, user, navigate]);
  const onDrop = useCallback(acceptedFiles => { const mappedFiles = acceptedFiles.map(file => Object.assign(file, { preview: URL.createObjectURL(file) })); setNewMediaFiles(prev => [...prev, ...mappedFiles]); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });
  const removeExistingMedia = (mediaToRemove) => { setExistingMedia(prev => prev.filter(item => item.url !== mediaToRemove.url)); };
  const removeNewFile = (fileToRemove) => { setNewMediaFiles(prev => prev.filter(file => file.preview !== fileToRemove.preview)); URL.revokeObjectURL(fileToRemove.preview); };

  function imageHandler() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        // For now, we'll use a simple approach - add the file to newMediaFiles
        // and let the user handle it through the media upload section
        const newFile = Object.assign(file, { preview: URL.createObjectURL(file) });
        setNewMediaFiles(prevFiles => [...prevFiles, newFile]);
        toast.success('Image added to media files. You can insert it in the content editor.');
      }
    };
  }

  const onSubmit = async e => {
    e.preventDefault(); const toastId = toast.loading('Updating post...'); const postFormData = new FormData();
    postFormData.append('title', title); postFormData.append('content', content); postFormData.append('tags', tags);
    postFormData.append('status', status);
    const keptMediaUrls = existingMedia.map(item => item.url); postFormData.append('existingMediaUrls', JSON.stringify(keptMediaUrls));
    newMediaFiles.forEach(file => { postFormData.append('media', file); });
    try { await updatePost(id, postFormData, user.token); toast.success('Post updated successfully!', { id: toastId }); navigate(`/posts/${id}`); } catch (error) { toast.error('Failed to update post.', { id: toastId }); }
  };
  if (loading) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading editor...</p>;
  return (
    <>
      <style>{pageStyles}</style>
      <div className="edit-post-container">
        <div className="edit-post-panel">
          <h1>Edit Your Post</h1>
          <form onSubmit={onSubmit}>
            <div className="form-grid">
              <div className="form-main">
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Content</label>
                  <div className="editor-container">
                    <ReactQuill value={content} onChange={setContent} />
                  </div>
                </div>
              </div>
              <div className="form-sidebar">
                <div className="form-group">
                  <label>Post Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--card-border)',
                      backgroundColor: 'var(--background-color)',
                      borderRadius: '6px',
                      color: 'var(--text-color)',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tags (comma-separated)</label>
                  <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Attach New Media</label>
                  <div {...getRootProps({ className: `dropzone ${isDragActive ? 'dropzone-active' : ''}` })}>
                    <input {...getInputProps()} />
                    <FiUploadCloud className="dropzone-icon" />
                    <p>Drag files here, or click to browse</p>
                  </div>
                </div>
                {(existingMedia.length > 0 || newMediaFiles.length > 0) && (
                  <div className="form-group">
                    <label>Media Attached to Post</label>
                    <div className="previews-container">
                      {existingMedia.map((item) => (
                        <div key={item.url} className="preview-item">
                          {renderPreview(item)}
                          <button type="button" onClick={() => removeExistingMedia(item)} className="remove-file-btn"><FiX size={16} /></button>
                        </div>
                      ))}
                      {newMediaFiles.map((file) => (
                        <div key={file.preview} className="preview-item">
                          {renderPreview(file)}
                          <button type="button" onClick={() => removeNewFile(file)} className="remove-file-btn"><FiX size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button type="submit" className="update-btn" style={{ marginTop: '1.5rem' }}>Update Post</button>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditPostPage;