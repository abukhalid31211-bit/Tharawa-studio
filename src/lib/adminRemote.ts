import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { logger } from './logger';
import type { Client, Portfolio, AdminTransaction, SupportMessage } from './adminData';

type Resource = 'clients' | 'portfolios' | 'transactions' | 'messages';

function seedFor<T>(seed: T[]): T[] {
  return import.meta.env.DEV ? seed : [];
}

async function fetchResource(resource: Resource): Promise<any[]> {
  const response = resource === 'clients' ? await api.getClients()
    : resource === 'portfolios' ? await api.getPortfolios()
    : resource === 'transactions' ? await api.getTransactions()
    : await api.getMessages();
  return response?.data || [];
}

function mapClient(user: any): Client {
  const profile = user.profile_data || {};
  const portfolio = user.portfolios?.[0];
  return {
    id: user.id, name: user.name, nameEn: profile.nameEn || user.name, email: user.email,
    phone: user.phone || '', nationalId: profile.nationalId || '—', country: profile.country || 'السعودية',
    countryEn: profile.countryEn || 'Saudi Arabia', city: profile.city || '—', tier: user.tier || 'Regular',
    status: user.status, balance: Number(profile.balance ?? portfolio?.total_valuation ?? 0),
    riskProfile: profile.riskProfile || 'متوازن', riskProfileEn: profile.riskProfileEn || 'Balanced',
    advisor: profile.advisor || '—', advisorEn: profile.advisorEn || '—',
    joinDate: user.created_at?.slice(0, 10) || '', lastActivity: user.updated_at || user.created_at || '', notes: profile.notes,
  };
}

function mapPortfolio(item: any): Portfolio {
  const data = item.portfolio_data || {};
  return {
    ...data, id: item.id, clientId: item.user_id, name: item.name, nameEn: item.name_en || item.name,
    strategy: data.strategy || '', strategyEn: data.strategyEn || '', risk: item.risk_profile,
    riskEn: data.riskEn || item.risk_profile, value: Number(item.total_valuation), growth: Number(item.growth_percent || 0),
    inception: item.inception_date?.slice(0, 10) || item.created_at?.slice(0, 10) || '',
    holdings: (item.assets || []).map((asset: any) => ({ symbol: asset.symbol, name: asset.name, nameEn: asset.name_en || asset.name,
      weight: Number(asset.weight_percent), value: Number(asset.valuation), change: Number(asset.annual_yield || 0) })),
    currency: item.currency, created_at: item.created_at, portfolio_data: item.portfolio_data,
  } as Portfolio;
}

function mapTransaction(item: any): AdminTransaction {
  return { id: item.id, clientId: item.user_id, type: item.type === 'withdrawal' ? 'withdraw' : item.type,
    amount: Number(item.amount), currency: item.currency, status: item.status, date: item.created_at?.slice(0, 16).replace('T', ' ') || '',
    method: item.method || '', note: item.notes || '', noteEn: item.notes || '' } as AdminTransaction;
}

function mapMessage(item: any): SupportMessage {
  return { id: item.id, clientId: item.user_id, subject: item.title, text: item.message,
    date: item.created_at?.slice(0, 16).replace('T', ' ') || '', status: item.status === 'pending' ? 'pending' : item.status === 'closed' ? 'closed' : 'answered',
    priority: item.priority, replies: (item.replies || (item.reply ? [{ sender_role: 'admin', message: item.reply, created_at: item.updated_at }] : []))
      .map((reply: any) => ({ from: reply.sender_role === 'client' ? 'client' : 'admin', text: reply.message, date: reply.created_at?.slice(0, 16).replace('T', ' ') || '' })) } as SupportMessage;
}

function mapResource(resource: Resource, items: any[]): any[] {
  return items.map(item => resource === 'clients' ? mapClient(item) : resource === 'portfolios' ? mapPortfolio(item) : resource === 'transactions' ? mapTransaction(item) : mapMessage(item));
}

async function syncClients(previous: Client[], next: Client[]) {
  const removed = previous.filter(item => !next.some(current => current.id === item.id));
  const added = next.filter(item => !previous.some(current => current.id === item.id));
  const changed = next.filter(item => previous.some(current => current.id === item.id && JSON.stringify(current) !== JSON.stringify(item)));
  await Promise.all([
    ...removed.map(item => api.deleteClient(item.id)),
    ...added.map(item => api.createClient({ email: item.email, name: item.name, phone: item.phone, tier: item.tier, status: item.status,
      profile_data: { nameEn: item.nameEn, nationalId: item.nationalId, country: item.country, countryEn: item.countryEn, city: item.city,
        balance: item.balance, riskProfile: item.riskProfile, riskProfileEn: item.riskProfileEn, advisor: item.advisor, advisorEn: item.advisorEn, notes: item.notes } })),
    ...changed.map(item => api.updateClient(item.id, { name: item.name, phone: item.phone, tier: item.tier, status: item.status,
      profile_data: { nameEn: item.nameEn, nationalId: item.nationalId, country: item.country, countryEn: item.countryEn, city: item.city,
        balance: item.balance, riskProfile: item.riskProfile, riskProfileEn: item.riskProfileEn, advisor: item.advisor, advisorEn: item.advisorEn, notes: item.notes } })),
  ]);
}

