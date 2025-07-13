import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import 'react-loading-skeleton/dist/skeleton.css';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import DefaultLayout from './components/DefaultLayout';
import FullWidthLayout from './components/FullWidthLayout';
import AuthLayout from './components/AuthLayout';
import PrivateRoute from './components/PrivateRoute';
// import ProfileLayout from './components/ProfileLayout';

import HomePage from './pages/HomePage';
import PostPage from './pages/PostPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreatePostPage from './pages/CreatePostPage';
import EditPostPage from './pages/EditPostPage';
import EditProfilePage from './pages/EditProfilePage';
import DraftsPage from './pages/DraftsPage';

import loginBg from './assets/background.jpg';
import registerBg from './assets/background-register.jpg';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import NotFoundPage from './pages/NotFoundPage';

import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* --- GROUP 1: Standard, centered layout (for general pages) --- */}
            <Route path="/" element={<DefaultLayout><Outlet /></DefaultLayout>}>
              <Route path="about" element={<AboutPage />} />
              <Route path="search" element={<SearchPage />} />
            </Route>

            {/* --- GROUP 2: Full-width layout (for content-heavy pages) --- */}
            <Route path="/" element={<FullWidthLayout><Outlet /></FullWidthLayout>}>
              <Route index element={<HomePage />} />

              {/* --- All /posts and /profile routes are now grouped together for clarity --- */}

              {/* Private Routes must be wrapped and defined FIRST */}
              <Route element={<PrivateRoute />}>
                <Route path="posts/create" element={<CreatePostPage />} />
                <Route path="posts/:id/edit" element={<EditPostPage />} />
                <Route path="profile/edit" element={<EditProfilePage />} />
                <Route path="drafts" element={<DraftsPage />} />
              </Route>

              {/* Public routes that match a similar pattern come AFTER the specific ones */}
              <Route path="posts/:id" element={<PostPage />} />
              <Route path="profile/:username" element={<ProfilePage />} />
            </Route>
            {/* Profile page with its own layout */}
            {/* This route is now handled by the FullWidthLayout group */}

            {/* --- GROUP 3: Auth pages (No changes needed here) --- */}
            <Route path="/login" element={<AuthLayout pageTitle="Welcome Back" image={loginBg}><LoginPage /></AuthLayout>} />
            <Route path="/register" element={<AuthLayout pageTitle="Join Our Community" image={registerBg}><RegisterPage /></AuthLayout>} />
            {/* --- ADD THESE NEW ROUTES --- */}
            <Route path="/forgot-password" element={<AuthLayout pageTitle="Recover Your Account"><ForgotPasswordPage /></AuthLayout>} />
            <Route path="/reset-password/:token" element={<AuthLayout pageTitle="Create a New Password"><ResetPasswordPage /></AuthLayout>} />

            <Route path="*" element={<DefaultLayout><NotFoundPage /></DefaultLayout>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

// This is the corrected export statement
export default App;