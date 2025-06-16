// In /src/pages/AboutPage.js

import React from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import styles from './AboutPage.module.css';

// --- STEP 1: Import your local image from the assets folder ---
// Make sure the filename here matches the file you added.
// For example, if your photo is named 'Arun.png', change it to:
// import profilePic from '../assets/Arun.png';
import profilePic from '../assets/my-photo.jpg'; 

const AboutPage = () => {
  return (
    <div className={styles.wrapper}>
      <section className={styles.hero}>
        <h1>About Blogsy</h1>
        <p>Your Space to Speak, Share, and Discover.</p>
      </section>

      <section className={styles.content}>
        <h2>Our Mission</h2>
        <p>
          In a world cluttered with noise, we believe in the power of the individual voice. 
          Blogsy was created to be a simple, elegant, and powerful platform for writers, thinkers, 
          and creators to share their stories with the world.
        </p>

        <h2>Our Vision</h2>
        <p>
          We envision a more connected and empathetic world, driven by the open exchange of ideas.
          Our goal is to build a community where diverse perspectives are celebrated.
        </p>
      </section>

      <section className={styles.creatorSection}>
        <h2>Meet the Creator</h2>
        <div className={styles.creatorCard}>
          <img 
            // --- STEP 2: Use the imported image variable ---
            // React's build process handles the rest.
            src={profilePic}
            alt="Arun" 
            className={styles.profilePicture} 
          />
          <div className={styles.creatorInfo}>
            <h3>Arun</h3>
            <p className={styles.creatorBio}>
              Full-stack developer with a passion for building beautiful, functional, and user-centric web applications. 
              This platform is a product of that passion, designed to be both a powerful tool and a joy to use.
            </p>
            <div className={styles.socials}>
              <a href="https://github.com/arunmm8335" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <FaGithub />
              </a>
              <a href="https://www.linkedin.com/in/arun-m-myageri-11909b254/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <FaLinkedin />
              </a>
              <a href="https://x.com/myageriarun1916" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <FaTwitter />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <h2>Join the Conversation</h2>
        <Link to="/register" className={styles.ctaButton}>Get Started</Link>
      </section>
    </div>
  );
};

export default AboutPage;