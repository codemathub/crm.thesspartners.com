export const themeTokens = {
  colors: {
    appBackground: '#F7F6F8',
    surface: '#FFFFFF',
    softSurface: '#F0EFF4',
    primary: '#72759A',
    primaryDark: '#4F5278',
    primarySoft: '#E8E7F0',
    textPrimary: '#292A3A',
    textSecondary: '#737487',
    border: '#E5E3EA',
    success: '#32836A',
    warning: '#B78138',
    danger: '#B95E69',
    info: '#597C9D',
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
  },
  borderRadius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
    full: '9999px',
  },
  shadows: {
    subtle: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
  },
} as const;

export type ThemeTokens = typeof themeTokens;
