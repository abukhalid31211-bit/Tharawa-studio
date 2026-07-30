/**
 * Tharwah Capital - TanStack Query Hooks
 * Backend-only data fetching with Socket.io realtime invalidation
 */
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

// Generic realtime invalidation hook
export function useRealtimeInvalidation(queryKey: any[], eventName: string = 'tharwah_admin_update') {
  const queryClient = useQueryClient();
  const stableKey = JSON.stringify(queryKey);

  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: JSON.parse(stableKey) });
    };

    window.addEventListener(eventName, handler as EventListener);
    return () => window.removeEventListener(eventName, handler as EventListener);
  }, [queryClient, stableKey, eventName]);
}

// Auth
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getProfile(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

// Clients
export function useClients(params?: Record<string, string>) {
  const query = useQuery({
    queryKey: ['clients', params],
    queryFn: () => api.getClients(params),
    staleTime: 30 * 1000,
  });
  useRealtimeInvalidation(['clients'], 'tharwah_admin_update');
  return query;
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => api.getClient(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createClient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateClient(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteClient,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

// Portfolios
export function usePortfolios(params?: Record<string, string>) {
  const query = useQuery({
    queryKey: ['portfolios', params],
    queryFn: () => api.getPortfolios(params),
    staleTime: 30 * 1000,
  });
  useRealtimeInvalidation(['portfolios'], 'tharwah_admin_update');
  useRealtimeInvalidation(['portfolios'], 'tharwah_client_update');
  return query;
}

export function usePortfolio(id: string) {
  return useQuery({
    queryKey: ['portfolios', id],
    queryFn: () => api.getPortfolio(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPortfolio,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolios'] }),
  });
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updatePortfolio(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portfolios'] }),
  });
}

// Transactions
export function useTransactions(params?: Record<string, string>) {
  const query = useQuery({
    queryKey: ['transactions', params],
    queryFn: () => api.getTransactions(params),
    staleTime: 30 * 1000,
  });
  useRealtimeInvalidation(['transactions'], 'tharwah_admin_update');
  useRealtimeInvalidation(['transactions'], 'tharwah_client_update');
  return query;
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTransaction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateTransaction(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

// Messages / Support tickets
export function useMessages() {
  const query = useQuery({
    queryKey: ['messages'],
    queryFn: () => api.getMessages(),
    staleTime: 30 * 1000,
  });
  useRealtimeInvalidation(['messages'], 'tharwah_admin_update');
  useRealtimeInvalidation(['messages'], 'tharwah_client_update');
  return query;
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createMessage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateMessage(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
  });
}

// Notifications
export function useNotifications() {
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    staleTime: 30 * 1000,
  });
  useRealtimeInvalidation(['notifications'], 'tharwah_admin_update');
  useRealtimeInvalidation(['notifications'], 'tharwah_client_update');
  return query;
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createNotification,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// Meetings
export function useMeetings() {
  const query = useQuery({
    queryKey: ['meetings'],
    queryFn: () => api.getMeetings(),
    staleTime: 30 * 1000,
  });
  useRealtimeInvalidation(['meetings'], 'tharwah_admin_update');
  useRealtimeInvalidation(['meetings'], 'tharwah_client_update');
  return query;
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createMeeting,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
}

// Sub-admins
export function useSubAdmins() {
  const query = useQuery({
    queryKey: ['sub-admins'],
    queryFn: () => api.getSubAdmins(),
    staleTime: 30 * 1000,
  });
  useRealtimeInvalidation(['sub-admins'], 'tharwah_admin_update');
  return query;
}

export function useCreateSubAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createSubAdmin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sub-admins'] }),
  });
}

export function useUpdateSubAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateSubAdmin(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sub-admins'] }),
  });
}

// Content / CMS
export function useContent(key: string) {
  const query = useQuery({
    queryKey: ['content', key],
    queryFn: () => api.getContent(key),
    staleTime: 60 * 1000,
  });
  useRealtimeInvalidation(['content', key], 'tharwah_content_updated');
  return query;
}

export function useAllContent() {
  const query = useQuery({
    queryKey: ['content'],
    queryFn: () => api.getAllContent ? api.getAllContent() : Promise.resolve({ data: [] }),
    staleTime: 30 * 1000,
  });
  useRealtimeInvalidation(['content'], 'tharwah_content_updated');
  return query;
}

export function useUpdateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: any }) => api.updateContent(key, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content', variables.key] });
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

// Settings
export function useSettings() {
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
    staleTime: 60 * 1000,
  });
  useRealtimeInvalidation(['settings'], 'tharwah_settings_updated');
  return query;
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value, description }: { key: string; value: any; description?: string }) =>
      api.updateSettings(key, { value, description }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
}

// Audit
export function useAuditLogs(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: () => api.getAuditLogs(params),
    staleTime: 30 * 1000,
  });
}

// Markets
export function useMarketsTicker() {
  return useQuery({
    queryKey: ['markets', 'ticker'],
    queryFn: () => api.getMarketsTicker(),
    staleTime: 60 * 1000,
  });
}

export function usePublicStats() {
  return useQuery({
    queryKey: ['public-stats'],
    queryFn: () => api.getPublicStats(),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

// Admin Stats — real aggregated data powering Overview.tsx charts
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats-overview'],
    queryFn: () => api.getAdminStats(),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

// Reports — server-side aggregated summaries and paginated data
export function useReportsSummary(period?: string) {
  return useQuery({
    queryKey: ['reports-summary', period],
    queryFn: () => api.getReportsSummary(period),
    staleTime: 60 * 1000,
  });
}

export function useReportsClients(page?: number, limit?: number) {
  return useQuery({
    queryKey: ['reports-clients', page, limit],
    queryFn: () => api.getReportsClients(page, limit),
    staleTime: 30 * 1000,
  });
}

export function useReportsTransactions(period?: string, page?: number) {
  return useQuery({
    queryKey: ['reports-transactions', period, page],
    queryFn: () => api.getReportsTransactions(period, page),
    staleTime: 30 * 1000,
  });
}

// Sub-admins — delete mutation
export function useDeleteSubAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteSubAdmin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sub-admins'] }),
  });
}

// Meetings — update mutation
export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateMeeting(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });
}

// Global search
export function useGlobalSearch(q: string) {
  return useQuery({
    queryKey: ['search', q],
    queryFn: () => api.globalSearch(q),
    enabled: q.trim().length >= 2,
    staleTime: 30 * 1000,
  });
}
