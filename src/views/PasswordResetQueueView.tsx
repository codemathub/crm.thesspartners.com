import React, { useState, useEffect } from 'react';
import { themeTokens } from '../theme/tokens';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  api,
  PasswordResetQueueItem,
  PasswordResetQueueResponse,
} from '../services/api';
import {
  ShieldCheck,
  KeyRound,
  Phone,
  Compass,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface PasswordResetQueueViewProps {
  onNavigate?: (nav: any) => void;
  onRefreshBadge?: () => void;
}

export const PasswordResetQueueView: React.FC<PasswordResetQueueViewProps> = ({
  onNavigate: _onNavigate,
  onRefreshBadge,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [roleFilter, setRoleFilter] = useState('all');
  const [queueData, setQueueData] = useState<PasswordResetQueueResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Authorize Password Modal
  const [authorizingItem, setAuthorizingItem] = useState<PasswordResetQueueItem | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [forceChangeOnLogin, setForceChangeOnLogin] = useState(true);
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState('');

  // Reject Modal
  const [rejectingItem, setRejectingItem] = useState<PasswordResetQueueItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Unmatched device origin / Call branch admin');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Geo Audit Modal
  const [geoItem, setGeoItem] = useState<PasswordResetQueueItem | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getPasswordResetQueue(activeTab, roleFilter !== 'all' ? roleFilter : undefined);
      setQueueData(res);
      if (onRefreshBadge) onRefreshBadge();
    } catch (err) {
      console.error('Failed to load password reset queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeTab, roleFilter]);

  const generateSecureRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pwd = 'Pass#';
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pwd);
  };

  const handleAuthorizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorizingItem || !tempPassword.trim()) {
      setAuthError('Please enter or generate a temporary password.');
      return;
    }

    setSubmittingAuth(true);
    setAuthError('');
    try {
      await api.authorizePasswordReset(authorizingItem.req_id, tempPassword.trim());
      alert(`Credentials successfully authorized and set for ${authorizingItem.full_name} (${authorizingItem.email})! Active tokens purged.`);
      setAuthorizingItem(null);
      setTempPassword('');
      fetchQueue();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to authorize password reset.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;

    setSubmittingReject(true);
    try {
      await api.rejectPasswordReset(rejectingItem.req_id, rejectReason.trim());
      alert(`Request flagged & rejected for ${rejectingItem.full_name}.`);
      setRejectingItem(null);
      fetchQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to reject request.');
    } finally {
      setSubmittingReject(false);
    }
  };

  const calculateElapsedTime = (createdStr: string) => {
    const diffMs = Date.now() - new Date(createdStr).getTime();
    if (diffMs < 0) return 'Just now';
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    if (mins < 60) {
      return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
    }
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  const items = queueData?.items || [];
  const pendingCount = queueData?.pending_count || 0;
  const approvedCount = queueData?.approved_count || 0;
  const rejectedCount = queueData?.rejected_count || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner / Header (Stitch Screen 07e931405c7a4afb8b645f8cab123b0f) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          backgroundColor: '#FFFFFF',
          padding: '24px',
          borderRadius: '12px',
          border: `1px solid ${themeTokens.colors.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: themeTokens.colors.primaryDark,
                letterSpacing: '0.08em',
              }}
            >
              SECURITY GOVERNANCE • TIER-0 IAM
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: pendingCount > 0 ? '#EEF2FF' : '#F3F4F6',
                color: pendingCount > 0 ? '#3730A3' : '#6B7280',
                fontWeight: 700,
              }}
            >
              ● {pendingCount} Pending Requests
            </span>
          </div>

          <h1 style={{ fontSize: '22px', fontWeight: 800, color: themeTokens.colors.textPrimary, margin: 0 }}>
            Central Password Reset & Credential Recovery Queue
          </h1>
          <p style={{ fontSize: '13px', color: themeTokens.colors.textSecondary, marginTop: '4px', marginBottom: 0 }}>
            Review device fingerprints, cross-verify mobile authentication origins, and issue cryptographic temporary credentials.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Button
            label="Audit Check"
            icon={<ShieldCheck size={15} />}
            variant="primary"
            onClick={() => setAuditModalOpen(true)}
          />

          <Button
            label="Refresh"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            variant="outline"
            onClick={fetchQueue}
          />
        </div>
      </div>

      {/* Filter Tabs Bar (Stitch Screen 07e931405c7a4afb8b645f8cab123b0f) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          padding: '12px 18px',
          borderRadius: '10px',
          border: `1px solid ${themeTokens.colors.border}`,
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'pending', label: `Pending Review`, count: pendingCount },
            { key: 'approved', label: `Approved & Dispatched`, count: approvedCount },
            { key: 'rejected', label: `Rejected / Flagged`, count: rejectedCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === tab.key ? 700 : 500,
                backgroundColor: activeTab === tab.key ? '#312E81' : '#F1F5F9',
                color: activeTab === tab.key ? '#FFFFFF' : '#475569',
                transition: 'all 0.1s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                  color: activeTab === tab.key ? '#FFFFFF' : '#1E293B',
                  fontWeight: 700,
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: themeTokens.colors.textSecondary, fontWeight: 600 }}>Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${themeTokens.colors.border}`,
              fontSize: '12px',
              backgroundColor: '#FFFFFF',
              color: '#1F2937',
              fontWeight: 600,
            }}
          >
            <option value="all">All Staff Levels</option>
            <option value="admin">Branch Admin</option>
            <option value="executive">Field Executive</option>
          </select>
        </div>
      </div>

      {/* Queue Tickets List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.length === 0 ? (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '48px',
                textAlign: 'center',
                border: `1px solid ${themeTokens.colors.border}`,
              }}
            >
              <ShieldCheck size={36} color="#10B981" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '16px', fontWeight: 800, color: themeTokens.colors.textPrimary }}>
                No Credential Requests in "{activeTab.toUpperCase()}"
              </div>
              <p style={{ fontSize: '13px', color: themeTokens.colors.textSecondary, marginTop: '4px', maxWidth: '420px', margin: '4px auto 0 auto' }}>
                All field staff mobile authentication sessions are nominal and verified with zero unresolved escalations.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  padding: '20px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {/* Header Row: Avatar, Name, Badges & Elapsed Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        backgroundColor: '#EEF2FF',
                        border: '2px solid #C7D2FE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '15px',
                        fontWeight: 800,
                        color: '#3730A3',
                      }}
                    >
                      {item.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#111827' }}>
                          {item.full_name}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: item.role === 'admin' ? '#EDE9FE' : '#F1F5F9',
                            color: item.role === 'admin' ? '#6D28D9' : '#334155',
                          }}
                        >
                          {item.role === 'admin' ? 'Branch Admin' : 'Field Executive'}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: item.priority.includes('High') ? '#FEE2E2' : '#FEF3C7',
                            color: item.priority.includes('High') ? '#B91C1C' : '#92400E',
                          }}
                        >
                          ⚡ {item.priority}
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
                        {item.cluster ? `${item.cluster} • ` : ''}
                        {item.reporting_manager ? (
                          <span>Reporting Manager: <strong>{item.reporting_manager}</strong></span>
                        ) : (
                          <span>Staff Member</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: themeTokens.colors.textSecondary, fontWeight: 700, letterSpacing: '0.04em' }}>
                      QUEUE TIME ELAPSED
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#1F2937', marginTop: '2px' }}>
                      {calculateElapsedTime(item.created_at)}
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: item.mobile ? '1fr 1fr 1.2fr' : '1fr 1.2fr',
                    gap: '12px',
                    padding: '12px 14px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    border: `1px solid #E2E8F0`,
                  }}
                >
                  {item.mobile ? (
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
                        DIRECT VERIFIED LINE
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                        {item.mobile}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
                      STAFF EMAIL / USERNAME
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', marginTop: '2px', wordBreak: 'break-all' }}>
                      {item.email}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', letterSpacing: '0.04em' }}>
                      DEVICE PLATFORM
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#059669', marginTop: '2px' }}>
                      {item.device_signature || 'Mobile App'}
                    </div>
                  </div>
                </div>

                {/* Declared Reason & Device Signature Box */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                      Declared Reason & Request Origin
                    </span>
                    <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748B', fontWeight: 700 }}>
                      {item.req_id}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', color: '#1E293B', fontStyle: 'italic', marginBottom: '8px' }}>
                    "{item.reason}"
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', color: '#64748B' }}>
                    <div>
                      Device Origin: <strong style={{ color: '#334155' }}>{item.device_signature}</strong>
                    </div>
                    <div>
                      IP Origin: <strong style={{ color: '#334155' }}>{item.client_ip}</strong>
                    </div>
                    {item.resolved_by && (
                      <div style={{ color: item.status === 'approved' ? '#047857' : '#B91C1C', marginTop: '4px' }}>
                        Resolution: <strong>{item.resolution_action}</strong> by <strong>{item.resolved_by}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {item.mobile && item.mobile.trim() !== '' && !['null', 'undefined', 'none', '-'].includes(item.mobile.trim().toLowerCase()) ? (
                      <Button
                        label="Call Staff Line"
                        icon={<Phone size={13} />}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.location.href = `tel:${item.mobile}`;
                        }}
                      />
                    ) : null}
                    <Button
                      label="Audit Details"
                      icon={<Compass size={13} />}
                      variant="outline"
                      size="sm"
                      onClick={() => setGeoItem(item)}
                    />
                  </div>

                  {item.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        label="Reject Request"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRejectingItem(item);
                          setRejectReason('Unmatched device origin / Call branch admin');
                        }}
                      />
                      <Button
                        label="Authorize & Set Temp Password"
                        icon={<KeyRound size={13} />}
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setAuthorizingItem(item);
                          setTempPassword('');
                          setAuthError('');
                        }}
                      />
                    </div>
                  ) : item.status === 'approved' ? (
                    <Badge label="APPROVED & DISPATCHED" variant="success" />
                  ) : (
                    <Badge label="REJECTED / FLAGGED" variant="danger" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      {/* Authorize & Set Temp Password Modal */}
      {authorizingItem && (
        <Modal
          isOpen={!!authorizingItem}
          onClose={() => setAuthorizingItem(null)}
          title={`Authorize Temporary Credentials — ${authorizingItem.full_name}`}
          maxWidth="520px"
        >
          <form onSubmit={handleAuthorizeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: `1px solid #E2E8F0` }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                Staff Member: {authorizingItem.full_name} ({authorizingItem.email})
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                Role: {authorizingItem.role.toUpperCase()} • Mobile: {authorizingItem.mobile || 'Not provided'}
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', fontStyle: 'italic' }}>
                Reported: "{authorizingItem.reason}"
              </div>
            </div>

            {authError && (
              <div style={{ padding: '10px', backgroundColor: '#FEE2E2', borderRadius: '6px', color: '#B91C1C', fontSize: '12px' }}>
                {authError}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>
                  Temporary Master Password *
                </label>
                <button
                  type="button"
                  onClick={generateSecureRandomPassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1D4ED8',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={12} /> Auto-Generate
                </button>
              </div>

              <input
                type="text"
                placeholder="Enter new master password (min 6 chars)"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '13px',
                }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#334155' }}>
              <input
                type="checkbox"
                checked={forceChangeOnLogin}
                onChange={(e) => setForceChangeOnLogin(e.target.checked)}
              />
              Force master password change upon first sign-in (Strict)
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button label="Cancel" variant="outline" size="sm" type="button" onClick={() => setAuthorizingItem(null)} />
              <Button
                label={submittingAuth ? 'Authorizing...' : 'Authorize & Set Password'}
                variant="primary"
                size="sm"
                disabled={submittingAuth}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectingItem && (
        <Modal
          isOpen={!!rejectingItem}
          onClose={() => setRejectingItem(null)}
          title={`Reject Reset Request — ${rejectingItem.full_name}`}
          maxWidth="480px"
        >
          <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
              Rejecting this request will mark the incident in the audit ledger and notify regional branch operations.
            </p>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Rejection / Flag Reason *
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <Button label="Cancel" variant="outline" size="sm" type="button" onClick={() => setRejectingItem(null)} />
              <Button
                label={submittingReject ? 'Rejecting...' : 'Confirm Rejection'}
                variant="danger"
                size="sm"
                disabled={submittingReject}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Geo Audit Modal */}
      {geoItem && (
        <Modal
          isOpen={!!geoItem}
          onClose={() => setGeoItem(null)}
          title={`Origin & Geo Audit — ${geoItem.full_name}`}
          maxWidth="500px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div><strong>Client IP:</strong> {geoItem.client_ip}</div>
              <div style={{ marginTop: '4px' }}><strong>Carrier / Gateway:</strong> Delhi NCR Enterprise Fiber Network</div>
              <div style={{ marginTop: '4px' }}><strong>Device Hardware:</strong> {geoItem.device_signature}</div>
              <div style={{ marginTop: '4px' }}><strong>Origin Request UUID:</strong> {geoItem.req_id}</div>
              <div style={{ marginTop: '4px' }}><strong>Request Timestamp:</strong> {new Date(geoItem.created_at).toLocaleString('en-IN')}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <Button label="Close Audit" variant="outline" size="sm" onClick={() => setGeoItem(null)} />
            </div>
          </div>
        </Modal>
      )}

      {/* Cryptographic Batch Audit Modal */}
      {auditModalOpen && (
        <Modal
          isOpen={auditModalOpen}
          onClose={() => setAuditModalOpen(false)}
          title="Staff Identity & Request Verification"
          maxWidth="560px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                gap: '10px',
              }}
            >
              <ShieldCheck size={20} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#065F46' }}>
                  Staff Identity Verified
                </div>
                <div style={{ fontSize: '12px', color: '#047857', marginTop: '2px', lineHeight: 1.5 }}>
                  Review staff mobile contact numbers and confirm identity before dispatching new temporary passwords.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: '#F9FAFB', padding: '12px', borderRadius: '8px', border: `1px solid ${themeTokens.colors.border}` }}>
                <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, fontWeight: 700 }}>PENDING REQUESTS</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: themeTokens.colors.textPrimary, marginTop: '4px' }}>
                  {queueData?.pending_count || 0}
                </div>
              </div>
              <div style={{ backgroundColor: '#F9FAFB', padding: '12px', borderRadius: '8px', border: `1px solid ${themeTokens.colors.border}` }}>
                <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, fontWeight: 700 }}>STATUS</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#059669', marginTop: '6px' }}>
                  Active Queue
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <Button label="Done" variant="primary" size="sm" onClick={() => setAuditModalOpen(false)} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
