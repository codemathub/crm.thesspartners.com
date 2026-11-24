import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  Calendar,
  Megaphone,
  User,
  AlertCircle,
  X,
  ExternalLink,
  Volume2,
} from 'lucide-react';
import { themeTokens } from '../theme/tokens';
import { api, InAppNotification } from '../services/api';
import { parseUtcDate } from '../utils/dateUtils';

interface NotificationPopoverProps {
  onNavigate: (view: string) => void;
}

// Gentle Web Audio API synthesizer chime (no external MP3 file required)
function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Two-tone chime: D5 (587Hz) sliding to A5 (880Hz)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio autoplay policy blocked until first user interaction
  }
}

// Format relative time (e.g. "Just now", "5m ago", "2h ago", "Nov 24")
function formatRelativeTime(dateString: string): string {
  try {
    const date = parseUtcDate(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 30) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [toastNotif, setToastNotif] = useState<InAppNotification | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialSyncRef = useRef(true);

  // Request native Chrome browser notification permission
  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Your browser does not support desktop notifications.');
      return;
    }
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        playChime();
        new Notification('EstateCRM Notifications Enabled', {
          body: 'You will now receive real-time Chrome desktop popups for tasks, visits, and directives.',
          icon: '/favicon.ico',
        });
      }
    } catch (e) {
      console.warn('Failed to request notification permission:', e);
    }
  };

  // Fetch notifications and trigger desktop / toast alerts for new items
  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications({ limit: 20 });
      const items = res.items || [];
      setNotifications(items);
      setUnreadCount(res.unread_count || 0);

      if (initialSyncRef.current) {
        items.forEach((item) => seenIdsRef.current.add(item.id));
        initialSyncRef.current = false;
        return;
      }

      // Detect brand new notifications that arrived since last fetch
      const brandNew = items.filter((item) => !seenIdsRef.current.has(item.id) && !item.is_read);
      if (brandNew.length > 0) {
        brandNew.forEach((item) => seenIdsRef.current.add(item.id));
        const latest = brandNew[0];

        // 1. Play audio chime
        playChime();

        // 2. Real Native Chrome / Desktop notification
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const nativeNotif = new Notification(latest.title, {
              body: latest.body,
              icon: '/favicon.ico',
              tag: latest.id,
            });
            nativeNotif.onclick = () => {
              window.focus();
              nativeNotif.close();
              handleNotificationClick(latest);
            };
          } catch (e) {
            console.warn('Failed to show native Chrome notification:', e);
          }
        }

        // 3. Floating In-App Toast
        setToastNotif(latest);
      }
    } catch {
      // offline / network silence
    }
  };

  // Auto-dismiss in-app toast after 6 seconds
  useEffect(() => {
    if (toastNotif) {
      const timer = setTimeout(() => setToastNotif(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastNotif]);

  // Periodic polling every 10 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.warn('Could not mark all as read:', e);
    }
  };

  // Click on a notification item
  const handleNotificationClick = async (notif: InAppNotification) => {
    try {
      if (!notif.is_read) {
        await api.markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // ignore
    }
    setIsOpen(false);

    // Route intelligently based on notification type
    if (notif.notification_type?.includes('visit') || notif.entity_type === 'visit') {
      onNavigate('visits');
    } else if (notif.notification_type?.includes('lead') || notif.entity_type === 'enquiry') {
      onNavigate('customers');
    } else {
      onNavigate('tasks');
    }
  };

  // Render appropriate category icon
  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
      case 'task':
        return <CheckCircle2 size={16} color="#4F5278" />;
      case 'visit_assigned':
      case 'visit_scheduled':
      case 'visit_claim':
        return <Calendar size={16} color="#2563EB" />;
      case 'announcement':
        return <Megaphone size={16} color="#D97706" />;
      case 'lead_assigned':
        return <User size={16} color="#059669" />;
      default:
        return <AlertCircle size={16} color="#6B7280" />;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      {/* Real Floating Desktop-style In-App Toast */}
      {toastNotif && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            backgroundColor: '#1E2030',
            color: '#FFFFFF',
            borderRadius: '12px',
            padding: '14px 18px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            maxWidth: '380px',
            border: '1px solid rgba(255,255,255,0.1)',
            animation: 'fadeInSlide 0.3s ease-out',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#4F5278',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Bell size={18} color="#FFFFFF" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '3px' }}>
              {toastNotif.title}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#9CA3AF',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {toastNotif.body}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => {
                handleNotificationClick(toastNotif);
                setToastNotif(null);
              }}
              style={{
                backgroundColor: '#4F5278',
                color: '#FFFFFF',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View
            </button>
            <button
              onClick={() => setToastNotif(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Bell Button with Live Badge */}
      <button
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: isOpen ? themeTokens.colors.primaryDark : themeTokens.colors.textSecondary,
          position: 'relative',
          padding: '8px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isOpen ? themeTokens.colors.primarySoft : 'transparent',
          transition: 'all 0.15s ease',
        }}
        title="Notifications & Directives"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) fetchNotifications();
        }}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              minWidth: '16px',
              height: '16px',
              borderRadius: '8px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              lineHeight: 1,
              border: '2px solid #FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '380px',
            maxHeight: '520px',
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            boxShadow: '0 16px 48px -8px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid #F3F4F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: themeTokens.colors.textPrimary }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: themeTokens.colors.primarySoft,
                    color: themeTokens.colors.primaryDark,
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '10px',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: themeTokens.colors.primaryDark,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Chrome Notification Banner Prompt */}
          {permission !== 'granted' && (
            <div
              style={{
                backgroundColor: '#EFF6FF',
                borderBottom: '1px solid #DBEAFE',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Volume2 size={16} color="#2563EB" />
                <span style={{ fontSize: '12px', color: '#1E40AF', fontWeight: 600 }}>
                  Enable real desktop popups
                </span>
              </div>
              <button
                onClick={handleRequestPermission}
                style={{
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Allow in Chrome
              </button>
            </div>
          )}

          {/* Scrollable Notification Items List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              maxHeight: '360px',
              padding: '6px 0',
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: themeTokens.colors.textSecondary,
                  fontSize: '13px',
                }}
              >
                <Bell size={28} color="#D1D5DB" style={{ marginBottom: '8px' }} />
                <div>No notifications yet</div>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    padding: '12px 18px',
                    display: 'flex',
                    gap: '12px',
                    cursor: 'pointer',
                    backgroundColor: notif.is_read ? '#FFFFFF' : '#F9FAFB',
                    borderBottom: '1px solid #F9FAFB',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notif.is_read ? '#FFFFFF' : '#F9FAFB';
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#F3F4F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {getCategoryIcon(notif.notification_type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: notif.is_read ? 600 : 700,
                          color: themeTokens.colors.textPrimary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {notif.title}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: themeTokens.colors.textSecondary,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: themeTokens.colors.textSecondary,
                        marginTop: '2px',
                        lineHeight: 1.4,
                      }}
                    >
                      {notif.body}
                    </div>
                  </div>
                  {!notif.is_read && (
                    <div
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: '#2563EB',
                        marginTop: '6px',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid #F3F4F6',
              backgroundColor: '#FAFAFA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigate('tasks');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: themeTokens.colors.primaryDark,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>View all in Tasks & Notices</span>
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
