// In src/services/api.js (CORRECT)
import axios from 'axios';

// Use environment variable for API URL in production, fallback to proxy in development
const API_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Function to fetch all posts
// In /src/services/api.js

// --- REPLACE the old fetchPosts function ---
export const fetchPosts = async (page = 1, limit = 6) => { // Default to 5 posts per page
  try {
    const response = await api.get(`/posts?page=${page}&limit=${limit}`);
    // Return the full object: { posts, page, pages, total }
    return response.data;
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
};

// Function to register a new user
export const registerUser = async (userData) => {
  try {
    const response = await api.post(`/auth/register`, userData);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Add this to src/services/api.js

// ... (keep existing functions) ...

// Function to log in a user
export const loginUser = async (userData) => {
  try {
    const response = await api.post(`/auth/login`, userData);
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createPost = async (postData, token) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data', // Axios sets this boundary automatically for FormData
      Authorization: `Bearer ${token}`,
    },
  };
  // 
  try {
    const response = await api.post(`/posts`, postData, config);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Add these to src/services/api.js

// ... (keep existing functions) ...

// Function to fetch a single post by its ID
export const fetchPostById = async (postId) => {
  try {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Function to fetch comments for a post
export const fetchComments = async (postId) => {
  try {
    const response = await api.get(`/comments/${postId}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Function to add a new comment
export const addComment = async (commentData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    const response = await api.post(`/comments`, commentData, config);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updatePost = async (postId, postData, token) => {
  // postData is already a FormData object from the component
  const config = {
    headers: {
      // 'Content-Type': 'multipart/form-data' , // is set automatically by the browser for FormData
      'Authorization': `Bearer ${token}`
    },
  };
  try {
    const response = await api.put(`/posts/${postId}`, postData, config);
    return response.data;
  } catch (error) {
    // Throw the more informative error message from the backend if it exists
    throw new Error(error.response?.data?.message || 'Failed to update post.');
  }
};
// Function to delete a post
export const deletePost = async (postId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    const response = await api.delete(`/posts/${postId}`, config);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const fetchUserProfile = async (username) => {
  try {
    const response = await api.get(`/users/profile/${username}`);
    return response.data; // This will return { user: {...}, posts: [...] }
  } catch (error) {
    throw error.response.data;
  }
};

// Add this to /src/services/api.js

// ...

// Function to toggle a like on a post
export const toggleLike = async (postId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    const response = await api.put(`/posts/${postId}/like`, {}, config);
    return response.data; // Returns the updated post object
  } catch (error) {
    throw error.response.data;
  }
};

// Add this to /src/services/api.js
// ...

// Function to search for posts
// ... other functions

// Function to search for posts
// ... other functions

// Function to search for posts
// ...
export const searchForPosts = async (keyword, sortBy = 'relevance', limit = 10) => {
  try {
    const response = await api.get(`/posts/search?q=${keyword}&sort=${sortBy}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Add this function to your existing api.js file

export const updateUserProfile = async (updateData, token) => {
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    // The endpoint to update the logged-in user is '/api/users/me'
    const response = await api.put(`/users/me`, updateData, config);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// --- NEW DRAFT-RELATED FUNCTIONS ---

// Function to fetch user drafts
export const fetchUserDrafts = async (token, page = 1, limit = 10) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    const response = await api.get(`/posts/drafts?page=${page}&limit=${limit}`, config);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Function to publish a draft
export const publishDraft = async (postId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    const response = await api.put(`/posts/${postId}/publish`, {}, config);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateComment = async (commentId, data, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    const response = await api.put(`/comments/${commentId}`, data, config);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const deleteComment = async (commentId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    const response = await api.delete(`/comments/${commentId}`, config);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Like a comment
export const likeComment = async (commentId, token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };
  try {
    const response = await api.post(`/comments/${commentId}/like`, {}, config);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Dislike a comment
export const dislikeComment = async (commentId, token) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };
  try {
    const response = await api.post(`/comments/${commentId}/dislike`, {}, config);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};