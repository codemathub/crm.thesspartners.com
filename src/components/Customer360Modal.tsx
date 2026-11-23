import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { themeTokens } from '../theme/tokens';
import {
  api,
} from '../services/api';
import {
  Phone,
  Mail,
  Clock,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Plus,
} from 'lucide-react';

interface Customer360ModalProps {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToEnquiry?: (enquiryId: string) => void;
  onNavigateToProperty?: (propertyId: string) => void;
}

export const Customer360Modal: React.FC<Customer360ModalProps> = ({
  customerId,
  isOpen,
  onClose,
  onNavigateToEnquiry,
  onNavigateToProperty,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'enquiries' | 'visits' | 'followups' | 'matches'>('overview');
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetch360 = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await api.getCustomer360(customerId);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load customer 360:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customerId) {
      fetch360();
      setActiveTab('overview');
    } else {
      setData(null);
    }
  }, [isOpen, customerId]);

  if (!isOpen || !customerId) return null;

  const cust = data?.customer;
  const enquiries = data?.enquiries || [];
  const visits = data?.visits || [];
  const followups = data?.followups || [];
  const matches = data?.matched_properties || [];
  const stats = data?.stats || {
    total_enquiries: 0,
    active_enquiries: 0,
    total_visits: 0,
    pending_visits: 0,
    total_followups: 0,
    pending_followups: 0,
    matched_properties_count: 0,
  };

  const handleAddQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !cust) return;
    if (enquiries.length === 0) {
      alert('This customer does not have any active enquiries yet. Please add an enquiry first to log follow-up notes.');
      return;
    }
    setSubmittingNote(true);
    try {
      await api.createFollowUp({
        enquiry_id: enquiries[0].enquiry_id,
        scheduled_at: new Date().toISOString(),
        notes: newNote.trim(),
      });
      setNewNote('');
      fetch360();
    } catch (err: any) {
      alert(err.message || 'Failed to save note');
    } finally {
      setSubmittingNote(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={cust ? `Customer 360° Profile — ${cust.name}` : 'Loading Customer Dossier...'}
      maxWidth="860px"
    >
      {loading && !data ? (
        <div style={{ padding: '40px', textAlign: 'center', color: themeTokens.colors.textSecondary }}>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>Loading 360-degree customer details...</div>
        </div>
      ) : !cust ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#B91C1C' }}>
          Customer details could not be retrieved.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '78vh', overflowY: 'auto', paddingRight: '4px' }}>
          {/* Header Card */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              border: `1px solid ${themeTokens.colors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '23px',
                  backgroundColor: '#4338CA',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '18px',
                  flexShrink: 0,
                }}
              >
                {cust.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: themeTokens.colors.textPrimary }}>
                    {cust.name}
                  </h3>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#475569', backgroundColor: '#E2E8F0', padding: '1px 6px', borderRadius: '4px' }}>
                    {cust.customer_id}
                  </span>
                  <Badge label={cust.customer_type ? cust.customer_type.toUpperCase() : 'CLIENT'} variant="primary" />
                  <Badge label={cust.priority ? `${cust.priority.toUpperCase()} PRIORITY` : 'WARM'} variant={cust.priority === 'hot' ? 'danger' : 'warning'} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', fontSize: '12px', color: themeTokens.colors.textSecondary }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1E293B', fontWeight: 600 }}>
                    <Phone size={12} color="#4338CA" /> {cust.primary_phone}
                  </span>
                  {cust.secondary_phone && (
                    <span>Alt: {cust.secondary_phone}</span>
                  )}
                  {cust.email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={12} /> {cust.email}
                    </span>
                  )}
                  <span>Registered: {new Date(cust.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                label="Call"
                size="sm"
                variant="outline"
                icon={<Phone size={13} />}
                onClick={() => { window.location.href = `tel:${cust.primary_phone}`; }}
              />
              <Button
                label="WhatsApp"
                size="sm"
                variant="outline"
                icon={<MessageCircle size={13} color="#16A34A" />}
                onClick={() => {
                  const url = `https://wa.me/${cust.primary_phone.replace(/[^0-9]/g, '')}`;
                  window.open(url, '_blank');
                }}
              />
            </div>
          </div>

          {/* 4 KPI Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ backgroundColor: '#EEF2FF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #C7D2FE' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#4338CA', letterSpacing: '0.04em' }}>ACTIVE ENQUIRIES</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#312E81', marginTop: '4px' }}>
                {stats.active_enquiries} <span style={{ fontSize: '12px', fontWeight: 500, color: '#6366F1' }}>/ {stats.total_enquiries} total</span>
              </div>
            </div>
            <div style={{ backgroundColor: '#F0FDF4', padding: '12px 14px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803D', letterSpacing: '0.04em' }}>SITE SHOWINGS</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#14532D', marginTop: '4px' }}>
                {stats.total_visits} <span style={{ fontSize: '12px', fontWeight: 500, color: '#22C55E' }}>({stats.pending_visits} upcoming)</span>
              </div>
            </div>
            <div style={{ backgroundColor: '#FFFBEB', padding: '12px 14px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#B45309', letterSpacing: '0.04em' }}>FOLLOW-UP NOTES</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#78350F', marginTop: '4px' }}>
                {stats.total_followups} <span style={{ fontSize: '12px', fontWeight: 500, color: '#D97706' }}>({stats.pending_followups} pending)</span>
              </div>
            </div>
            <div style={{ backgroundColor: '#FAF5FF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E9D5FF' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7E22CE', letterSpacing: '0.04em' }}>MATCHED INVENTORY</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#581C87', marginTop: '4px' }}>
                {stats.matched_properties_count} <span style={{ fontSize: '12px', fontWeight: 500, color: '#A855F7' }}>units ready</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '6px', borderBottom: `1px solid ${themeTokens.colors.border}`, paddingBottom: '8px' }}>
            {[
              { id: 'overview', label: 'Panoramic 360° Overview' },
              { id: 'enquiries', label: `Enquiries (${enquiries.length})` },
              { id: 'visits', label: `Site Visits (${visits.length})` },
              { id: 'followups', label: `Notes & Calls (${followups.length})` },
              { id: 'matches', label: `Matched Units (${matches.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  backgroundColor: activeTab === tab.id ? '#4338CA' : '#F1F5F9',
                  color: activeTab === tab.id ? '#FFFFFF' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB: Panoramic Overview */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Quick Note Input */}
              <form onSubmit={handleAddQuickNote} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Log quick follow-up note or client preference update..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${themeTokens.colors.border}`,
                    fontSize: '13px',
                  }}
                />
                <Button
                  label={submittingNote ? 'Saving...' : 'Add Note'}
                  size="sm"
                  variant="primary"
                  icon={<Plus size={13} />}
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                />
              </form>

              {/* Active Enquiries Preview */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: themeTokens.colors.textPrimary, marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Active Client Requirements</span>
                  <button
                    onClick={() => setActiveTab('enquiries')}
                    style={{ background: 'none', border: 'none', color: '#4338CA', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    View All ›
                  </button>
                </div>
                {enquiries.length === 0 ? (
                  <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '6px', fontSize: '12px', color: '#6B7280' }}>
                    No enquiries recorded yet for this client.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {enquiries.slice(0, 2).map((enq: any) => (
                      <div
                        key={enq.enquiry_id || enq.id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '6px',
                          border: `1px solid ${themeTokens.colors.border}`,
                          backgroundColor: '#FFFFFF',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                            {enq.looking_for}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                            #{enq.enquiry_id} • Budget: ₹{(enq.budget_min ?? 0).toLocaleString('en-IN')} - ₹{(enq.budget_max ?? 0).toLocaleString('en-IN')}
                            {enq.preferred_locations?.length > 0 && ` • Loc: ${enq.preferred_locations.join(', ')}`}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Badge label={enq.status.replace(/_/g, ' ')} variant="neutral" />
                          {onNavigateToEnquiry && (
                            <Button
                              label=""
                              icon={<ExternalLink size={12} />}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                onClose();
                                onNavigateToEnquiry(enq.enquiry_id);
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Site Showings Preview */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: themeTokens.colors.textPrimary, marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Site Visits & Showings</span>
                  <button
                    onClick={() => setActiveTab('visits')}
                    style={{ background: 'none', border: 'none', color: '#4338CA', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    View All ›
                  </button>
                </div>
                {visits.length === 0 ? (
                  <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '6px', fontSize: '12px', color: '#6B7280' }}>
                    No site visits scheduled or logged yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {visits.slice(0, 2).map((v: any) => (
                      <div
                        key={v.visit_id || v.id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '6px',
                          border: `1px solid ${themeTokens.colors.border}`,
                          backgroundColor: '#FFFFFF',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                            {v.property_id ? `Unit ${v.property_id}` : 'Property Showing'} • {v.society_name || 'Society Scheduled'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                            <Clock size={11} style={{ display: 'inline', marginRight: '4px' }} />
                            {v.scheduled_at ? new Date(v.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Pending Time'}
                            {v.assigned_name && ` • Exec: ${v.assigned_name}`}
                          </div>
                        </div>
                        <Badge label={v.status.replace(/_/g, ' ')} variant={v.status === 'completed' ? 'success' : v.status === 'scheduled' ? 'warning' : 'neutral'} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Property Matches Preview */}
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: themeTokens.colors.textPrimary, marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={14} color="#7C3AED" /> Top Matching Inventory Units
                  </span>
                  <button
                    onClick={() => setActiveTab('matches')}
                    style={{ background: 'none', border: 'none', color: '#4338CA', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    View All {matches.length} Matches ›
                  </button>
                </div>
                {matches.length === 0 ? (
                  <div style={{ padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '6px', fontSize: '12px', color: '#6B7280' }}>
                    No matching inventory units found for the active enquiry budgets.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {matches.slice(0, 2).map((m: any, idx: number) => {
                      const p = m.property;
                      return (
                        <div
                          key={p.property_id || idx}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #DDD6FE',
                            backgroundColor: '#FAF5FF',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: '#4C1D95' }}>
                                {p.property_id} • {p.property_type}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6B21A8', marginTop: '2px' }}>
                                {p.society_name}, {p.location}
                              </div>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#047857', backgroundColor: '#D1FAE5', padding: '2px 8px', borderRadius: '10px' }}>
                              {m.match_score}% Match
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B', marginTop: '6px' }}>
                            ₹{(p.expected_amount ?? 0).toLocaleString('en-IN')}{p.transaction_type === 'rent' ? '/mo' : ''}
                          </div>
                          {onNavigateToProperty && (
                            <div style={{ marginTop: '8px', textAlign: 'right' }}>
                              <Button
                                label="View Unit"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  onClose();
                                  onNavigateToProperty(p.property_id);
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Enquiries */}
          {activeTab === 'enquiries' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {enquiries.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
                  No enquiries recorded.
                </div>
              ) : (
                enquiries.map((enq: any) => (
                  <div
                    key={enq.enquiry_id || enq.id}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      border: `1px solid ${themeTokens.colors.border}`,
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>
                            {enq.looking_for}
                          </span>
                          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748B', fontWeight: 700 }}>
                            #{enq.enquiry_id}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                          Budget: <strong>₹{(enq.budget_min ?? 0).toLocaleString('en-IN')} - ₹{(enq.budget_max ?? 0).toLocaleString('en-IN')}</strong> ({enq.transaction_type?.toUpperCase()})
                        </div>
                      </div>
                      <Badge label={enq.status.replace(/_/g, ' ')} variant="neutral" />
                    </div>

                    {enq.preferred_societies?.length > 0 && (
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>
                        Preferred Societies: {enq.preferred_societies.join(', ')}
                      </div>
                    )}
                    {enq.notes && (
                      <div style={{ fontSize: '11px', color: '#334155', fontStyle: 'italic', marginTop: '4px' }}>
                        "{enq.notes}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: Visits */}
          {activeTab === 'visits' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {visits.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
                  No showings or site visits logged.
                </div>
              ) : (
                visits.map((v: any) => (
                  <div
                    key={v.visit_id || v.id}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      border: `1px solid ${themeTokens.colors.border}`,
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>
                          {v.property_id ? `Showing: Unit #${v.property_id}` : 'Site Visit'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                          Scheduled: {v.scheduled_at ? new Date(v.scheduled_at).toLocaleString() : 'TBD'}
                        </div>
                        {v.assigned_name && (
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                            Executive In-Charge: <strong>{v.assigned_name}</strong>
                          </div>
                        )}
                      </div>
                      <Badge label={v.status} variant={v.status === 'completed' ? 'success' : 'warning'} />
                    </div>
                    {v.notes && (
                      <div style={{ fontSize: '11px', color: '#334155', fontStyle: 'italic', marginTop: '6px' }}>
                        Feedback: "{v.notes}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: Follow-ups */}
          {activeTab === 'followups' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <form onSubmit={handleAddQuickNote} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Record new interaction or phone call note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${themeTokens.colors.border}`,
                    fontSize: '13px',
                  }}
                />
                <Button
                  label={submittingNote ? 'Saving...' : 'Add Note'}
                  size="sm"
                  variant="primary"
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                />
              </form>

              {followups.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
                  No past discussion notes found.
                </div>
              ) : (
                followups.map((f: any) => (
                  <div
                    key={f.followup_id || f.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${themeTokens.colors.border}`,
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                        {f.scheduled_date || new Date(f.created_at).toLocaleDateString()}
                      </span>
                      <Badge label={f.status} variant={f.status === 'completed' ? 'success' : 'neutral'} />
                    </div>
                    <div style={{ fontSize: '13px', color: '#1E293B', marginTop: '4px' }}>
                      {f.notes}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: Matched Units */}
          {activeTab === 'matches' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {matches.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
                  No available inventory matching current enquiry parameters.
                </div>
              ) : (
                matches.map((m: any, idx: number) => {
                  const p = m.property;
                  return (
                    <div
                      key={p.property_id || idx}
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>
                            {p.property_id} • {p.property_type}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#047857', backgroundColor: '#D1FAE5', padding: '2px 8px', borderRadius: '10px' }}>
                            {m.match_score}% Match
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>
                          {p.society_name}, {p.location} • <strong>₹{(p.expected_amount ?? 0).toLocaleString('en-IN')}{p.transaction_type === 'rent' ? '/mo' : ''}</strong>
                        </div>
                        {m.match_reasons?.length > 0 && (
                          <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                            {m.match_reasons.map((r: string, rIdx: number) => (
                              <span key={rIdx} style={{ fontSize: '10px', backgroundColor: '#F1F5F9', color: '#475569', padding: '1px 6px', borderRadius: '4px' }}>
                                ✓ {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button
                          label="WhatsApp Share"
                          size="sm"
                          variant="outline"
                          icon={<MessageCircle size={12} color="#16A34A" />}
                          onClick={() => {
                            const text = `*EstateCRM Property Match*\nUnit: ${p.property_id} (${p.property_type})\nSociety: ${p.society_name}, ${p.location}\nAmount: ₹${(p.expected_amount ?? 0).toLocaleString('en-IN')}${p.transaction_type === 'rent' ? '/month' : ''}\nStatus: Available`;
                            const url = `https://wa.me/${cust.primary_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
                            window.open(url, '_blank');
                          }}
                        />
                        {onNavigateToProperty && (
                          <Button
                            label="View Unit"
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              onClose();
                              onNavigateToProperty(p.property_id);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
