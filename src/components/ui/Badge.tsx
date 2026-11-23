import React from 'react';
import { themeTokens } from '../../theme/tokens';

export interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral';
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
}) => {
  const getBadgeColors = () => {
    switch (variant) {
      case 'success':
        return { bg: '#E4F3ED', text: themeTokens.colors.success };
      case 'warning':
        return { bg: '#FDF3E7', text: themeTokens.colors.warning };
      case 'danger':
        return { bg: '#FCECEE', text: themeTokens.colors.danger };
      case 'info':
        return { bg: '#EAF0F6', text: themeTokens.colors.info };
      case 'primary':
        return { bg: themeTokens.colors.primarySoft, text: themeTokens.colors.primaryDark };
      case 'neutral':
      default:
        return { bg: themeTokens.colors.softSurface, text: themeTokens.colors.textSecondary };
    }
  };

  const { bg, text } = getBadgeColors();

  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: bg,
        color: text,
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        ...style,
      }}
    >
      {label}
    </span>
  );
};
