export const QUERY_KEYS = {
  CONTACTS: ['contacts'] as const,
  CONTACT: (id: number) => ['contacts', id] as const,
  CURRENT_USER: ['currentUser'] as const,
  USER_SEARCH: (q: string) => ['users', 'search', q] as const,
  USER_BY_ID: (id: string) => ['users', id] as const,
};
