import { useCallback, useState } from 'react';

/** Small typed localStorage hook; silently degrades in private mode. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  const update = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved =
          typeof next === 'function' ? (next as (c: T) => T)(current) : next;
        try {
          if (resolved === null || resolved === undefined)
            window.localStorage.removeItem(key);
          else window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          /* storage full or blocked - state still works for this session */
        }
        return resolved;
      });
    },
    [key],
  );

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setValue(initial);
  }, [initial, key]);

  return [value, update, clear] as const;
}
