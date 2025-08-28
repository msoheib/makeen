import { useState, useEffect } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface ApiResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

interface UseApiOptions {
  timeoutMs?: number;
}

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>> | Promise<T>,
  dependencies: any[] = [],
  options: UseApiOptions = {}
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = { current: true } as { current: boolean };

  const fetchData = async () => {
    try {
      if (mountedRef.current) setLoading(true);
      if (mountedRef.current) setError(null);
      
      // Add timeout handling - configurable per call (default 30s)
      const timeoutMs = options.timeoutMs ?? 30000;
      let timeoutId: any;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`API call timed out after ${timeoutMs} ms`)), timeoutMs);
      });
      
      const response = await Promise.race([apiCall(), timeoutPromise]);
      clearTimeout(timeoutId);
      
      // Check if response is in ApiResponse format
      if (response && typeof response === 'object' && 'data' in response && 'error' in response) {
        const apiResponse = response as ApiResponse<T>;
        if (apiResponse.error) {
          if (mountedRef.current) setError(apiResponse.error.message);
          if (mountedRef.current) setData(null);
        } else {
          if (mountedRef.current) setData(apiResponse.data);
          if (mountedRef.current) setError(null);
        }
      } else {
        // Direct data response
        if (mountedRef.current) setData(response as T);
        if (mountedRef.current) setError(null);
      }
    } catch (err: any) {
      if (mountedRef.current) setError(err.message || 'An unexpected error occurred');
      if (mountedRef.current) setData(null);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

// Specialized hook for API mutations (create, update, delete)
export function useApiMutation<T, P = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (
    apiCall: (params: P) => Promise<ApiResponse<T>>
  ): Promise<{ data: T | null; error: string | null }> => {
    try {
      setLoading(true);
      setError(null);
      
      return (params: P) => async () => {
        const response = await apiCall(params);
        
        if (response.error) {
          setError(response.error.message);
          return { data: null, error: response.error.message };
        } else {
          setError(null);
          return { data: response.data, error: null };
        }
      };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    mutate
  };
}

export default useApi; 