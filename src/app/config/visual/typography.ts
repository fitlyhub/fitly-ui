export const typographyConfig = {
  fontFamily:
    '"IBM Plex Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  fontImportUrl:
    'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap',
  fontSizes: {
    micro: '11px',
    xs: '12px',
    sm: '13px',
    body: '14px',
    base: '16px',
    lg: '18px',
    title: '30px',
    display: '36px',
  },
} as const;

export const typographyClassConfig = {
  authEyebrow: 'm-0 text-xs font-semibold uppercase tracking-[0.42em] text-slate-500',
  authTitle:
    '!mb-0 !text-4xl !font-semibold !tracking-[0.12em] !text-slate-800',
  pageTitle: '!mb-0 !text-3xl !font-semibold !tracking-tight !text-slate-900',
  helperText: '!mb-0 !text-sm !leading-6 !text-slate-500',
  panelEyebrow: 'm-0 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500',
  panelTitle: 'm-0 text-base font-semibold text-slate-900',
} as const;
