import { useEffect, useRef } from 'react';

export function usePolling(callback: () => void | Promise<void>, interval: number = 5000, enabled: boolean = true) {
  const savedCallback = useRef<() => void | Promise<void>>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    // Call immediately
    tick();

    // Then set up interval
    const id = setInterval(tick, interval);

    return () => clearInterval(id);
  }, [interval, enabled]);
}
