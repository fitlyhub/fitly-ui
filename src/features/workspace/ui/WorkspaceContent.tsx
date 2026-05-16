import { Alert, Skeleton } from 'antd';
import type { ReactElement } from 'react';

import { DynamicPageRenderer } from '@/engines/dynamic-page';
import type { WorkspaceModuleSchema } from '@/features/workspace/model/workspace.types';

interface WorkspaceContentProps {
  errorMessage?: string;
  isLoading: boolean;
  module: WorkspaceModuleSchema | undefined;
}

export const WorkspaceContent = ({
  errorMessage,
  isLoading,
  module,
}: WorkspaceContentProps): ReactElement => {
  if (errorMessage) {
    return (
      <Alert
        message={errorMessage}
        showIcon
        type="error"
      />
    );
  }

  if (isLoading || !module) {
    return (
      <div className="space-y-4">
        <Skeleton active paragraph={{ rows: 4 }} />
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  return <DynamicPageRenderer page={module} />;
};
