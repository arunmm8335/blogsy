import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';
import AnimatedPage from './AnimatedPage'; // <-- Import the animation wrapper

const DefaultLayout = ({ children }) => {
  return (
    <div className="app-wrapper">
      <Header />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <main className="page-container">
        <AnimatedPage>
          {children}
        </AnimatedPage>
      </main>
      <Footer />
    </div>
  );
};

export default DefaultLayout;