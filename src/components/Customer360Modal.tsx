import React, { useState, useEffect } from 'react';
import { formatDateTime, formatDate } from '../utils/dateUtils';
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
  Calendar,
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
  const [showClosedEnquiries, setShowClosedEnquiries] = useState(false);

  // Schedule Showing Modal State inside Customer Details
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleProp, setScheduleProp] = useState<any>(null);
  const [scheduleEnquiryId, setScheduleEnquiryId] = useState('');
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [submittingSchedule, setSubmittingSchedule] = useState(false);

  const handleOpenScheduleModal = (prop: any) => {
    setScheduleProp(prop);
    const activeEnq = (data?.enquiries || []).find((e: any) => !['deal_closed', 'aborted', 'cancelled'].includes(e.status)) || data?.enquiries?.[0];
    setScheduleEnquiryId(activeEnq?.enquiry_id || '');
    const now = new Date();
    now.setHours(now.getHours() + 2);
    now.setMinutes(0);
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setScheduleDateTime(localIso);
    setScheduleNotes(`Client site visit showing for unit #${prop.property_id} at ${prop.society_name || 'Society'}`);
    setScheduleModalOpen(true);
  };

  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleEnquiryId || !scheduleProp || !scheduleDateTime) {
      alert('Please select an active enquiry and visit date/time.');
      return;
    }
    setSubmittingSchedule(true);
    try {
      await api.createVisit({
        enquiry_id: scheduleEnquiryId,
        property_id: scheduleProp.property_id,
        scheduled_at: new Date(scheduleDateTime).toISOString(),
        notes: scheduleNotes.trim() || undefined,
      });
      alert(`Site showing scheduled for Unit #${scheduleProp.property_id}!`);
      setScheduleModalOpen(false);
      setScheduleProp(null);
      await fetch360();
      setActiveTab('visits');
    } catch (err: any) {
      alert(err.message || 'Failed to schedule visit.');
    } finally {
      setSubmittingSchedule(false);
    }
  };

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
      title={cust ? `Customer Details — ${cust.name}` : 'Loading Customer Details...'}
      maxWidth="860px"
    >
      {loading && !data ? (
        <div style={{ padding: '40px', textAlign: 'center', color: themeTokens.colors.textSecondary }}>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>Loading customer details...</div>
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
                  <span>Registered: {formatDate(cust.created_at)}</span>
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
              { id: 'overview', label: 'Customer Overview & Details' },
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
                            {v.scheduled_at ? formatDateTime(v.scheduled_at) : 'Pending Time'}
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
                          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <Button
                              label="Schedule Showing"
                              size="sm"
                              variant="primary"
                              icon={<Calendar size={12} />}
                              onClick={() => handleOpenScheduleModal(p)}
                            />
                            {onNavigateToProperty && (
                              <Button
                                label="View Unit"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  onClose();
                                  onNavigateToProperty(p.property_id);
                                }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: Enquiries */}
          {activeTab === 'enquiries' && (() => {
            const activeEnqs = enquiries.filter((e: any) => !['deal_closed', 'aborted', 'closed_won', 'closed_lost', 'cancelled'].includes(e.status));
            const closedCount = enquiries.length - activeEnqs.length;
            const displayed = showClosedEnquiries ? enquiries : activeEnqs;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    {showClosedEnquiries ? `All Enquiries (${enquiries.length})` : `Active Requirements (${activeEnqs.length})`}
                  </span>
                  {closedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowClosedEnquiries(!showClosedEnquiries)}
                      style={{
                        background: 'none',
                        border: '1px solid #CBD5E1',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#4338CA',
                        cursor: 'pointer',
                      }}
                    >
                      {showClosedEnquiries ? 'Hide Closed / Dropped' : `Show Closed / Dropped (${closedCount})`}
                    </button>
                  )}
                </div>

                {displayed.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
                    {showClosedEnquiries ? 'No enquiries recorded.' : 'No active enquiries. Click "Show Closed" to view past history.'}
                  </div>
                ) : (
                  displayed.map((enq: any) => (
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
                        <Badge label={enq.status.replace(/_/g, ' ')} variant={enq.status === 'deal_closed' ? 'success' : enq.status === 'aborted' ? 'danger' : 'neutral'} />
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
            );
          })()}

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
                          Scheduled: {v.scheduled_at ? formatDateTime(v.scheduled_at) : 'TBD'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          Showing Executive: <strong>{v.assigned_name || v.claimed_by_name || 'Bhaskar Joshi'}</strong>
                        </div>
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
                        {formatDateTime(f.scheduled_date || f.created_at)}
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
                          label="Schedule Showing"
                          size="sm"
                          variant="primary"
                          icon={<Calendar size={12} />}
                          onClick={() => handleOpenScheduleModal(p)}
                        />
                        <Button
                          label="WhatsApp Share"
                          size="sm"
                          variant="outline"
                          icon={<MessageCircle size={12} color="#16A34A" />}
                          onClick={() => {
                            const text = `*G² Brothers CRM Property Match*\nUnit: ${p.property_id} (${p.property_type})\nSociety: ${p.society_name}, ${p.location}\nAmount: ₹${(p.expected_amount ?? 0).toLocaleString('en-IN')}${p.transaction_type === 'rent' ? '/month' : ''}\nStatus: Available`;
                            const url = `https://wa.me/${cust.primary_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
                            window.open(url, '_blank');
                          }}
                        />
                        {onNavigateToProperty && (
                          <Button
                            label="View Unit"
                            size="sm"
                            variant="outline"
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

      {/* Internal Schedule Site Showing Modal */}
      {scheduleModalOpen && scheduleProp && (
        <Modal
          isOpen={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          title={`Schedule Site Showing — Unit #${scheduleProp.property_id}`}
          maxWidth="520px"
        >
          <form onSubmit={handleConfirmSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Property Summary Pill */}
            <div
              style={{
                backgroundColor: '#FAF5FF',
                border: '1px solid #DDD6FE',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#4C1D95' }}>
                  #{scheduleProp.property_id} • {scheduleProp.society_name}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#EDE9FE',
                    color: '#6D28D9',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {scheduleProp.transaction_type?.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#6B21A8', marginTop: '4px' }}>
                {scheduleProp.bhk || scheduleProp.property_type} • {scheduleProp.location} • ₹{(scheduleProp.expected_amount || 0).toLocaleString('en-IN')}{scheduleProp.transaction_type === 'rent' ? '/mo' : ''}
              </div>
            </div>

            {/* Client summary */}
            {cust && (
              <div style={{ fontSize: '12px', color: '#475569', backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: '6px' }}>
                Client: <strong>{cust.name}</strong> ({cust.primary_phone})
              </div>
            )}

            {/* Target Enquiry Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Target Requirement / Enquiry *
              </label>
              {enquiries.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#B91C1C', backgroundColor: '#FEF2F2', padding: '8px 12px', borderRadius: '6px' }}>
                  This customer has no active requirements. Please add an enquiry first.
                </div>
              ) : (
                <select
                  value={scheduleEnquiryId}
                  onChange={(e) => setScheduleEnquiryId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    backgroundColor: '#FFFFFF',
                  }}
                  required
                >
                  {enquiries.map((e: any) => (
                    <option key={e.enquiry_id} value={e.enquiry_id}>
                      #{e.enquiry_id} — {e.looking_for || e.requirement_summary || 'Requirement'} ({e.transaction_type?.toUpperCase()})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Showing Date & Time */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Showing Date & Time *
              </label>
              <input
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Showing Instructions & Notes
              </label>
              <textarea
                value={scheduleNotes}
                onChange={(e) => setScheduleNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Client requested evening showing, wants clubhouse tour"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button
                label="Cancel"
                variant="outline"
                size="sm"
                onClick={() => setScheduleModalOpen(false)}
                type="button"
              />
              <Button
                label={submittingSchedule ? 'Scheduling...' : 'Confirm Visit'}
                variant="primary"
                size="sm"
                disabled={submittingSchedule || !scheduleEnquiryId || !scheduleDateTime}
                type="submit"
              />
            </div>
          </form>
        </Modal>
      )}
    </Modal>
  );
};
