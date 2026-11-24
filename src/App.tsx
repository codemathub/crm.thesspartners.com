import React, { useState, useEffect } from 'react';
import { themeTokens } from './theme/tokens';
import {
  LayoutDashboard,
  Users,
  Building,
  UserCheck,
  Calendar,
  Clock,
  History,
  Archive,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  KeyRound,
} from 'lucide-react';
import { OverviewView } from './views/OverviewView';
import { UsersView } from './views/UsersView';
import { PasswordResetQueueView } from './views/PasswordResetQueueView';
import { InventoryView } from './views/InventoryView';
import { CustomersEnquiriesView } from './views/CustomersEnquiriesView';
import { VisitsView } from './views/VisitsView';
import { FollowupsView } from './views/FollowupsView';
import { TasksAnnouncementsView } from './views/TasksAnnouncementsView';
import { AuditLogView } from './views/AuditLogView';
import { ArchivesView } from './views/ArchivesView';
import { SettingsView } from './views/SettingsView';
import { ReportsView } from './views/ReportsView';
import { LoginView } from './views/LoginView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { Customer360Modal } from './components/Customer360Modal';
import { PropertyMatchedCustomersModal } from './components/PropertyMatchedCustomersModal';
import { NotificationPopover } from './components/NotificationPopover';
import { api, getAuthToken, removeAuthToken } from './services/api';

