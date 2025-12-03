// src/hooks/usePerformanceOptimizations.js
import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Debounce hook for search inputs and other user interactions
 * @param {string} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {string} - The debounced value
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Pagination hook for handling large datasets
 * @param {number} totalItems - Total number of items
 * @param {number} itemsPerPage - Number of items per page
 * @returns {object} - Pagination state and handlers
 */
export const usePagination = (totalItems, itemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const goToPage = useCallback((page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const changePageSize = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

/**
 * Infinite scroll hook for loading data as user scrolls
 * @param {Function} fetchMore - Function to fetch more data
 * @param {boolean} hasMore - Whether there's more data to load
 * @returns {object} - Infinite scroll state and handlers
 */
export const useInfiniteScroll = (fetchMore, hasMore) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      await fetchMore();
    } catch (err) {
      setError(err.message || 'Failed to load more data');
    } finally {
      setLoading(false);
    }
  }, [fetchMore, hasMore, loading]);

  return {
    loading,
    error,
    loadMore,
    hasMore,
  };
};

/**
 * Optimized search hook with caching and debouncing
 * @param {Function} searchFunction - Function to perform search
 * @param {number} debounceDelay - Debounce delay in milliseconds
 * @returns {object} - Search state and handlers
 */
export const useOptimizedSearch = (searchFunction, debounceDelay = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);

  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);

  const performSearch = useCallback(async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const results = await searchFunction(term);
      setSearchResults(results);
    } catch (err) {
      setError(err.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchFunction]);

  useEffect(() => {
    performSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, performSearch]);

  return {
    searchTerm,
    setSearchTerm,
    isSearching,
    searchResults,
    error,
    hasResults: searchResults.length > 0,
  };
};

/**
 * Data fetching hook with caching and error handling
 * @param {Function} fetchFunction - Function to fetch data
 * @param {Array} dependencies - Dependencies for useEffect
 * @returns {object} - Data fetching state
 */
export const useDataFetching = (fetchFunction, dependencies = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction();
      setData(result);
      setLastFetch(Date.now());
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    fetchData();
  }, dependencies);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    lastFetch,
    hasData: data.length > 0,
  };
};

/**
 * Filter hook for complex filtering logic
 * @param {Array} data - Data to filter
 * @param {Object} filters - Filter criteria
 * @returns {Array} - Filtered data
 */
export const useFilters = (data, filters) => {
  const filteredData = useMemo(() => {
    if (!data || !filters) return data || [];

    return data.filter(item => {
      // Status filter
      if (filters.status && item.isActive !== (filters.status === 'active')) {
        return false;
      }

      // Role filter
      if (filters.role && item.role !== filters.role) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const itemDate = new Date(item.createdAt);
        const { start, end } = filters.dateRange;

        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
      }

      // Custom filters
      if (filters.custom) {
        for (const [key, value] of Object.entries(filters.custom)) {
          if (item[key] !== value) return false;
        }
      }

      return true;
    });
  }, [data, filters]);

  return filteredData;
};

/**
 * Sort hook for data sorting
 * @param {Array} data - Data to sort
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order ('asc' or 'desc')
 * @returns {Array} - Sorted data
 */
export const useSort = (data, sortBy = 'createdAt', sortOrder = 'desc') => {
  const sortedData = useMemo(() => {
    if (!data || !sortBy) return data || [];

    return [...data].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle nested properties
      if (sortBy.includes('.')) {
        aValue = sortBy.split('.').reduce((obj, key) => obj?.[key], a);
        bValue = sortBy.split('.').reduce((obj, key) => obj?.[key], b);
      }

      // Handle dates
      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();

      // Handle strings (case-insensitive)
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortBy, sortOrder]);

  return sortedData;
};

/**
 * Selection hook for handling bulk operations
 * @param {Array} items - Items that can be selected
 * @returns {object} - Selection state and handlers
 */
export const useSelection = (items = []) => {
  const [selectedIds, setSelectedIds] = useState(new Set());

  const isSelected = useCallback((id) => selectedIds.has(id), [selectedIds]);

  const toggleSelection = useCallback((id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item._id || item.id)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [selectedIds.size, items.length, clearSelection, selectAll]);

  return {
    selectedIds: Array.from(selectedIds),
    isSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleAll,
    hasSelection: selectedIds.size > 0,
    selectedCount: selectedIds.size,
    isAllSelected: items.length > 0 && selectedIds.size === items.length,
  };
};
