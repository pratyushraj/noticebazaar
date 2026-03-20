"use client";

import { useState, useMemo } from 'react';

interface UsePaginationOptions {
  totalCount: number | null | undefined;
  pageSize?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  offset: number;
  handlePreviousPage: () => void;
  handleNextPage: () => void;
  setCurrentPage: (page: number) => void;
}

export const usePagination = (options: UsePaginationOptions): UsePaginationReturn => {
  const { totalCount, pageSize: defaultPageSize = 10 } = options;
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = defaultPageSize;

  const totalPages = useMemo(() => {
    if (totalCount === null || totalCount === undefined) return 1;
    return Math.ceil(totalCount / pageSize);
  }, [totalCount, pageSize]);

  const offset = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Reset current page if totalCount changes significantly (e.g., filter applied)
  // or if current page exceeds new totalPages
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (currentPage === 0 && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return {
    currentPage,
    pageSize,
    totalPages,
    offset,
    handlePreviousPage,
    handleNextPage,
    setCurrentPage,
  };
};