// In /src/components/Pagination.js
import React from 'react';
import './Pagination.css';

const Pagination = ({ pages, currentPage, onPageChange }) => {
  // Don't render pagination if there's only one page or no pages
  if (pages <= 1) {
    return null;
  }

  // Create an array of page numbers to map over
  const pageNumbers = [...Array(pages).keys()].map(i => i + 1);

  return (
    <nav>
      <ul className="pagination">
        {pageNumbers.map(number => (
          <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
            <button onClick={() => onPageChange(number)} className="page-link">
              {number}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Pagination;