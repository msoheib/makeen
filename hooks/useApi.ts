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

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>> | Promise<T>,
  dependencies: any[] = []
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      
      // Check if response is in ApiResponse format
      if (response && typeof response === 'object' && 'data' in response && 'error' in response) {
        const apiResponse = response as ApiResponse<T>;
        if (apiResponse.error) {
          setError(apiResponse.error.message);
          setData(null);
        } else {
          setData(apiResponse.data);
          setError(null);
        }
      } else {
        // Direct data response
        setData(response as T);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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