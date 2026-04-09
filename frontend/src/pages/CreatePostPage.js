import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createPost } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDropzone } from 'react-dropzone';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FiUploadCloud, FiX, FiEye, FiEyeOff, FiClock } from 'react-icons/fi';
import QuillCustomToolbar from '../components/QuillCustomToolbar';
import { uploadFilesToSupabaseStorage } from '../services/supabaseStorage';
import './CreatePostPage.css';

const CreatePostPage = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [actionType, setActionType] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const mediaFilesRef = useRef([]);

  const getBinaryFile = (item) => item?.rawFile || item;
  const getErrorMessage = (err, fallback = 'Failed to create post.') => {
    if (!err) return fallback;
    if (typeof err === 'string') return err;
    return err.message || err.error || fallback;
  };

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      rawFile: file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: URL.createObjectURL(file),
    }));
    setMediaFiles((prevFiles) => [...prevFiles, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 10,
    accept: { 'image/*': [], 'video/*': [], 'audio/*': [] },
  });

  const removeFile = (fileToRemove, e) => {
    e.stopPropagation();
    URL.revokeObjectURL(fileToRemove.preview);
    setMediaFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileToRemove.id));
  };

  useEffect(() => {
    mediaFilesRef.current = mediaFiles;
  }, [mediaFiles]);

  useEffect(() => {
    return () => {
      mediaFilesRef.current.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, []);

  const tagList = useMemo(
    () => tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tags]
  );

  const contentWordCount = useMemo(() => {
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  }, [content]);

  const isLoading = actionType !== '';

  const renderPreview = (file) => {
    const { type, preview, name } = file;
    if (type && type.startsWith('image/')) {
      return <img src={preview} alt={name} className="preview-media" />;
    }
    return <div className="preview-file-name">{name}</div>;
  };

  const submitPost = async (status) => {
    if (!user?.token) {
      toast.error('Please login first.');
      return;
    }

    if (status === 'published' && (!title.trim() || !content.trim())) {
      toast.error('Title and content are required to publish.');
      return;
    }

    if (status === 'draft' && !title.trim() && !content.trim()) {
      toast.error('Please add at least a title or content to save draft.');
      return;
    }

    setActionType(status === 'published' ? 'publish' : 'draft');

    const postFormData = new FormData();
    postFormData.append('title', title.trim() || 'Untitled Draft');
    postFormData.append('content', content || '');
    postFormData.append('tags', tagList.join(','));
    postFormData.append('status', status);

    if (mediaFiles.length > 0) {
      const uploadToastId = toast.loading('Uploading media...');
      try {
        const uploadedMedia = await uploadFilesToSupabaseStorage(mediaFiles, user?._id || 'anonymous');

        if (uploadedMedia && uploadedMedia.length > 0) {
          postFormData.append('mediaUrls', JSON.stringify(uploadedMedia));
          toast.success('Media uploaded to Supabase Storage.', { id: uploadToastId });
        } else {
          mediaFiles.forEach((file) => postFormData.append('media', getBinaryFile(file)));
          toast.dismiss(uploadToastId);
        }
      } catch (uploadError) {
        console.error('Supabase media upload failed, falling back to backend upload:', uploadError);
        mediaFiles.forEach((file) => postFormData.append('media', getBinaryFile(file)));
        toast('Direct upload failed. Falling back to standard upload.', {
          id: uploadToastId,
          icon: '⚠️',
        });
      }
    }

    try {
      const newPost = await createPost(postFormData, user.token);
      toast.success(status === 'published' ? 'Post published successfully!' : 'Draft saved successfully!');
      navigate(`/posts/${newPost._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionType('');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await submitPost('published');
  };

  const saveAsDraft = async () => submitPost('draft');

  return (
    <div className="create-post-page">
      <header className="create-post-header">
        <h1>Create New Post</h1>
        <p>Shape your story with rich text, tags, and media before publishing it to the community.</p>
        <div className="create-post-stats">
          <span>{contentWordCount} words</span>
          <span>{tagList.length} tags</span>
          <span>{mediaFiles.length} files</span>
        </div>
      </header>

      <form onSubmit={onSubmit} className="create-post-form">
        <div className="create-post-grid">
          <section className="create-post-main-card">
            <div className="create-post-field">
              <label htmlFor="title">Post Title</label>
              <input
                type="text"
                id="title"
                maxLength={140}
                placeholder="Write a sharp title that makes readers curious"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <small>{title.trim().length}/140</small>
            </div>

            <div className="create-post-field">
              <label>Content</label>
              <QuillCustomToolbar />
              <div className="editor-container">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={{ toolbar: '#quill-toolbar' }}
                />
              </div>
            </div>
          </section>

          <aside className="create-post-side-card">
            <div className="create-post-field">
              <label htmlFor="tags">Tags</label>
              <input
                type="text"
                id="tags"
                placeholder="javascript, react, productivity"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <small>Use commas to separate tags</small>
            </div>

            <div className="create-post-tag-list">
              {tagList.length > 0 ? tagList.map((tag) => (
                <span key={tag}>{tag}</span>
              )) : <p>No tags yet</p>}
            </div>

            <div className="create-post-field">
              <label>Attach Media</label>
              <div {...getRootProps({ className: `dropzone ${isDragActive ? 'dropzone-active' : ''}` })}>
                <input {...getInputProps()} />
                <FiUploadCloud className="dropzone-icon" />
                <p>{isDragActive ? 'Drop files to upload' : 'Drag media here or click to browse'}</p>
                <small>Up to 10 files (image, video, audio)</small>
              </div>
            </div>

            {mediaFiles.length > 0 && (
              <div className="previews-container">
                {mediaFiles.map((file) => (
                  <div key={file.id} className="preview-item">
                    {renderPreview(file)}
                    <button type="button" onClick={(e) => removeFile(file, e)} className="remove-file-btn">
                      <FiX size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>

        <div className="create-post-actions">
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="toggle-preview-btn"
          >
            {showPreview ? <FiEyeOff /> : <FiEye />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>

          <div className="primary-actions">
            <button type="button" onClick={saveAsDraft} className="draft-btn" disabled={isLoading}>
              <FiClock />
              {actionType === 'draft' ? 'Saving Draft...' : 'Save Draft'}
            </button>
            <button type="submit" className="publish-btn" disabled={isLoading}>
              {actionType === 'publish' ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </div>
      </form>

      {showPreview && (
        <section className="live-preview">
          <h2>{title || 'Post Title'}</h2>
          <div className="preview-tags">
            {tagList.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
          <div
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: content || '<p><em>Start writing your post...</em></p>' }}
          />

          {mediaFiles.length > 0 && (
            <div className="preview-media-row">
              {mediaFiles.map((file) => (
                <div key={file.id} className="preview-media-box">
                  {file.type.startsWith('image/') ? (
                    <img src={file.preview} alt={file.name} />
                  ) : (
                    <span>{file.name}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default CreatePostPage;
