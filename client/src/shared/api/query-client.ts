// queryClient.ts
import { QueryClient, QueryClientConfig } from '@tanstack/react-query';

const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      cacheTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
} as unknown as QueryClientConfig; // <-- Type assertion fixes TS error

export const queryClient = new QueryClient(queryClientConfig);
