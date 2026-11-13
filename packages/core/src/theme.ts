export const colors = {
  bg: '#F6F6F6',
  card: '#FFFFFF',
  ink: '#0B0B0B',
  sub: '#6E6E6E',
  line: '#E8E8E8',
  brand: '#0B0B0B',
  accent: '#06C167', // uber-eats green
  accentSoft: '#E7F8EF',
  amber: '#F5A623',
  amberSoft: '#FDF3E1',
  red: '#E23744',
  redSoft: '#FDEBEC',
  blue: '#276EF1',
  blueSoft: '#E9F0FE',
  purple: '#735BF2',
  purpleSoft: '#EFEDFD',
  mapBg: '#EDEFEA',
  mapRoad: '#FFFFFF',
  mapBlock: '#DDE2D8',
};

export const spacing = (n: number) => n * 4;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

export const font = {
  h1: { fontSize: 28, fontWeight: '800' as const, color: colors.ink },
  h2: { fontSize: 20, fontWeight: '800' as const, color: colors.ink },
  h3: { fontSize: 16, fontWeight: '700' as const, color: colors.ink },
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.ink },
  small: { fontSize: 12, fontWeight: '400' as const, color: colors.sub },
  tiny: { fontSize: 10, fontWeight: '600' as const, color: colors.sub },
};
