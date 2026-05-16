import logoFullSrc from '../../../../logo/logo.png';
import logoIconSrc from '../../../../logo/logo_icon.png';

export const logoImageConfig = {
  full: {
    alt: 'Fitly',
    src: logoFullSrc,
  },
  icon: {
    alt: 'Fitly icon',
    src: logoIconSrc,
  },
} as const;

export const logoClassConfig = {
  auth: {
    root: 'flex flex-col items-center gap-4 text-center',
    mark:
      'mx-auto block h-32 w-full max-w-[320px] rounded-2xl object-contain [box-shadow:var(--fitly-logo-auth-shadow)]',
    markText: 'sr-only',
    textStack: 'space-y-1',
  },
  workspace: {
    mark:
      'grid h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white [box-shadow:var(--fitly-logo-workspace-shadow)]',
    markImage: 'h-full w-full object-cover',
    headerMark:
      'grid h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm',
    title: 'm-0 truncate text-sm font-semibold uppercase leading-5',
    subtitle: 'm-0 truncate text-xs leading-4',
  },
} as const;
