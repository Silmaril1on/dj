"use client";

import { useState, useCallback } from "react";

const DEFAULT_LIMIT = 30;

// Helper to deduplicate data by ID
const deduplicateData = (existingData, newData) => {
  const existingIds = new Set(
    existingData.map((item) => item.id).filter(Boolean),
  );
  const uniqueNewData = newData.filter((item) => {
    if (!item.id) return true; // Keep items without ID (though this shouldn't happen)
    if (existingIds.has(item.id)) return false; // Skip duplicates
    existingIds.add(item.id);
    return true;
  });
  return [...existingData, ...uniqueNewData];
};

const usePagination = ({
  initialData = [],
  limit = DEFAULT_LIMIT,
  fetchPage,
  initialHasMore,
  onError,
}) => {
  const [data, setData] = useState(initialData);
  const [offset, setOffset] = useState(initialData.length);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(
    typeof initialHasMore === "boolean"
      ? initialHasMore
      : initialData.length === limit,
  );

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || typeof fetchPage !== "function") return;
    setLoading(true);
    try {
      const result = await fetchPage({ limit, offset });
      const newData = result?.data || [];
      const nextOffset = offset + newData.length;

      // Deduplicate data before adding
      setData((prev) => deduplicateData(prev, newData));
      setOffset(nextOffset);

      if (typeof result?.hasMore === "boolean") {
        setHasMore(result.hasMore);
      } else if (typeof result?.total === "number") {
        setHasMore(nextOffset < result.total);
      } else {
        setHasMore(newData.length === limit);
      }
    } catch (err) {
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchPage, hasMore, limit, loading, offset, onError]);

  // Reset pagination - used when filters change
  const reset = useCallback(
    async (newInitialData = []) => {
      setData(newInitialData);
      setOffset(newInitialData.length);
      setHasMore(
        typeof initialHasMore === "boolean"
          ? initialHasMore
          : newInitialData.length === limit,
      );
      setLoading(false);
    },
    [limit, initialHasMore],
  );

  return {
    data,
    setData,
    offset,
    setOffset,
    loading,
    setLoading,
    hasMore,
    setHasMore,
    loadMore,
    reset,
  };
};

export default usePagination;
