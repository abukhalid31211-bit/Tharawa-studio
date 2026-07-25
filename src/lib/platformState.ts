import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { logger } from './logger';

function emptyLike<T>(value: T): T {
  if (Array.isArray(value)) return [] as T;
  if (value && typeof value === 'object') return {} as T;
  return value;
}

export function usePlatformDataState<T>(key: string, developmentSeed: T): [T, (value: T | ((previous: T) => T)) => void, () => void] {
  const initialValue = useMemo(() => (import.meta.env.DEV ? developmentSeed : emptyLike(developmentSeed)), [developmentSeed]);
  const [value, setValue] = useState<T>(initialValue);

  const refresh = useCallback(() => {
    void api.getPlatformData(key)
      .then((response: any) => {
        if (response?.data !== undefined && response?.data !== null) {
          setValue(response.data as T);
          return;
        }
        setValue(initialValue);
      })
      .catch((error) => {
        logger.error(`Failed to load platform data for ${key}`, error);
        if (import.meta.env.DEV) setValue(initialValue);
      });
  }, [initialValue, key]);

  useEffect(() => {
    refresh();
    const handler = (event: Event) => {
      const changedKey = (event as CustomEvent<any>).detail?.data?.data?.key;
      if (!changedKey || changedKey === key) refresh();
    };
    window.addEventListener('tharwah_admin_update', handler);
    return () => window.removeEventListener('tharwah_admin_update', handler);
  }, [key, refresh]);

  const update = useCallback((nextValue: T | ((previous: T) => T)) => {
    setValue((previous) => {
      const next = typeof nextValue === 'function' ? (nextValue as (previous: T) => T)(previous) : nextValue;
      void api.updatePlatformData(key, next)
        .catch((error) => {
          logger.error(`Failed to persist platform data for ${key}`, error);
          refresh();
        });
      return next;
    });
  }, [key, refresh]);

  return [value, update, refresh];
}
