import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // data never auto-stales — only invalidateQueries() marks it dirty
      retry: 1,
      gcTime: 10 * 60 * 1000,
    },
  },
});
