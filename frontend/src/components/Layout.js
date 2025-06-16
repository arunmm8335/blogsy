// In /src/components/Layout.js
import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';
import backgroundImage from '../assets/background.jpg'; // <-- Import the image here

const Layout = ({ children }) => {
  const location = useLocation();

  // Define which path(s) should have the special background.
  const pathsWithBackground = ['/login']; // Only for the login page

  // Check if the current URL path is in our list.
  const hasBackground = pathsWithBackground.includes(location.pathname);

  // Define the style object that will be applied to the wrapper.
  const wrapperStyle = {
    // If hasBackground is true, set the backgroundImage; otherwise, set it to 'none'.
    backgroundImage: hasBackground ? `url(${backgroundImage})` : 'none',
  };

  return (
    // THIS IS THE FIX: The style attribute is now being used.
    <div className="app-wrapper" style={wrapperStyle}>
      <Header />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <main className="page-container">
        {/* 'children' will be the <Routes> component from App.js */}
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;