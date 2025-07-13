import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { Toaster } from 'react-hot-toast';
import AnimatedPage from './AnimatedPage'; // <-- Import the animation wrapper

const FullWidthLayout = ({ children }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <main style={{ flexGrow: 1 }}>
        <AnimatedPage>
          {children}
        </AnimatedPage>
      </main>
      <Footer />
    </div>
  );
};

export default FullWidthLayout;