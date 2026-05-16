import { QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import type { PropsWithChildren, ReactElement } from 'react';

import { queryClient } from '@/app/providers/query-client';

export const AppProviders = ({
  children,
}: PropsWithChildren): ReactElement => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#0f766e',
            borderRadius: 10,
            fontFamily:
              '"IBM Plex Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
          },
        }}
      >
        {children}
      </ConfigProvider>
    </QueryClientProvider>
  );
};
