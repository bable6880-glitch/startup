import { useState, useEffect, useCallback, useRef } from 'react';
import useSWR, { SWRConfiguration } from 'swr';

interface UseSafeQueryOptions<T> extends SWRConfiguration {
  key: string | null;
  fetcher: () => Promise<T>;
}

export function useSafeQuery<T>({ key, fetcher, ...swrOptions }: UseSafeQueryOptions<T>) {
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = useCallback(() => {
    setCooldownSeconds(60);
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const safeFetcher = useCallback(async () => {
    try {
      const data = await fetcher();
      // On success, reset attempts and cooldown
      setAttemptCount(0);
      setCooldownSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return data;
    } catch (err: any) {
      if (err instanceof Response && err.status === 429) {
        startCooldown();
        throw err;
      }
      
      // Attempt manual backoff calculation for other repeated failures,
      // though for 429 we explicitly lock for 60s
      setAttemptCount(prev => prev + 1);
      throw err;
    }
  }, [fetcher, startCooldown]);

  const { data, error, isLoading, mutate } = useSWR<T>(
    cooldownSeconds > 0 ? null : key, // pause fetching during cooldown
    safeFetcher,
    {
      refreshInterval: 0,          // NO polling by default
      revalidateOnFocus: false,    // prevents refetch on tab switch
      revalidateOnReconnect: true, // reconnect = yes
      shouldRetryOnError: false,   // WE handle retries manually or disable auto-retry
      errorRetryCount: 0,
      ...swrOptions,
    }
  );

  const retry = useCallback(async () => {
    if (cooldownSeconds > 0) return;
    
    // Manual exponential backoff for immediate retries
    const delay = attemptCount === 1 ? 2000 :
                  attemptCount === 2 ? 8000 :
                  attemptCount === 3 ? 30000 :
                  attemptCount >= 4 ? 60000 : 0;
    
    if (delay === 60000 && attemptCount >= 4) {
      startCooldown();
      return;
    }
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return mutate();
  }, [cooldownSeconds, attemptCount, startCooldown, mutate]);

  return {
    data,
    error,
    isLoading,
    retry,
    cooldownSeconds
  };
}