async function syncPortfolios(previous: Portfolio[], next: Portfolio[]) {
  const removed = previous.filter(item => !next.some(current => current.id === item.id));
  const added = next.filter(item => !previous.some(current => current.id === item.id));
  const changed = next.filter(item => previous.some(current => current.id === item.id && JSON.stringify(current) !== JSON.stringify(item)));
  await Promise.all([
    ...removed.map(item => api.deletePortfolio(item.id)),
    ...added.map(item => api.createPortfolio({ user_id: item.clientId, name: item.name, name_en: item.nameEn, total_valuation: item.value,
      risk_profile: item.risk, growth_percent: item.growth, portfolio_data: { ...(item as any).portfolio_data, strategy: item.strategy, strategyEn: item.strategyEn, riskEn: item.riskEn },
      assets: item.holdings.map(asset => ({ symbol: asset.symbol, name: asset.name, name_en: asset.nameEn, asset_class: 'advisory', weight_percent: asset.weight, valuation: asset.value, annual_yield: asset.change })) })),
    ...changed.map(item => api.updatePortfolio(item.id, { name: item.name, name_en: item.nameEn, total_valuation: item.value,
      risk_profile: item.risk, growth_percent: item.growth, portfolio_data: { ...(item as any).portfolio_data, strategy: item.strategy, strategyEn: item.strategyEn, riskEn: item.riskEn } })),
  ]);
}

async function syncTransactions(previous: AdminTransaction[], next: AdminTransaction[]) {
  const added = next.filter(item => !previous.some(current => current.id === item.id));
  const changed = next.filter(item => previous.some(current => current.id === item.id && JSON.stringify(current) !== JSON.stringify(item)));
  await Promise.all([
    ...added.map(item => api.createTransaction({ user_id: item.clientId, type: item.type, amount: item.amount, currency: item.currency, method: item.method, notes: item.note })),
    ...changed.map(item => api.updateTransaction(item.id, { status: item.status, notes: item.note })),
  ]);
}

async function syncMessages(previous: SupportMessage[], next: SupportMessage[]) {
  const changed = next.filter(item => previous.some(current => current.id === item.id && JSON.stringify(current) !== JSON.stringify(item)));
  await Promise.all(changed.map(item => {
    const old = previous.find(previousItem => previousItem.id === item.id);
    const latestReply = item.replies.length > (old?.replies.length || 0) ? item.replies[item.replies.length - 1]?.text : undefined;
    return api.updateMessage(item.id, { status: item.status, reply: latestReply });
  }));
}

export function useRemoteCollection<T>(resource: Resource, developmentSeed: T[]): [T[], (value: T[] | ((previous: T[]) => T[])) => void] {
  const [items, setItems] = useState<T[]>(() => seedFor(developmentSeed));
  const refresh = useCallback(() => {
    void fetchResource(resource).then(data => setItems(mapResource(resource, data) as T[])).catch(error => logger.error(`Failed to load ${resource}`, error));
  }, [resource]);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('tharwah_admin_update', handler);
    window.addEventListener('tharwah_client_update', handler);
    return () => { window.removeEventListener('tharwah_admin_update', handler); window.removeEventListener('tharwah_client_update', handler); };
  }, [refresh]);

  const set = useCallback((value: T[] | ((previous: T[]) => T[])) => {
    setItems(previous => {
      const next = typeof value === 'function' ? (value as (previous: T[]) => T[])(previous) : value;
      const operation = resource === 'clients' ? syncClients(previous as Client[], next as Client[])
        : resource === 'portfolios' ? syncPortfolios(previous as Portfolio[], next as Portfolio[])
        : resource === 'transactions' ? syncTransactions(previous as AdminTransaction[], next as AdminTransaction[])
        : syncMessages(previous as SupportMessage[], next as SupportMessage[]);
      void operation.then(refresh).catch(error => { logger.error(`Failed to update ${resource}`, error); refresh(); });
      return next;
    });
  }, [resource, refresh]);

  return [items, set];
}
