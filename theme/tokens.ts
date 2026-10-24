export const colors = {
  ink: '#3C2218', ink2: '#6B4A40', ink3: '#523226', pink: '#FFC7C7',
  pink100: '#FFE3E0', pink50: '#FFF4F2', rose: '#E58F8F', line: '#F3D5D1',
  white: '#FFFFFF', sos: '#D4313F', warnBg: '#FFF0D1', warn: '#8A4B00',
  cream: '#FFF9F2', orange: '#E4572E', muted: '#A9877C', green: '#55735B',
  mapRoad: '#E8DCD3', mapSurface: '#F6EFE8', splashRim: '#70483A',
  cookingLine: '#F1D9C9', sosSoft: '#FCE5E4', sosWash: 'rgba(255,255,255,0.19)',
  scrim: 'rgba(0,0,0,0.47)',
  recipeCitrus: '#F5C35A', recipeChai: '#C88A62', recipePaneer: '#A8B079',
} as const;
export const radii = { card: 24, tile: 24, input: 18, pill: 999, sheetTop: 36, headerBottom: 40 } as const;
export const spacing = { xs: 6, sm: 10, md: 16, lg: 22, xl: 30 } as const;
export const shadow = { shadowColor: colors.ink, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.09, shadowRadius: 24, elevation: 4 } as const;
export const type = { display: 'DMSerifDisplay_400Regular', ui: 'DMSans_400Regular', medium: 'DMSans_500Medium', semibold: 'DMSans_600SemiBold', bold: 'DMSans_700Bold', heavy: 'DMSans_800ExtraBold' } as const;
