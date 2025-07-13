import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  const styles = {
    container: {
      textAlign: 'center',
      padding: '50px 20px',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'var(--text-color)'
    },
    title: {
      fontSize: '6rem',
      fontWeight: 'bold',
      margin: '0',
      color: 'var(--primary-color)',
    },
    subtitle: {
      fontSize: '1.5rem',
      margin: '0 0 20px 0',
    },
    text: {
      marginBottom: '30px',
    },
    link: {
      padding: '10px 20px',
      backgroundColor: 'var(--primary-color)',
      color: 'var(--button-text-color)',
      textDecoration: 'none',
      borderRadius: '8px',
      fontWeight: 'bold',
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>404</h1>
      <h2 style={styles.subtitle}>Page Not Found</h2>
      <p style={styles.text}>Sorry, the page you are looking for does not exist.</p>
      <Link to="/" style={styles.link}>Go Back Home</Link>
    </div>
  );
};

export default NotFoundPage;