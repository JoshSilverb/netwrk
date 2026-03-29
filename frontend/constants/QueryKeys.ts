export const queryKeys = {
  contacts: (params: object) => ['contacts', params] as const,
  contact:  (id: string)     => ['contact', id]      as const,
  tags:     ()               => ['tags']              as const,
  user:     ()               => ['user']              as const,
};
