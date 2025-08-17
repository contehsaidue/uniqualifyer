import { useCallback, useEffect, useRef, useState } from 'react';

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseFetchOptions extends RequestInit {
  params?: Record<string, string>;
  skipAutoFetch?: boolean;
  timeout?: number;
  overrideUrl?: string;
}

interface UseFetchResult<T> {
  data: T | null;
  error: string | null;
  status: FetchStatus;
  isLoading: boolean;
  refetch: (overrideOptions?: Partial<UseFetchOptions>) => Promise<{
    data: T | null;
    error: string | null;
    status: FetchStatus;
  }>;
  cancel: () => void;
}

export const useFetch = <T>(url: string, options: UseFetchOptions = {}): UseFetchResult<T> => {
  const [state, setState] = useState<{
    data: T | null;
    error: string | null;
    status: FetchStatus;
  }>({
    data: null,
    error: null,
    status: 'idle',
  });

  const optionsRef = useRef(options);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  useEffect(() => () => cancel(), [cancel]);

  const fetchData = useCallback(
    async (overrideOptions?: Partial<UseFetchOptions>) => {
      cancel();
      setState(prev => ({ ...prev, status: 'loading', error: null }));

      const finalOptions = { ...optionsRef.current, ...overrideOptions };
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const targetUrl = finalOptions.overrideUrl || url;
        const urlObj = new URL(
          targetUrl.startsWith('http') ? targetUrl : `/${targetUrl}`,
          window.location.origin
        );

        const method = finalOptions.method?.toUpperCase() || 'GET';

        if (method === 'GET' && finalOptions.params) {
          Object.entries(finalOptions.params).forEach(([key, value]) => {
            if (value) urlObj.searchParams.append(key, value);
          });
        }

        const headers = new Headers(finalOptions.headers);
        const { params, skipAutoFetch, timeout, ...fetchOptions } = finalOptions;

        if (['POST', 'PUT', 'PATCH'].includes(method) && finalOptions.body) {
          if (!headers.has('Content-Type')) {
            if (finalOptions.body instanceof FormData) {
              // Let browser set Content-Type with boundary
            } else if (finalOptions.body instanceof URLSearchParams) {
              headers.set('Content-Type', 'application/x-www-form-urlencoded');
            } else if (finalOptions.body instanceof Blob && finalOptions.body.type) {
              headers.set('Content-Type', finalOptions.body.type);
            } else if (typeof finalOptions.body === 'string') {
              headers.set('Content-Type', 'application/json');
            }
          }
        }

        let timeoutId: NodeJS.Timeout | undefined;
        if (timeout) {
          timeoutId = setTimeout(() => abortController.abort(), timeout);
        }

        const response = await fetch(urlObj.toString(), {
          ...fetchOptions,
          method,
          headers,
          body: finalOptions.body,
          credentials: finalOptions.credentials || 'include',
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (abortController.signal.aborted) {
          return { data: null, error: 'Request cancelled', status: 'error' as FetchStatus };
        }

        const contentType = response.headers.get('content-type');
        let result: T | null = null;

        if (contentType?.includes('application/json')) {
          result = await response.json();
        } else if (contentType?.includes('text/')) {
          result = (await response.text()) as unknown as T;
        }

        if (!response.ok) {
          const errorMessage = getErrorMessage(result, response);
          setState({ data: result, error: errorMessage, status: 'error' });
          return { data: result, error: errorMessage, status: 'error' as FetchStatus };
        }

        setState({ data: result, error: null, status: 'success' });
        return { data: result, error: null, status: 'success' as FetchStatus };
      } catch (err) {
        if (!abortController.signal.aborted) {
          const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
          setState(prev => ({ ...prev, error: errorMessage, status: 'error' }));
          return { data: null, error: errorMessage, status: 'error' as FetchStatus };
        }
        return { data: null, error: 'Request cancelled', status: 'error' as FetchStatus };
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    },
    [url, cancel],
  );

  useEffect(() => {
    const method = optionsRef.current.method?.toUpperCase() || 'GET';
    if (method === 'GET' && !optionsRef.current.skipAutoFetch) {
      fetchData();
    }
  }, [fetchData]);

  const refetch = useCallback(
    (overrideOptions?: Partial<UseFetchOptions>) => fetchData(overrideOptions),
    [fetchData],
  );

  return {
    ...state,
    isLoading: state.status === 'loading',
    refetch,
    cancel,
  };
};

function getErrorMessage(result: any, response: Response): string {
  if (result?.error) return result.error;
  if (result?.message) return result.message;
  return `HTTP ${response.status}: ${response.statusText}`;
}