export const themeTokens = {
  colors: {
    appBackground: '#F8FAFC', // Crisp Slate Canvas (Light Theme)
    surface: '#FFFFFF',       // Pure White Card Surfaces
    softSurface: '#F1F5F9',   // Light Slate Surface Tint
    primary: '#2563EB',       // Electric Sapphire Blue (The 'G' - Active Brand)
    primaryDark: '#1D4ED8',   // Deep Sapphire Blue (Primary CTAs & Icons)
    primarySoft: '#EFF6FF',   // Soft Sapphire Tint (Active Tab Pills)
    accentGold: '#D97706',    // Imperial Amber Gold (The '2' - VIP & Deals)
    accentGoldSoft: '#FEF3C7',// Warm Gold Tint (Badges & Highlights)
    midnightNavy: '#020912',  // Luxury Midnight Navy (Logo & Header Anchor)
    textPrimary: '#0F172A',   // High-Contrast Obsidian Slate
    textSecondary: '#64748B', // Clean Secondary Slate
    border: '#E2E8F0',        // Subtle Hairline Slate Divider
    success: '#16A34A',       // Forest Emerald (Completed)
    warning: '#D97706',       // Amber Warning
    danger: '#DC2626',        // Alert Rose Red
    info: '#0284C7',          // Sky Info
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
    subtle: 'none',
    card: 'none',
  },
} as const;

export type ThemeTokens = typeof themeTokens;
