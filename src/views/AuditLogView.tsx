import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { themeTokens } from '../theme/tokens';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Activity,
  Terminal,
  Trash2,
  UserCheck,
  UserX,
  Users,
  Key,
  Home,
  Building,
  Calendar,
  Eye,
  Copy,
  Check,
  ShieldAlert,
  CheckCircle2,
  FileText,
  Clock,
  Archive,
} from 'lucide-react';
import { api, AuditEventItem } from '../services/api';

export const AuditLogView: React.FC = () => {
  const [events, setEvents] = useState<AuditEventItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<AuditEventItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  const fetchAuditLogs = async (query = search, category = categoryFilter) => {
    setLoading(true);
    try {
      let eventTypeParam: string | undefined = undefined;
      if (category !== 'all') {
        eventTypeParam = category;
      }

      const res = await api.getAuditLogs({
        search: query.trim() || undefined,
        event_type: eventTypeParam,
        limit: 150,
      });
      setEvents(res.items || []);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      console.error('Failed to load real audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(search, categoryFilter);
  }, [categoryFilter]);

  // Live search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAuditLogs(search, categoryFilter);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimestamp = (iso: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  const formatRelativeTime = (iso: string) => {
    if (!iso) return '';
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getRoleBadgeVariant = (role: string): 'primary' | 'info' | 'neutral' => {
    const r = (role || '').toLowerCase();
    if (r === 'super_admin') return 'primary';
    if (r === 'admin') return 'info';
    return 'neutral';
  };

  const getEventVisuals = (eventType: string) => {
    switch (eventType) {
      case 'user.deleted':
        return {
          icon: <Trash2 size={15} color="#DC2626" />,
          bg: '#FEE2E2',
          border: '#FECACA',
          color: '#991B1B',
          label: 'User Deleted',
        };
      case 'user.reactivated':
        return {
          icon: <UserCheck size={15} color="#16A34A" />,
          bg: '#DCFCE7',
          border: '#BBF7D0',
          color: '#166534',
          label: 'User Reactivated',
        };
      case 'user.deactivated':
        return {
          icon: <UserX size={15} color="#D97706" />,
          bg: '#FEF3C7',
          border: '#FDE68A',
          color: '#92400E',
          label: 'User Deactivated',
        };
      case 'user.created':
        return {
          icon: <Users size={15} color="#2563EB" />,
          bg: '#DBEAFE',
          border: '#BFDBFE',
          color: '#1E40AF',
          label: 'User Created',
        };
      case 'auth.password_reset':
        return {
          icon: <Key size={15} color="#7C3AED" />,
          bg: '#F3E8FF',
          border: '#E9D5FF',
          color: '#6B21A8',
          label: 'Password Reset',
        };
      case 'auth.login_override':
        return {
          icon: <ShieldAlert size={15} color="#DC2626" />,
          bg: '#FEE2E2',
          border: '#FECACA',
          color: '#991B1B',
          label: 'SA Override',
        };
      case 'auth.login_success':
        return {
          icon: <CheckCircle2 size={15} color="#16A34A" />,
          bg: '#DCFCE7',
          border: '#BBF7D0',
          color: '#166534',
          label: 'User Logged In',
        };
      case 'property.created':
        return {
          icon: <Home size={15} color="#059669" />,
          bg: '#D1FAE5',
          border: '#A7F3D0',
          color: '#065F46',
          label: 'Property Listed',
        };
      case 'property.updated':
        return {
          icon: <Building size={15} color="#0284C7" />,
          bg: '#E0F2FE',
          border: '#BAE6FD',
          color: '#0369A1',
          label: 'Property Updated',
        };
      case 'property.archived':
        return {
          icon: <Archive size={15} color="#64748B" />,
          bg: '#F1F5F9',
          border: '#CBD5E1',
          color: '#334155',
          label: 'Property Archived',
        };
      case 'property.deleted':
        return {
          icon: <Trash2 size={15} color="#DC2626" />,
          bg: '#FEE2E2',
          border: '#FECACA',
          color: '#991B1B',
          label: 'Property Deleted',
        };
      case 'visit.scheduled':
        return {
          icon: <Calendar size={15} color="#7C3AED" />,
          bg: '#F3E8FF',
          border: '#E9D5FF',
          color: '#6B21A8',
          label: 'Visit Scheduled',
        };
      case 'visit.completed':
        return {
          icon: <CheckCircle2 size={15} color="#16A34A" />,
          bg: '#DCFCE7',
          border: '#BBF7D0',
          color: '#166534',
          label: 'Visit Completed',
        };
      case 'customer.created':
        return {
          icon: <Users size={15} color="#0D9488" />,
          bg: '#CCFBF1',
          border: '#99F6E4',
          color: '#115E59',
          label: 'Client Registered',
        };
      case 'enquiry.created':
        return {
          icon: <FileText size={15} color="#4F46E5" />,
          bg: '#EEF2FF',
          border: '#C7D2FE',
          color: '#3730A3',
          label: 'Enquiry Logged',
        };
      default:
        return {
          icon: <Activity size={15} color="#4F5278" />,
          bg: themeTokens.colors.softSurface,
          border: themeTokens.colors.border,
          color: themeTokens.colors.primaryDark,
          label: eventType.replace('.', ' ').replace('_', ' ').toUpperCase(),
        };
    }
  };

  const getActorInitials = (name: string) => {
    if (!name) return 'SA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const columns: Column<AuditEventItem>[] = [
    {
      key: 'event_type',
      header: 'Activity & Action',
      render: (e) => {
        const visual = getEventVisuals(e.event_type);
        return (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: visual.bg,
                border: `1px solid ${visual.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              {visual.icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: themeTokens.colors.textPrimary }}>
                  {e.action_label || visual.label}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    backgroundColor: themeTokens.colors.softSurface,
                    color: themeTokens.colors.textSecondary,
                    border: `1px solid ${themeTokens.colors.border}`,
                  }}
                >
                  {e.event_type}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: themeTokens.colors.textSecondary, marginTop: '2px', lineHeight: 1.4 }}>
                {e.summary || `${e.actor_name} triggered ${e.event_type}`}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'entity_id',
      header: 'Target Record',
      render: (e) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: '12px', color: themeTokens.colors.primaryDark }}>
            {e.entity_name || e.entity_id}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
            <Badge
              label={e.entity_type.toUpperCase()}
              variant="neutral"
              style={{ fontSize: '9px', padding: '1px 6px' }}
            />
            {e.entity_id && e.entity_id !== '—' && (
              <button
                type="button"
                onClick={(evt) => {
                  evt.stopPropagation();
                  copyToClipboard(e.entity_id, e.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  color: themeTokens.colors.textSecondary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
                title="Click to copy Record ID"
              >
                <span>ID: {e.entity_id.length > 12 ? `${e.entity_id.slice(0, 10)}...` : e.entity_id}</span>
                {copiedId === e.id ? <Check size={10} color="#16A34A" /> : <Copy size={10} />}
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'actor_name',
      header: 'Performed By',
      render: (e) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: themeTokens.colors.primaryDark,
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {getActorInitials(e.actor_name)}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '12px', color: themeTokens.colors.textPrimary }}>
              {e.actor_name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Badge
                label={e.actor_role.replace('_', ' ').toUpperCase()}
                variant={getRoleBadgeVariant(e.actor_role)}
                style={{ fontSize: '9px', padding: '1px 5px' }}
              />
              {e.actor_email && (
                <span style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>
                  {e.actor_email}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'timestamp',
      header: 'Time & Origin',
      render: (e) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '12px', color: themeTokens.colors.textPrimary }}>
            <Clock size={12} color={themeTokens.colors.textSecondary} />
            <span>{formatRelativeTime(e.timestamp)}</span>
          </div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
            {formatTimestamp(e.timestamp)}
          </div>
          <div style={{ fontSize: '10px', fontFamily: 'monospace', color: themeTokens.colors.textSecondary, marginTop: '1px' }}>
            IP: {e.ip_address || '127.0.0.1'}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Details',
      render: (e) => (
        <Button
          label="Inspect"
          size="sm"
          variant="outline"
          icon={<Eye size={12} />}
          onClick={() => {
            setSelectedEvent(e);
            setShowRawJson(false);
          }}
        />
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={24} color={themeTokens.colors.primaryDark} />
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: themeTokens.colors.textPrimary, margin: 0 }}>
              Company Activity Log & Audit Trail
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: themeTokens.colors.textSecondary, marginTop: '4px' }}>
            Real-time, human-readable operational log. Every action across users, properties, visits, and security is recorded and immutable.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: themeTokens.colors.success, fontWeight: 600, backgroundColor: '#DCFCE7', padding: '6px 12px', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
            <ShieldCheck size={16} color={themeTokens.colors.success} />
            <span>Audit Trail Verified & Immutable</span>
          </div>

          <Button
            label="Refresh"
            variant="outline"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={() => fetchAuditLogs()}
          />
        </div>
      </div>

      {/* Filter & Live Search Toolbar */}
      <Card style={{ marginBottom: '16px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          {/* Search Input Box */}
          <div
            style={{
              flex: 1,
              minWidth: '280px',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: themeTokens.colors.softSurface,
              borderRadius: '8px',
              padding: '8px 14px',
              border: `1px solid ${themeTokens.colors.border}`,
            }}
          >
            <Search size={16} color={themeTokens.colors.textSecondary} style={{ marginRight: '10px' }} />
            <input
              type="text"
              placeholder="Search by action, user name, email, property ID, or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                width: '100%',
                color: themeTokens.colors.textPrimary,
              }}
            />
          </div>

          {/* Quick Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All Activities (${totalCount})` },
              { id: 'user.', label: '👥 Team & Users' },
              { id: 'auth.', label: '🔐 Security & Access' },
              { id: 'property.', label: '🏢 Property Inventory' },
              { id: 'visit.', label: '🚗 Site Visits' },
            ].map((cat) => {
              const active = categoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  style={{
                    backgroundColor: active ? themeTokens.colors.primaryDark : '#FFFFFF',
                    color: active ? '#FFFFFF' : themeTokens.colors.textSecondary,
                    border: `1px solid ${active ? themeTokens.colors.primaryDark : themeTokens.colors.border}`,
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Real Audit Events Table */}
      <Card>
        {loading && events.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: themeTokens.colors.textSecondary }}>
            Loading audit activities...
          </div>
        ) : (
          <Table
            columns={columns}
            data={events}
            keyExtractor={(e) => e.id}
            onRowClick={(e) => {
              setSelectedEvent(e);
              setShowRawJson(false);
            }}
          />
        )}
      </Card>

      {/* User-Friendly Event Inspection Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title=""
          maxWidth="640px"
        >
          {(() => {
            const visual = getEventVisuals(selectedEvent.event_type);
            const diffObj = selectedEvent.diff && typeof selectedEvent.diff === 'object' ? selectedEvent.diff : null;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
                {/* Header Banner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: `1px solid ${themeTokens.colors.border}` }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: visual.bg,
                      border: `1px solid ${visual.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {visual.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: themeTokens.colors.textPrimary }}>
                      {selectedEvent.action_label || visual.label}
                    </div>
                    <div style={{ fontSize: '12px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
                      {selectedEvent.summary || `Action logged at ${formatTimestamp(selectedEvent.timestamp)}`}
                    </div>
                  </div>
                  <Badge
                    label={selectedEvent.status.toUpperCase()}
                    variant={selectedEvent.status === 'success' ? 'success' : 'danger'}
                  />
                </div>

                {/* Information Grid: Actor & Target */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Actor Card */}
                  <div style={{ padding: '12px', backgroundColor: themeTokens.colors.softSurface, borderRadius: '8px', border: `1px solid ${themeTokens.colors.border}` }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: themeTokens.colors.textSecondary, textTransform: 'uppercase', marginBottom: '6px' }}>
                      Performed By (Actor)
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: themeTokens.colors.textPrimary }}>
                      {selectedEvent.actor_name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <Badge
                        label={selectedEvent.actor_role.replace('_', ' ').toUpperCase()}
                        variant={getRoleBadgeVariant(selectedEvent.actor_role)}
                        style={{ fontSize: '10px' }}
                      />
                      {selectedEvent.actor_email && (
                        <span style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>
                          {selectedEvent.actor_email}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '6px' }}>
                      IP Address: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedEvent.ip_address || '127.0.0.1'}</span>
                    </div>
                  </div>

                  {/* Target Card */}
                  <div style={{ padding: '12px', backgroundColor: themeTokens.colors.softSurface, borderRadius: '8px', border: `1px solid ${themeTokens.colors.border}` }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: themeTokens.colors.textSecondary, textTransform: 'uppercase', marginBottom: '6px' }}>
                      Target Impacted
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: themeTokens.colors.textPrimary }}>
                      {selectedEvent.entity_name || selectedEvent.entity_id}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <Badge
                        label={selectedEvent.entity_type.toUpperCase()}
                        variant="neutral"
                        style={{ fontSize: '10px' }}
                      />
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: themeTokens.colors.textSecondary }}>
                        ID: {selectedEvent.entity_id}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '6px' }}>
                      Timestamp: {formatTimestamp(selectedEvent.timestamp)}
                    </div>
                  </div>
                </div>

                {/* Human-Readable Details Table */}
                {diffObj && Object.keys(diffObj).length > 0 && (
                  <div style={{ border: `1px solid ${themeTokens.colors.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', backgroundColor: themeTokens.colors.softSurface, borderBottom: `1px solid ${themeTokens.colors.border}`, fontWeight: 700, fontSize: '12px', color: themeTokens.colors.textPrimary }}>
                      Key Event Attributes & Changes
                    </div>
                    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                      {Object.entries(diffObj).map(([key, val]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: `1px dashed ${themeTokens.colors.border}` }}>
                          <span style={{ fontWeight: 600, color: themeTokens.colors.textSecondary, textTransform: 'capitalize' }}>
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span style={{ fontWeight: 700, color: themeTokens.colors.textPrimary, textAlign: 'right' }}>
                            {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '—')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Developer Technical Diff Toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowRawJson(!showRawJson)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: '12px',
                      color: themeTokens.colors.primaryDark,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Terminal size={14} />
                    <span>{showRawJson ? 'Hide' : 'View'} Raw Developer Payload (JSON)</span>
                  </button>

                  {showRawJson && (
                    <pre
                      style={{
                        marginTop: '8px',
                        backgroundColor: '#1E1E2E',
                        color: '#CDD6F4',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'Consolas, Monaco, monospace',
                        overflowX: 'auto',
                        maxHeight: '200px',
                        lineHeight: 1.4,
                      }}
                    >
                      {JSON.stringify(selectedEvent, null, 2)}
                    </pre>
                  )}
                </div>

                {/* Footer Close */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: `1px solid ${themeTokens.colors.border}` }}>
                  <Button
                    label="Close"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEvent(null)}
                  />
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
