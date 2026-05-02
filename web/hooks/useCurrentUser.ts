import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants/queryKeys';
import type { User } from '@/types';

export function useCurrentUser() {
  return useQuery({
    queryKey: QUERY_KEYS.CURRENT_USER,
    queryFn: async () => {
      const { data } = await api.post<User>('/getUserDetails', {});
      return data;
    },
  });
}
