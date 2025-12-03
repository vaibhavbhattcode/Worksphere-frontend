// Custom hook for API calls with loading, error, and data state management
import { useState, useEffect, useCallback } from 'react';
import { handleApiError } from '../services/apiService';

/**
 * Generic hook for making API calls with automatic state management
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, loading, error, refetch, setData }
 */
export const useApi = (apiFunction, options = {}) => {
  const { 
    immediate = true, 
    initialData = null,
    onSuccess = null,
    onError = null,
    dependencies = []
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiFunction(...args);
      const result = response.data;
      
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return { success: true, data: result };
    } catch (err) {
      const errorResult = handleApiError(err);
      setError(errorResult.message);
      
      if (onError) {
        onError(errorResult);
      }
      
      return errorResult;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
    setData,
    setError,
  };
};

/**
 * Hook for making API calls with manual trigger (not immediate)
 */
export const useLazyApi = (apiFunction, options = {}) => {
  return useApi(apiFunction, { ...options, immediate: false });
};

/**
 * Hook for paginated API calls
 */
export const usePaginatedApi = (apiFunction, options = {}) => {
  const { 
    initialPage = 1, 
    initialLimit = 10,
    onSuccess,
    onError 
  } = options;

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const wrappedApiFunction = useCallback(
    () => apiFunction({ page, limit }),
    [apiFunction, page, limit]
  );

  const handleSuccess = useCallback((result) => {
    if (result.pagination) {
      setTotalPages(result.pagination.totalPages || 0);
      setTotalItems(result.pagination.totalItems || 0);
    }
    if (onSuccess) {
      onSuccess(result);
    }
  }, [onSuccess]);

  const { data, loading, error, execute, setData } = useApi(wrappedApiFunction, {
    immediate: true,
    dependencies: [page, limit],
    onSuccess: handleSuccess,
    onError,
  });

  const nextPage = useCallback(() => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  }, [page, totalPages]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  return {
    data,
    loading,
    error,
    page,
    limit,
    totalPages,
    totalItems,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    goToPage,
    refetch: execute,
    setData,
  };
};

export default useApi;
