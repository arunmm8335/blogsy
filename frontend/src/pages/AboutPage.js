import React from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import styles from './AboutPage.module.css';
import profilePic from '../assets/my-photo.jpg';

const AboutPage = () => {
  const { user } = useAuth();

  return (
    <div className={styles.wrapper}>
      <section className={styles.hero}>
        <h1>About Blogsy</h1>
        <p>A modern publishing space where ideas become conversations.</p>
      </section>

      <section className={styles.content}>
        <h2>What Blogsy Is</h2>
        <p>
          Blogsy is a full-stack blogging platform built for writers who want a clean publishing
          workflow and readers who want focused content without noise. Create posts, save drafts,
          add media, and engage through comments and likes.
        </p>

        <h2>What You Can Do Here</h2>
        <p>
          Every account can publish stories, manage drafts, edit profile details, and build a
          personal reading and writing rhythm. The platform is designed to stay fast, responsive,
          and straightforward across desktop and mobile.
        </p>

        <h2>Current Direction</h2>
        <p>
          Blogsy is currently focused on quality writing tools and a polished dark-first experience.
          The roadmap includes stronger discovery, richer social interactions, and broader community
          features as more creators join.
        </p>
      </section>

      <section className={styles.creatorSection}>
        <h2>Meet the Creator</h2>
        <div className={styles.creatorCard}>
          <img
            src={profilePic}
            alt="Arun"
            className={styles.profilePicture}
          />
          <div className={styles.creatorInfo}>
            <h3>Arun</h3>
            <p className={styles.creatorBio}>
              Full-stack developer focused on building thoughtful products with clear UX and reliable
              engineering. Blogsy is built to give creators a practical place to publish and grow.
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
        <h2>Ready to Publish?</h2>
        <Link to={user ? '/posts/create' : '/register'} className={styles.ctaButton}>
          {user ? 'Create Post' : 'Create Your Account'}
        </Link>
      </section>
    </div>
  );
};

export default AboutPage;