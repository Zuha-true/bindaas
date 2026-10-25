import { colors, radii } from '../theme/tokens';

export const bindaasTheme = { background: colors.pink50, foreground: colors.ink, muted: colors.ink2, accent: colors.sos, radius: radii.card };
export const tadkaTheme = { background: '#FFF6EC', foreground: '#2B1D16', muted: '#7A6A5E', accent: '#E4572E', radius: 24 } as const;
export type SkinTheme = typeof bindaasTheme | typeof tadkaTheme;
