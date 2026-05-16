import { Select } from 'antd';
import type { PropsWithChildren, ReactElement } from 'react';

import { visualClassConfig } from '@/app/config/visual';
import type { AuthLanguage } from '@/features/auth/model/auth.types';

interface AuthPageShellProps extends PropsWithChildren {
  language: AuthLanguage;
  languageLabel: string;
  onLanguageChange: (language: AuthLanguage) => void;
}

const languageOptions: Array<{ label: string; value: AuthLanguage }> = [
  { label: 'Tiếng Việt', value: 'vi_VN' },
  { label: 'English', value: 'en_US' },
];

export const AuthPageShell = ({
  children,
  language,
  languageLabel,
  onLanguageChange,
}: AuthPageShellProps): ReactElement => {
  return (
    <main className={`min-h-screen ${visualClassConfig.shell.authBackground}`}>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-end">
          <label
            className="inline-flex items-center gap-2 px-1 py-1 text-sm font-medium leading-6 text-slate-700"
            htmlFor="auth-language"
          >
            <span>{languageLabel}</span>
            <span aria-hidden="true">:</span>
            <Select
              id="auth-language"
              className="auth-language-select"
              onChange={onLanguageChange}
              options={languageOptions}
              popupMatchSelectWidth={false}
              value={language}
              variant="borderless"
            />
          </label>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <section className={visualClassConfig.surface.authCard}>
            <div className="space-y-6">{children}</div>
          </section>
        </div>
      </div>
    </main>
  );
};
