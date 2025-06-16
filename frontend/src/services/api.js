// In src/services/api.js (CORRECT)
// src/services/api.js
import axios from 'axios';

const API_URL = '/api';
// This line is key

export const fetchPosts = async (page = 1, limit = 6) => {
  try {
    const response = await axios.get(`${API_URL}/posts?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
};


// Function to register a new user
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
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
    const response = await axios.post(`${API_URL}/auth/login`, userData);
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
    const response = await axios.post(`${API_URL}/posts`, postData, config);
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
    const response = await axios.get(`${API_URL}/posts/${postId}`);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// Function to fetch comments for a post
export const fetchComments = async (postId) => {
  try {
    const response = await axios.get(`${API_URL}/comments/${postId}`);
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
    const response = await axios.post(`${API_URL}/comments`, commentData, config);
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
        const response = await axios.put(`${API_URL}/posts/${postId}`, postData, config);
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
    const response = await axios.delete(`${API_URL}/posts/${postId}`, config);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const fetchUserProfile = async (username) => {
  try {
    const response = await axios.get(`${API_URL}/users/profile/${username}`);
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
    const response = await axios.put(`${API_URL}/posts/${postId}/like`, {}, config);
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
    const response = await axios.get(`/api/posts/search?q=${keyword}&sort=${sortBy}&limit=${limit}`);
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
    const response = await axios.put(`${API_URL}/users/me`, updateData, config);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};