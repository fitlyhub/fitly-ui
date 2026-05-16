import { Typography } from 'antd';
import type { ReactElement } from 'react';

import {
  brandConfig,
  logoClassConfig,
  logoImageConfig,
  typographyClassConfig,
} from '@/app/config/visual';

export const ProjectLogo = (): ReactElement => {
  return (
    <div className={logoClassConfig.auth.root}>
      <img
        alt={logoImageConfig.full.alt}
        className={logoClassConfig.auth.mark}
        src={logoImageConfig.full.src}
      />

      <div className={logoClassConfig.auth.textStack}>
        <p className={typographyClassConfig.authEyebrow}>
          {brandConfig.platformName}
        </p>
        <Typography.Title className={typographyClassConfig.authTitle}>
          {brandConfig.productName}
        </Typography.Title>
      </div>
    </div>
  );
};
