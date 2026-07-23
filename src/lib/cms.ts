/**
 * Tharwah Capital - CMS Helpers
 * Load content from backend API with local fallback
 */
import { useContent } from './queries';

export function useCmsSection<T = any>(key: string, fallback: T): { data: T; isLoading: boolean; error: any } {
  const { data, isLoading, error } = useContent(key);
  const sectionData = data?.data?.content_data || data?.data || fallback;
  return { data: sectionData as T, isLoading, error };
}
