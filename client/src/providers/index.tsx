'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '../shared/api/query-client';
import ClientThemeProvider from './ClientThemeProvider';
import { ToastProvider } from './ToastProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ClientThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ClientThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
