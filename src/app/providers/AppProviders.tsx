import { QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import type { PropsWithChildren, ReactElement } from 'react';

import { appColorConfig, typographyConfig } from '@/app/config/visual';
import { queryClient } from '@/app/providers/query-client';

export const AppProviders = ({
  children,
}: PropsWithChildren): ReactElement => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: appColorConfig.primary,
            borderRadius: 10,
            fontFamily: typographyConfig.fontFamily,
          },
        }}
      >
        {children}
      </ConfigProvider>
    </QueryClientProvider>
  );
};
