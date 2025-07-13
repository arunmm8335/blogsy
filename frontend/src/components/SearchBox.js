import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import './SearchBox.css';

const SearchBox = () => {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const submitHandler = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      // --- CHANGE THIS LINE ---
      // Navigate to /search and add the keyword as a query parameter
      navigate(`/search?q=${keyword.trim()}`);
      // -----------------------
      setKeyword('');
    }
  };

  return (
    <form onSubmit={submitHandler} className="search-box">
      <FiSearch className="search-icon" />
      <input
        type="text"
        name="q"
        onChange={(e) => setKeyword(e.target.value)}
        value={keyword}
        placeholder="Search..."
        className="search-input"
        autoComplete="off"
      />
    </form>
  );
};

export default SearchBox;