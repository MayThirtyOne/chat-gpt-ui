import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './search.module'
import { classnames } from '../utils';
import { Icon } from '../Icon';
import { Button } from '../Button';


export function Search(props) {
  const { placeholder, onSearch, className, showButton } = props;
  const [query, setQuery] = useState('');

  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };

  const handleSearch = () => {
    onSearch && onSearch(query);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={classnames(styles.search, className)}>
      <div className={styles.inner}>
        <Icon className={styles.searchIcon} type="search" />
        <input
          className={styles.input}
          type="text"
          value={query}
          onChange={handleQueryChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
        />
      </div>
      {showButton && <Button type="primary" className={styles.button} onClick={handleSearch}>Search</Button>}
    </div>
  );
}

Search.propTypes = {
  placeholder: PropTypes.string,
  onSearch: PropTypes.func.isRequired,
  className: PropTypes.string,
  showButton: PropTypes.bool
};

Search.defaultProps = {
  placeholder: 'Search...',
  showButton: false
};
