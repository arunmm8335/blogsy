import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchPostById, updatePost } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useDropzone } from 'react-dropzone';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FiUploadCloud, FiX, FiClock, FiSave, FiCheckCircle } from 'react-icons/fi';
import QuillCustomToolbar from '../components/QuillCustomToolbar';
import { uploadFilesToSupabaseStorage } from '../services/supabaseStorage';
import './EditPostPage.css';

const renderPreview = (item) => {
  const url = item.preview || item.url;
  const type = String(item.type || item.fileType || '').toLowerCase();

  if (type === 'image' || type.startsWith('image/')) {
    return <img src={url} alt="Post media" className="preview-media" />;
  }

  if (type === 'video' || type.startsWith('video/')) {
    return <video src={url} controls className="preview-media" />;
  }

  if (type === 'audio' || type.startsWith('audio/')) {
    return <audio controls src={url} className="preview-audio" />;
  }

  return <div className="preview-file-name">{item.name || 'Media File'}</div>;
};

const EditPostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('published');
  const [existingMedia, setExistingMedia] = useState([]);
  const [newMediaFiles, setNewMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const newMediaRef = useRef([]);

  const getBinaryFile = (item) => item?.rawFile || item;
  const getErrorMessage = (err, fallback = 'Failed to update post.') => {
    if (!err) return fallback;
    if (typeof err === 'string') return err;
    return err.message || err.error || fallback;
  };

  const tagList = useMemo(
    () => tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tags]
  );

  const contentWordCount = useMemo(() => {
    const text = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  }, [content]);

  useEffect(() => {
    if (!user) return;

    const getPostData = async () => {
      try {
        const post = await fetchPostById(id);

        const postAuthorId = post.authorId?._id || post.authorId;
        if (user?._id !== postAuthorId) {
          toast.error('You are not authorized to edit this post.');
          navigate('/');
          return;
        }

        setTitle(post.title);
        setContent(post.content || '');
        setTags(post.tags.join(', '));
        setStatus(post.status || 'published');

        if (post.media && post.media.length > 0) {
          setExistingMedia(post.media);
        } else if (post.coverImage) {
          setExistingMedia([{ url: post.coverImage, fileType: 'image', name: 'Legacy Cover Image' }]);
        }
      } catch (error) {
        toast.error('Could not fetch post data.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    getPostData();
  }, [id, user, navigate]);

  const onDrop = useCallback((acceptedFiles) => {
    const mappedFiles = acceptedFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      rawFile: file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: URL.createObjectURL(file)
    }));
    setNewMediaFiles((prev) => [...prev, ...mappedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 10,
    accept: { 'image/*': [], 'video/*': [], 'audio/*': [] },
  });

  useEffect(() => {
    newMediaRef.current = newMediaFiles;
  }, [newMediaFiles]);

  useEffect(() => () => {
    newMediaRef.current.forEach((file) => {
      if (file.preview) URL.revokeObjectURL(file.preview);
    });
  }, []);

  const removeExistingMedia = (mediaToRemove) => {
    setExistingMedia((prev) => prev.filter((item) => item.url !== mediaToRemove.url));
  };

  const removeNewFile = (fileToRemove) => {
    setNewMediaFiles((prev) => prev.filter((file) => file.id !== fileToRemove.id));
    URL.revokeObjectURL(fileToRemove.preview);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required.');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('Updating post...');

    const postFormData = new FormData();
    postFormData.append('title', title.trim());
    postFormData.append('content', content);
    postFormData.append('tags', tagList.join(','));
    postFormData.append('status', status);
    postFormData.append('existingMediaUrls', JSON.stringify(existingMedia.map((item) => item.url)));

    if (newMediaFiles.length > 0) {
      const uploadToastId = toast.loading('Uploading new media...');
      try {
        const uploadedMedia = await uploadFilesToSupabaseStorage(newMediaFiles, user?._id || 'anonymous');

        if (uploadedMedia && uploadedMedia.length > 0) {
          postFormData.append('mediaUrls', JSON.stringify(uploadedMedia));
          toast.success('New media uploaded to Supabase Storage.', { id: uploadToastId });
        } else {
          newMediaFiles.forEach((file) => {
            postFormData.append('media', getBinaryFile(file));
          });
          toast.dismiss(uploadToastId);
        }
      } catch (uploadError) {
        console.error('Supabase media upload failed, falling back to backend upload:', uploadError);
        newMediaFiles.forEach((file) => {
          postFormData.append('media', getBinaryFile(file));
        });
        toast('Direct upload failed. Falling back to standard upload.', {
          id: uploadToastId,
          icon: '⚠️',
        });
      }
    }

    try {
      await updatePost(id, postFormData, user.token);
      toast.success('Post updated successfully!', { id: toastId });
      navigate(`/posts/${id}`);
    } catch (error) {
      toast.error(getErrorMessage(error), { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading editor...</p>;

  return (
    <div className="edit-post-page">
      <header className="edit-post-header">
        <h1>Edit Your Post</h1>
        <p>Refine your story before republishing. Keep it sharp, readable, and worth sharing.</p>
        <div className="edit-post-stats">
          <span><FiClock /> {contentWordCount} words</span>
          <span><FiCheckCircle /> {tagList.length} tags</span>
          <span><FiUploadCloud /> {existingMedia.length + newMediaFiles.length} media items</span>
        </div>
      </header>

      <form onSubmit={onSubmit} className="edit-post-form">
        <div className="edit-post-grid">
          <section className="edit-post-main-card">
            <div className="edit-post-field">
              <label htmlFor="post-title">Title</label>
              <input
                id="post-title"
                type="text"
                value={title}
                maxLength={140}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <small>{title.trim().length}/140</small>
            </div>

            <div className="edit-post-field">
              <label>Content</label>
              <QuillCustomToolbar />
              <div className="editor-container">
                <ReactQuill
                  value={content}
                  onChange={setContent}
                  modules={{ toolbar: '#quill-toolbar' }}
                />
              </div>
            </div>
          </section>

          <aside className="edit-post-side-card">
            <div className="edit-post-field">
              <label htmlFor="post-status">Post Status</label>
              <select id="post-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="edit-post-field">
              <label htmlFor="post-tags">Tags</label>
              <input id="post-tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="react, node, productivity" />
            </div>

            <div className="edit-post-tag-list">
              {tagList.length > 0 ? tagList.map((tag) => (
                <span key={tag}>{tag}</span>
              )) : <p>No tags yet</p>}
            </div>

            <div className="edit-post-field">
              <label>Add New Media</label>
              <div {...getRootProps({ className: `dropzone ${isDragActive ? 'dropzone-active' : ''}` })}>
                <input {...getInputProps()} />
                <FiUploadCloud className="dropzone-icon" />
                <p>{isDragActive ? 'Drop files here...' : 'Drag files here, or click to browse'}</p>
                <small>Images, videos, and audio files</small>
              </div>
            </div>

            {(existingMedia.length > 0 || newMediaFiles.length > 0) && (
              <div className="edit-post-field">
                <label>Attached Media</label>
                <div className="previews-container">
                  {existingMedia.map((item) => (
                    <div key={item.url} className="preview-item">
                      {renderPreview(item)}
                      <button type="button" onClick={() => removeExistingMedia(item)} className="remove-file-btn"><FiX size={16} /></button>
                    </div>
                  ))}
                  {newMediaFiles.map((file) => (
                    <div key={file.id} className="preview-item">
                      {renderPreview(file)}
                      <button type="button" onClick={() => removeNewFile(file)} className="remove-file-btn"><FiX size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        <div className="edit-post-actions">
          <button type="submit" className="update-btn" disabled={saving}>
            <FiSave />
            {saving ? 'Updating...' : 'Update Post'}
          </button>
          <button type="button" className="cancel-btn" onClick={() => navigate(`/posts/${id}`)} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPostPage;