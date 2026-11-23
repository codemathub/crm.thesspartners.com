import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, Building } from 'lucide-react';
import { api, setAuthToken } from '../services/api';

interface LoginViewProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username/email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const detectedDevice = navigator.userAgent.includes('Chrome')
        ? 'Desktop Chrome'
        : navigator.userAgent.includes('Firefox')
        ? 'Desktop Firefox'
        : navigator.userAgent.includes('Safari')
        ? 'Desktop Safari'
        : 'Enterprise Web Console';

      const res = await api.login({
        email: username.trim(),
        password: password.trim(),
        platform: 'web',
        device_name: detectedDevice,
      });

      if (!res.access_token) {
        throw new Error('No access token returned from server.');
      }

      setAuthToken(res.access_token);
      onLoginSuccess(res.user, res.access_token);
    } catch (err: any) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F7F8FC',
        padding: '20px',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '36px 32px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#4F5278',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Building size={20} color="#FFFFFF" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1, color: '#1F2937' }}>
              Estate<span style={{ color: '#4F5278' }}>CRM</span>
            </div>
          </div>
          <span
            style={{
              display: 'inline-block',
              marginTop: '10px',
              backgroundColor: '#EEF0F8',
              color: '#4F5278',
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '6px',
            }}
          >
            Enterprise Operations Console
          </span>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '20px',
              border: '1px solid #F87171',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Username / Email Field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              Username or Email
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '0 12px',
                height: '42px',
              }}
            >
              <User size={16} color="#9CA3AF" style={{ marginRight: '8px' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or email"
                autoComplete="username"
                required
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '13px',
                  color: '#1F2937',
                  width: '100%',
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#374151',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                padding: '0 12px',
                height: '42px',
              }}
            >
              <Lock size={16} color="#9CA3AF" style={{ marginRight: '8px' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '13px',
                  color: '#1F2937',
                  width: '100%',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#4F5278',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              height: '42px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
              marginTop: '6px',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
