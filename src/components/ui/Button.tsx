import React from 'react';
import { themeTokens } from '../../theme/tokens';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  disabled,
  style,
  ...rest
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: themeTokens.colors.primary,
          color: '#FFFFFF',
          border: 'none',
        };
      case 'secondary':
        return {
          backgroundColor: themeTokens.colors.primaryDark,
          color: '#FFFFFF',
          border: 'none',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: themeTokens.colors.textPrimary,
          border: `1px solid ${themeTokens.colors.border}`,
        };
      case 'danger':
        return {
          backgroundColor: themeTokens.colors.danger,
          color: '#FFFFFF',
          border: 'none',
        };
      case 'soft':
        return {
          backgroundColor: themeTokens.colors.primarySoft,
          color: themeTokens.colors.primaryDark,
          border: 'none',
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { padding: '6px 12px', fontSize: '12px' };
      case 'md':
        return { padding: '8px 16px', fontSize: '14px' };
      case 'lg':
        return { padding: '12px 20px', fontSize: '15px' };
    }
  };

  return (
    <button
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: themeTokens.borderRadius.sm,
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        transition: 'all 0.15s ease',
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </button>
  );
};
