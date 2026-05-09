'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { UserSearchResult, LinkedUserProfile } from '@/types';
import { getToken } from '@/lib/auth';

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: QUERY_KEYS.USER_SEARCH(query),
    queryFn: async (): Promise<UserSearchResult[]> => {
      if (!query) return [];
      const token = getToken();
      const res = await api.get<UserSearchResult[]>(
        `/searchUsers?q=${encodeURIComponent(query)}&user_token=${encodeURIComponent(token ?? '')}`
      );
      return res.data;
    },
    enabled: query.length >= 1,
    staleTime: 30_000,
  });
}

export function useUserById(userId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.USER_BY_ID(userId ?? ''),
    queryFn: async (): Promise<LinkedUserProfile> => {
      const res = await api.post<LinkedUserProfile>('/getUserById', { user_id: userId });
      return res.data;
    },
    enabled: !!userId,
  });
}
