export const visualClassConfig = {
  action: {
    authPrimaryButton:
      '!h-11 !rounded-xl !border-0 !bg-[var(--color-fitly-accent)] !font-medium hover:!bg-[var(--color-fitly-accent-hover)]',
    textButton:
      'cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-teal-700 hover:text-teal-800',
  },
  shell: {
    authBackground: '[background:var(--fitly-auth-background)]',
    workspaceBackground: 'bg-[var(--color-fitly-app-shell)]',
  },
  surface: {
    authCard:
      'w-full max-w-[460px] rounded-[2rem] border border-slate-300/80 bg-white px-6 py-8 shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:px-10 sm:py-10',
    infoPanel: 'rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4',
  },
} as const;
