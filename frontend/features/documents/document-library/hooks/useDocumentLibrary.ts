import { useDocuments, useCategoriesPaginated } from '@/features/documents/hooks/useMasterDocuments';
import { documentsApi } from '@/lib/services';
import type { Document, DocumentCategory, Category } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { formatFileSize } from '../utils';

export const useDocumentLibrary = () => {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10); // Fixed size for now

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(0); // Reset page on search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleCategorySelect = (category: DocumentCategory | null) => {
    setSelectedCategory(category);
    setPage(0);
  };

  // 1. Fetch Categories (Paginated)
  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    fetchNextPage: loadMoreCategories,
    hasNextPage: hasMoreCategories,
    isFetchingNextPage: isFetchingMoreCategories
  } = useCategoriesPaginated(12); // Use 12 for better grid layout

  const categories = categoriesData?.pages.flatMap(page => page.items) || [];

  // 2. Decide what to fetch: Search Mode vs Browse Mode
  const isSearchMode = !!debouncedSearchQuery;

  // Query for Browse Mode (Paginated)
  const {
    data: paginatedData,
    isLoading: cancelLoading,
    refetch: loadDocuments
  } = useDocuments(page, pageSize, selectedCategory || undefined);

  // Query for Search Mode (Paginated)
  const {
    data: searchResults,
    isLoading: isSearchLoading
  } = useQuery({
    queryKey: ['documents', 'search', debouncedSearchQuery, selectedCategory, page, pageSize],
    queryFn: () => documentsApi.search(debouncedSearchQuery, selectedCategory || undefined, page, pageSize),
    enabled: isSearchMode,
  });

  // 3. Unify Data Shape
  const documents = isSearchMode ? (searchResults?.content || []) : (paginatedData?.content || []);
  const totalPages = isSearchMode ? (searchResults?.totalPages || 0) : (paginatedData?.totalPages || 0);
  const totalElements = isSearchMode ? (searchResults?.totalElements || 0) : (paginatedData?.totalElements || 0);

  // 4. Stats
  const { data: statsData } = useQuery({
    queryKey: ['documents', 'stats'],
    queryFn: documentsApi.getStats,
    staleTime: 60000
  });

  // Chuẩn hóa thống kê theo category để khớp với code của Category
  let categoryCounts: Record<string, number> = statsData?.categoryStats || {};

  if (categories.length && Object.keys(categoryCounts).length) {
    const sampleKey = Object.keys(categoryCounts)[0];
    const isNumericKey = !Number.isNaN(Number(sampleKey));

    // Nếu backend trả về key theo categoryId (dạng số), ánh xạ sang category.code
    if (isNumericKey) {
      const mapped: Record<string, number> = {};
      for (const cat of categories) {
        const value = categoryCounts[String(cat.id)];
        if (value != null) {
          mapped[cat.code] = value;
        }
      }
      categoryCounts = mapped;
    }
  }

  const stats = {
    total: statsData?.totalDocuments || 0,
    downloads: statsData?.totalDownloads || 0,
    size: statsData?.formattedTotalSize || '0 B',
    categoryCounts
  };

  const loadCategoryDocuments = loadDocuments; // Alias

  return {
    documents,
    categories,
    selectedCategory,
    setSelectedCategory: handleCategorySelect,
    categoryDocs: documents,
    searchQuery,
    setSearchQuery,
    loading: (cancelLoading && !isSearchMode) || (isSearchMode && isSearchLoading),
    stats,
    page,
    setPage,
    totalPages,
    totalElements,
    loadDocuments,
    loadCategoryDocuments,
    isSearchMode,
    isCategoriesLoading,
    loadMoreCategories,
    hasMoreCategories,
    isFetchingMoreCategories
  };
};