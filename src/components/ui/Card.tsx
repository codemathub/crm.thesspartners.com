import React from 'react';
import { themeTokens } from '../../theme/tokens';

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  action,
  style,
}) => {
  return (
    <div
      style={{
        backgroundColor: themeTokens.colors.surface,
        border: `1px solid ${themeTokens.colors.border}`,
        borderRadius: themeTokens.borderRadius.lg,
        padding: '20px',
        boxShadow: themeTokens.shadows.subtle,
        ...style,
      }}
    >
      {(title || action) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px',
            borderBottom: subtitle ? 'none' : `1px solid #F5F4F8`,
            paddingBottom: subtitle ? 0 : '10px',
          }}
        >
          <div>
            {title && (
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: themeTokens.colors.textPrimary }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ fontSize: '12px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
