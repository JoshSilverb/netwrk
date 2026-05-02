export const QUERY_KEYS = {
  CONTACTS: ['contacts'] as const,
  CONTACT: (id: number) => ['contacts', id] as const,
  CURRENT_USER: ['currentUser'] as const,
};
