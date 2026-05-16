export const appColorConfig = {
  /**
   * Brand color taken from the current Fitly logo. Change this first when
   * re-skinning the app; hover/soft/focus states are derived in theme.css.
   */
  primary: '#8a3d12',
  /**
   * Main text color. Muted text, placeholders, borders, and table lines are
   * neutral derivations of this family in theme.css.
   */
  neutral: '#334155',
  /**
   * Page canvas and low-emphasis panel background.
   */
  canvas: '#f8fafc',
  /**
   * Card, table, drawer, and header surface.
   */
  surface: '#ffffff',
  /**
   * App frame background behind workspace content.
   */
  shell: '#eef2f5',
  /**
   * Dark navigation background.
   */
  sidebar: '#21130d',
} as const;

export type AppColorToken = keyof typeof appColorConfig;
