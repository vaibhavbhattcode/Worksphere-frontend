// Custom hook for infinite scrolling
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for implementing infinite scroll functionality
 * @param {Function} fetchMore - Function to fetch more data
 * @param {Object} options - Configuration options
 * @returns {Object} - { loading, hasMore, items, loadMore, reset, observerTarget }
 */
export const useInfiniteScroll = (fetchMore, options = {}) => {
  const {
    initialPage = 1,
    threshold = 0.5, // Trigger when 50% from bottom
  } = options;

  const [page, setPage] = useState(initialPage);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const result = await fetchMore(page);
      
      const newItems = result.data || result.items || result;
      const noMoreData = newItems.length === 0;
      
      setItems(prev => [...prev, ...newItems]);
      setHasMore(!noMoreData);
      
      if (!noMoreData) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading more items:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, fetchMore]);

  // Intersection Observer for automatic loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMore, hasMore, loading, threshold]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setItems([]);
    setHasMore(true);
  }, [initialPage]);

  return {
    loading,
    hasMore,
    items,
    setItems,
    loadMore,
    reset,
    observerTarget,
  };
};

export default useInfiniteScroll;