export type NavItem =
  | 'overview'
  | 'users'
  | 'password-reset-queue'
  | 'inventory'
  | 'customers'
  | 'visits'
  | 'followups'
  | 'tasks'
  | 'audit'
  | 'archives'
  | 'reports'
  | 'settings';

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [activeNav, setActiveNav] = useState<NavItem>('overview');
  const [pendingResetCount, setPendingResetCount] = useState<number>(0);

  const fetchPendingResetCount = async () => {
    try {
      const res = await api.getPasswordResetQueue('pending');
      setPendingResetCount(res.pending_count || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (token) {
      fetchPendingResetCount();
    }
  }, [token, activeNav]);

  // Global Command Palette & 360 Dossier State
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [customer360Id, setCustomer360Id] = useState<string | null>(null);
  const [matchedProperty, setMatchedProperty] = useState<any | null>(null);
  const [targetPropertyId, setTargetPropertyId] = useState<string | null>(null);
  const [targetCustomerId, setTargetCustomerId] = useState<string | null>(null);
  const [targetEnquiryId, setTargetEnquiryId] = useState<string | null>(null);

  useEffect(() => {
    const existingToken = getAuthToken();
    if (existingToken) {
      api.me()
        .then((user) => {
          setCurrentUser(user);
          setToken(existingToken);
        })
        .catch(() => {
          removeAuthToken();
          setToken(null);
          setCurrentUser(null);
        })
        .finally(() => {
          setAuthChecking(false);
        });
    } else {
      setAuthChecking(false);
    }

    const handleUnauthorized = () => {
      removeAuthToken();
      setToken(null);
      setCurrentUser(null);
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!token) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [token]);

  const userRole = (currentUser?.role || 'super_admin').toLowerCase();

  const allNavMenuItems: { key: NavItem; label: string; icon: React.ReactNode; badge?: number; roles: string[] }[] = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} />, roles: ['super_admin', 'admin', 'executive'] },
    { key: 'inventory', label: 'Property Inventory', icon: <Building size={18} />, roles: ['super_admin', 'admin', 'executive'] },
    { key: 'customers', label: 'Customers & Enquiries', icon: <UserCheck size={18} />, roles: ['super_admin', 'admin', 'executive'] },
    { key: 'visits', label: 'Visits Schedule', icon: <Calendar size={18} />, roles: ['super_admin', 'admin', 'executive'] },
    { key: 'followups', label: 'Follow-ups', icon: <Clock size={18} />, roles: ['super_admin', 'admin', 'executive'] },
    { key: 'tasks', label: 'Tasks & Notices', icon: <Bell size={18} />, roles: ['super_admin', 'admin', 'executive'] },
    { key: 'users', label: 'Users & Staff', icon: <Users size={18} />, roles: ['super_admin', 'admin'] },
    { key: 'password-reset-queue', label: 'Password Reset Queue', icon: <KeyRound size={18} />, badge: pendingResetCount, roles: ['super_admin'] },
    { key: 'reports', label: 'Reports', icon: <BarChart3 size={18} />, roles: ['super_admin', 'admin'] },
    { key: 'audit', label: 'Activity Log', icon: <History size={18} />, roles: ['super_admin'] },
    { key: 'archives', label: 'Archives', icon: <Archive size={18} />, roles: ['super_admin'] },
    { key: 'settings', label: 'Master Data / Settings', icon: <Settings size={18} />, roles: ['super_admin'] },
  ];

  const navMenuItems = allNavMenuItems.filter((item) => item.roles.includes(userRole));

  const renderActiveView = () => {
    switch (activeNav) {
      case 'overview':
        return <OverviewView onNavigate={setActiveNav} />;
      case 'users':
        return <UsersView currentUser={currentUser} />;
      case 'password-reset-queue':
        return <PasswordResetQueueView onNavigate={setActiveNav} onRefreshBadge={fetchPendingResetCount} />;
      case 'inventory':
        return (
          <InventoryView
            initialPropertyId={targetPropertyId}
            onClearInitialPropertyId={() => setTargetPropertyId(null)}
            onOpenCustomer360={(cid) => setCustomer360Id(cid)}
          />
        );
      case 'audit':
        return <AuditLogView />;
      case 'settings':
        return <SettingsView />;
      case 'customers':
        return (
          <CustomersEnquiriesView
            initialCustomerId={targetCustomerId}
            onClearInitialCustomerId={() => setTargetCustomerId(null)}
          />
        );
      case 'visits':
        return (
          <VisitsView
            initialPropertyId={targetPropertyId}
            initialEnquiryId={targetEnquiryId}
            onClearTargetIds={() => {
              setTargetPropertyId(null);
              setTargetEnquiryId(null);
            }}
          />
        );
      case 'followups':
        return <FollowupsView />;
      case 'tasks':
        return <TasksAnnouncementsView />;
      case 'archives':
        return <ArchivesView />;
      case 'reports':
        return <ReportsView />;
    }
  };

  if (authChecking) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: themeTokens.colors.appBackground,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: themeTokens.colors.textPrimary, marginBottom: '8px' }}>
            EstateFlow Super Admin
          </div>
          <div style={{ fontSize: '13px', color: themeTokens.colors.textSecondary }}>
            Verifying secure session...
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <LoginView
        onLoginSuccess={(user, newToken) => {
          setToken(newToken);
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: themeTokens.colors.appBackground }}>
      {/* Left Sidebar */}
      <aside
        style={{
          width: '260px',
          backgroundColor: themeTokens.colors.surface,
          borderRight: `1px solid ${themeTokens.colors.border}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Brand */}
        <div style={{ padding: '20px 20px 18px', borderBottom: `1px solid ${themeTokens.colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: themeTokens.colors.primaryDark,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <Building size={18} color="#FFFFFF" />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', color: themeTokens.colors.textPrimary }}>
              Estate<span style={{ color: themeTokens.colors.primaryDark }}>CRM</span>
            </div>
          </div>
          <span
            style={{
              display: 'inline-block',
              marginTop: '10px',
              backgroundColor:
                userRole === 'super_admin'
                  ? themeTokens.colors.primarySoft
                  : userRole === 'admin'
                  ? '#FEF3C7'
                  : '#E0E7FF',
              color:
                userRole === 'super_admin'
                  ? themeTokens.colors.primaryDark
                  : userRole === 'admin'
                  ? '#92400E'
                  : '#3730A3',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            {userRole === 'super_admin'
              ? 'Super Admin Console'
              : userRole === 'admin'
              ? 'Admin Operations Console'
              : 'Executive Portal'}
          </span>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navMenuItems.map((item) => {
            const isActive = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveNav(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: themeTokens.borderRadius.sm,
                  backgroundColor: isActive ? themeTokens.colors.primarySoft : 'transparent',
                  color: isActive ? themeTokens.colors.primaryDark : themeTokens.colors.textSecondary,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.1s ease',
                }}
              >
                <span style={{ color: isActive ? themeTokens.colors.primaryDark : themeTokens.colors.textSecondary }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {Boolean(item.badge && item.badge > 0) && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '10px',
                      backgroundColor: isActive ? themeTokens.colors.primaryDark : '#4F46E5',
                      color: '#FFFFFF',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Session Footer */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${themeTokens.colors.border}`, backgroundColor: '#FAF9FC' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: themeTokens.colors.textPrimary }}>
                {currentUser?.full_name || 'Super Admin'}
              </div>
              <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>
                {currentUser?.email || 'sachin@1'}
              </div>
            </div>
            <button
              onClick={() => {
                removeAuthToken();
                setToken(null);
                setCurrentUser(null);
              }}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: themeTokens.colors.textSecondary,
                padding: '6px',
              }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <header
          style={{
            height: '60px',
            backgroundColor: themeTokens.colors.surface,
            borderBottom: `1px solid ${themeTokens.colors.border}`,
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '15px', fontWeight: 600, color: themeTokens.colors.textPrimary }}>
            {navMenuItems.find((i) => i.key === activeNav)?.label}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Global Search Trigger */}
            <div
              onClick={() => setSearchModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: themeTokens.colors.softSurface,
                borderRadius: '8px',
                padding: '6px 14px',
                cursor: 'pointer',
                border: `1px solid ${themeTokens.colors.border}`,
                width: '300px',
              }}
            >
              <Search size={14} color={themeTokens.colors.textSecondary} />
              <span style={{ fontSize: '13px', color: themeTokens.colors.textSecondary, flex: 1 }}>
                Search Property ID, phone, customer...
              </span>
              <kbd style={{ fontSize: '10px', backgroundColor: '#FFFFFF', padding: '1px 5px', borderRadius: '4px', border: `1px solid ${themeTokens.colors.border}`, color: themeTokens.colors.textSecondary }}>
                Ctrl+K
              </kbd>
            </div>

            <NotificationPopover onNavigate={(nav) => setActiveNav(nav as any)} />
          </div>
        </header>

        {/* View Container */}
        <main style={{ flex: 1, padding: '32px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          {renderActiveView()}
        </main>
      </div>

      {/* Global Command Palette & Live Enterprise Search */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectProperty={(prop) => {
          if (prop?.property_id) setTargetPropertyId(prop.property_id);
          setActiveNav('inventory');
        }}
        onSelectCustomer360={(cid) => {
          setCustomer360Id(cid);
        }}
        onSelectEnquiry={(enqId) => {
          setTargetEnquiryId(enqId);
          setActiveNav('customers');
        }}
        onViewPropertyMatches={(prop) => {
          setMatchedProperty(prop);
        }}
      />

      {/* Customer 360° Panoramic Dossier Modal */}
      <Customer360Modal
        isOpen={!!customer360Id}
        customerId={customer360Id}
        onClose={() => setCustomer360Id(null)}
        onNavigateToProperty={(propId) => {
          setCustomer360Id(null);
          if (propId) setTargetPropertyId(propId);
          setActiveNav('inventory');
        }}
        onNavigateToEnquiry={(enqId) => {
          setCustomer360Id(null);
          if (enqId) setTargetEnquiryId(enqId);
          setActiveNav('customers');
        }}
      />

      {/* Prospective Property Matched Customers Modal */}
      <PropertyMatchedCustomersModal
        isOpen={!!matchedProperty}
        property={matchedProperty}
        onClose={() => setMatchedProperty(null)}
        onOpenCustomer360={(cid) => {
          setCustomer360Id(cid);
        }}
        onScheduleVisit={() => {
          setActiveNav('visits');
        }}
      />
    </div>
  );
};

export default App;
