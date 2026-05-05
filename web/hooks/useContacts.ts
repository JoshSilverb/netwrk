import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { QUERY_KEYS } from '@/constants/queryKeys';
import type { Contact, ContactPayload } from '@/types';

interface SearchParams {
  q?: string;
  sort?: string;
  tags?: string[];
  afterDate?: string;
  beforeDate?: string;
}

export function useContacts(params: SearchParams = {}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CONTACTS, params],
    queryFn: async () => {
      const { data } = await api.post<Contact[]>('/searchContacts', {
        search_params: {
          query_string: params.q ?? '',
          order_by: params.sort ?? 'Date added',
          tags: params.tags ?? [],
          lower_bound_date: params.afterDate ?? '1900-01-01',
          upper_bound_date: params.beforeDate ?? '2100-12-31',
        },
      });
      return data;
    },
  });
}

export function useContact(id: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.CONTACT(id!),
    queryFn: async () => {
      const { data } = await api.post<Contact>('/getContactById', { contact_id: id });
      return data;
    },
    enabled: id !== null,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ContactPayload) => {
      const { data } = await api.post('/addContactForUser', { newContact: payload });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CONTACTS });
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ContactPayload & { contact_id: number }) => {
      const { contact_id, ...rest } = payload;
      const { data } = await api.post('/updateContactForUser', {
        newContact: { contact_id, ...rest },
      });
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CONTACTS });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CONTACT(vars.contact_id) });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact_id: number) => {
      await api.post('/removeContactForUser', { contact_id });
      return contact_id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CONTACTS });
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data } = await api.post<string[]>('/getTagsForUser', {});
      return data;
    },
  });
}
