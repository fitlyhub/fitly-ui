import { Typography } from 'antd';
import type { ReactElement } from 'react';

export const ProjectLogo = (): ReactElement => {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[linear-gradient(180deg,#23b8b0_0%,#0f766e_100%)] shadow-[0_16px_34px_rgba(15,118,110,0.22)]">
        <span className="pl-1 text-3xl font-semibold tracking-[0.18em] text-white">
          F
        </span>
      </div>

      <div className="space-y-1">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.42em] text-slate-500">
          Fitly Platform
        </p>
        <Typography.Title className="!mb-0 !text-4xl !font-semibold !tracking-[0.12em] !text-slate-800">
          Fitly
        </Typography.Title>
      </div>
    </div>
  );
};
