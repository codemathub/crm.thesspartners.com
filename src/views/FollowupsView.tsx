import React, { useState, useEffect } from 'react';
import { themeTokens } from '../theme/tokens';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Table, Column } from '../components/ui/Table';
import {
  api,
  FollowUp,
  CalendarAgendaItem,
} from '../services/api';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  RotateCcw,
  XCircle,
  Search,
  RefreshCw,
  Phone,
  MessageSquare,
} from 'lucide-react';

export const FollowupsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'overdue' | 'upcoming' | 'completed' | 'agenda'>('today');
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [agenda, setAgenda] = useState<CalendarAgendaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [overdueCount, setOverdueCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [completeModalItem, setCompleteModalItem] = useState<FollowUp | null>(null);
  const [rescheduleModalItem, setRescheduleModalItem] = useState<FollowUp | null>(null);
  const [cancelModalItem, setCancelModalItem] = useState<FollowUp | null>(null);
  const [selectedFollowupDetail, setSelectedFollowupDetail] = useState<FollowUp | null>(null);
  const [followupHistory, setFollowupHistory] = useState<FollowUp[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const openFollowupDetail = async (item: FollowUp) => {
    setSelectedFollowupDetail(item);
    setLoadingHistory(true);
    try {
      const res = await api.getFollowUps({
        customer_id: item.customer_id,
      });
      setFollowupHistory(res.items || []);
    } catch {
      setFollowupHistory([item]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Schedule Follow-up Form
  const [newEnquiryId, setNewEnquiryId] = useState('');
  const [newScheduledAt, setNewScheduledAt] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [submittingSchedule, setSubmittingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  // Complete Follow-up Form
  const [completeOutcome, setCompleteOutcome] = useState('Client Interested - Requested Callback');
  const [completeRemarks, setCompleteRemarks] = useState('');
  const [chainNext, setChainNext] = useState(false);
  const [nextScheduledAt, setNextScheduledAt] = useState('');
  const [nextNotes, setNextNotes] = useState('');
  const [submittingComplete, setSubmittingComplete] = useState(false);

  // Reschedule Form
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  // Cancel Form
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      if (activeTab === 'agenda') {
        const today = new Date();
        const startStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const endStr = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];
        const res = await api.getCalendarAgenda(startStr, endStr);
        setAgenda(res);
      } else {
        const rangeParam = activeTab === 'all' ? undefined : activeTab;
        const res = await api.getFollowUps({
          range: rangeParam,
          search: search.trim() || undefined,
        });
        setFollowups(res.items);
        setOverdueCount(res.overdue_count);
        setTodayCount(res.today_count);
        setUpcomingCount(res.upcoming_count);
        setTotalCount(res.total);
      }
    } catch (err: any) {
      console.error('Failed to load follow-ups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFollowUps();
  };

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleError('');
    if (!newEnquiryId.trim() || !newScheduledAt || !newNotes.trim()) {
      setScheduleError('Please fill all required fields');
      return;
    }
    setSubmittingSchedule(true);
    try {
      await api.createFollowUp({
        enquiry_id: newEnquiryId.trim().toUpperCase(),
        scheduled_at: new Date(newScheduledAt).toISOString(),
        notes: newNotes.trim(),
      });
      setScheduleModalOpen(false);
      setNewEnquiryId('');
      setNewScheduledAt('');
      setNewNotes('');
      fetchFollowUps();
    } catch (err: any) {
      setScheduleError(err.message || 'Failed to schedule follow-up');
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalItem) return;
    setSubmittingComplete(true);
    try {
      await api.completeFollowUp(completeModalItem.followup_id, {
        outcome: completeOutcome,
        remarks: completeRemarks.trim() || undefined,
        next_followup_at: chainNext && nextScheduledAt ? new Date(nextScheduledAt).toISOString() : undefined,
        next_followup_notes: chainNext && nextNotes ? nextNotes.trim() : undefined,
      });
      setCompleteModalItem(null);
      setCompleteRemarks('');
      setChainNext(false);
      setNextScheduledAt('');
      setNextNotes('');
      fetchFollowUps();
    } catch (err: any) {
      alert(err.message || 'Failed to complete follow-up');
    } finally {
      setSubmittingComplete(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalItem || !rescheduleDate || !rescheduleReason.trim()) {
      alert('Please select a new date and enter reason for reschedule.');
      return;
    }
    setSubmittingReschedule(true);
    try {
      await api.rescheduleFollowUp(rescheduleModalItem.followup_id, {
        new_scheduled_at: new Date(rescheduleDate).toISOString(),
        reason: rescheduleReason.trim(),
      });
      setRescheduleModalItem(null);
      setRescheduleDate('');
      setRescheduleReason('');
      fetchFollowUps();
    } catch (err: any) {
      alert(err.message || 'Failed to reschedule follow-up');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalItem || !cancelReason.trim()) {
      alert('Please enter reason for cancellation.');
      return;
    }
    setSubmittingCancel(true);
    try {
      await api.cancelFollowUp(cancelModalItem.followup_id, cancelReason.trim());
      setCancelModalItem(null);
      setCancelReason('');
      fetchFollowUps();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel follow-up');
    } finally {
      setSubmittingCancel(false);
    }
  };

  const columns: Column<FollowUp>[] = [
    {
      header: 'ID / Client',
      key: 'followup_id',
      render: (item) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: themeTokens.colors.primaryDark }}>
              #{item.followup_id}
            </span>
            <span style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>({item.customer_id})</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '2px', color: themeTokens.colors.textPrimary }}>
            {item.customer_name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '12px', color: themeTokens.colors.textSecondary }}>{item.customer_phone}</span>
            <a
              href={`tel:${item.customer_phone}`}
              title="Call"
              style={{ color: themeTokens.colors.primaryDark, display: 'inline-flex', alignItems: 'center' }}
            >
              <Phone size={13} />
            </a>
            <a
              href={`https://wa.me/${item.customer_phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              title="WhatsApp"
              style={{ color: '#25D366', display: 'inline-flex', alignItems: 'center' }}
            >
              <MessageSquare size={13} />
            </a>
          </div>
        </div>
      ),
    },
    {
      header: 'Enquiry & Objective',
      key: 'enquiry_id',
      render: (item) => (
        <div style={{ maxWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: themeTokens.colors.primaryDark }}>
              {item.enquiry_id}
            </span>
            {item.enquiry_requirement && (
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: themeTokens.colors.softSurface,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  color: themeTokens.colors.textSecondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '180px',
                }}
              >
                {item.enquiry_requirement}
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: themeTokens.colors.textPrimary,
              marginTop: '4px',
              lineHeight: 1.4,
              fontStyle: 'italic',
            }}
          >
            "{item.notes}"
          </div>
        </div>
      ),
    },
    {
      header: 'Scheduled Date & Time',
      key: 'scheduled_at',
      render: (item) => {
        const sched = new Date(item.scheduled_at);
        const isPast = sched < new Date() && item.status !== 'completed' && item.status !== 'cancelled';
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} color={isPast ? themeTokens.colors.danger : themeTokens.colors.textSecondary} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: isPast ? themeTokens.colors.danger : themeTokens.colors.textPrimary }}>
                {sched.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: themeTokens.colors.textSecondary, marginLeft: '19px' }}>
              {sched.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
            {isPast && (
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '10px',
                  fontWeight: 700,
                  backgroundColor: '#FDE8E8',
                  color: '#9B1C1C',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  marginTop: '4px',
                }}
              >
                OVERDUE
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Assigned Exec',
      key: 'responsible_name',
      render: (item) => (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: themeTokens.colors.textPrimary }}>
            {item.responsible_name || 'Assigned Executive'}
          </div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>Lead Owner</div>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (item) => {
        const variantMap: Record<string, 'success' | 'warning' | 'danger' | 'primary' | 'neutral'> = {
          completed: 'success',
          scheduled: 'primary',
          due: 'danger',
          missed: 'danger',
          cancelled: 'neutral',
        };
        return <Badge label={item.status.toUpperCase()} variant={variantMap[item.status] || 'neutral'} />;
      },
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (item) => {
        if (item.status === 'completed') {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ fontSize: '11px', color: '#03543F' }}>
                <strong>Completed:</strong> {item.outcome || 'Success'}
              </div>
              <Button
                size="sm"
                variant="outline"
                label="Details"
                onClick={() => openFollowupDetail(item)}
              />
            </div>
          );
        }
        if (item.status === 'cancelled') {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>
                Cancelled: {item.cancellation_reason}
              </div>
              <Button
                size="sm"
                variant="outline"
                label="Details"
                onClick={() => openFollowupDetail(item)}
              />
            </div>
          );
        }

        return (
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button
              size="sm"
              variant="outline"
              label="Details"
              onClick={() => openFollowupDetail(item)}
            />
            <Button
              size="sm"
              variant="primary"
              label="Complete"
              icon={<CheckCircle2 size={13} />}
              onClick={() => {
                setCompleteModalItem(item);
                setCompleteOutcome('Client Interested - Requested Callback');
                setCompleteRemarks('');
                setChainNext(false);
              }}
            />
            <Button
              size="sm"
              variant="secondary"
              label="Reschedule"
              icon={<RotateCcw size={13} />}
              onClick={() => {
                setRescheduleModalItem(item);
                setRescheduleDate('');
                setRescheduleReason('');
              }}
            />
            <Button
              size="sm"
              variant="outline"
              label="Cancel"
              icon={<XCircle size={13} color={themeTokens.colors.danger} />}
              onClick={() => {
                setCancelModalItem(item);
                setCancelReason('');
              }}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Stitch Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          padding: '20px 24px',
          borderRadius: '12px',
          border: `1px solid ${themeTokens.colors.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color={themeTokens.colors.primaryDark} />
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: themeTokens.colors.textPrimary, margin: 0 }}>
              Follow-ups & Company Calendar
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: themeTokens.colors.textSecondary, margin: '4px 0 0 0' }}>
            Authoritative dynamic derivation of enquiry follow-up timestamps (PRD Section 5.12)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            variant="primary"
            label="+ Schedule Follow-up"
            icon={<Plus size={16} />}
            onClick={() => setScheduleModalOpen(true)}
          />
          <Button
            variant="outline"
            label="Refresh"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={fetchFollowUps}
          />
        </div>
      </div>

      {/* KPI Cards Row Matching Stitch Styling */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '16px',
            border: `1px solid ${themeTokens.colors.border}`,
            borderLeft: `4px solid ${themeTokens.colors.danger}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: themeTokens.colors.textSecondary }}>
              Overdue Actions
            </span>
            <AlertCircle size={16} color={themeTokens.colors.danger} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: themeTokens.colors.danger, marginTop: '8px' }}>
            {overdueCount}
          </div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '4px' }}>
            Requires immediate executive attention
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '16px',
            border: `1px solid ${themeTokens.colors.border}`,
            borderLeft: `4px solid ${themeTokens.colors.warning}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: themeTokens.colors.textSecondary }}>
              Today's Cadence
            </span>
            <Clock size={16} color={themeTokens.colors.warning} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: themeTokens.colors.textPrimary, marginTop: '8px' }}>
            {todayCount}
          </div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '4px' }}>
            Scheduled for today's calling roster
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '16px',
            border: `1px solid ${themeTokens.colors.border}`,
            borderLeft: `4px solid ${themeTokens.colors.primaryDark}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: themeTokens.colors.textSecondary }}>
              Upcoming Pipeline
            </span>
            <Calendar size={16} color={themeTokens.colors.primaryDark} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: themeTokens.colors.primaryDark, marginTop: '8px' }}>
            {upcomingCount}
          </div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '4px' }}>
            Future scheduled client touches
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '16px',
            border: `1px solid ${themeTokens.colors.border}`,
            borderLeft: `4px solid ${themeTokens.colors.success}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: themeTokens.colors.textSecondary }}>
              Total Logged Records
            </span>
            <CheckCircle2 size={16} color={themeTokens.colors.success} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: themeTokens.colors.textPrimary, marginTop: '8px' }}>
            {totalCount}
          </div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '4px' }}>
            Across all active enquiry portfolios
          </div>
        </div>
      </div>

      {/* Tabs and Search Controls */}
      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Stitch Pills Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'today', label: `Today (${todayCount})` },
              { id: 'overdue', label: `Overdue (${overdueCount})` },
              { id: 'upcoming', label: `Upcoming (${upcomingCount})` },
              { id: 'completed', label: 'Completed' },
              { id: 'all', label: `All (${totalCount})` },
              { id: 'agenda', label: 'Calendar Agenda' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor:
                    activeTab === tab.id ? themeTokens.colors.primaryDark : themeTokens.colors.softSurface,
                  color: activeTab === tab.id ? '#FFFFFF' : themeTokens.colors.textSecondary,
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          {activeTab !== 'agenda' && (
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: themeTokens.colors.softSurface,
                  borderRadius: '8px',
                  padding: '4px 10px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  width: '260px',
                }}
              >
                <Search size={14} color={themeTokens.colors.textSecondary} style={{ marginRight: '6px' }} />
                <input
                  type="text"
                  placeholder="Filter name, phone, enquiry..."
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    fontSize: '12px',
                    width: '100%',
                  }}
                />
              </div>
              <Button type="submit" size="sm" variant="secondary" label="Filter" />
            </form>
          )}
        </div>

        {/* Tab Content: Calendar Agenda vs Table */}
        {activeTab === 'agenda' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {agenda.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: themeTokens.colors.textSecondary }}>
                No scheduled follow-ups found in company calendar.
              </div>
            ) : (
              agenda.map((day) => (
                <div
                  key={day.date}
                  style={{
                    backgroundColor: themeTokens.colors.softSurface,
                    borderRadius: '8px',
                    padding: '14px',
                    border: `1px solid ${themeTokens.colors.border}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '13px', color: themeTokens.colors.primaryDark }}>
                      📅 {new Date(day.date + 'T00:00:00Z').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <Badge label={`${day.total_count} Follow-up${day.total_count > 1 ? 's' : ''}`} variant="primary" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {day.followups.map((f) => (
                      <div
                        key={f.id}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '6px',
                          padding: '10px 14px',
                          border: `1px solid ${themeTokens.colors.border}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: themeTokens.colors.textPrimary }}>
                            {f.customer_name} ({f.customer_phone}) •{' '}
                            <span style={{ color: themeTokens.colors.primaryDark }}>{f.enquiry_id}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
                            ⏰ {new Date(f.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} — "{f.notes}"
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button
                            size="sm"
                            variant="primary"
                            label="Complete"
                            onClick={() => {
                              setCompleteModalItem(f);
                              setCompleteOutcome('Client Interested - Requested Callback');
                              setCompleteRemarks('');
                              setChainNext(false);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <Table
            columns={columns as any}
            data={followups}
            keyExtractor={(item: any) => item.id}
            onRowClick={(item: any) => openFollowupDetail(item)}
          />
        )}
      </Card>

      {/* Modal 1: Schedule Follow-up */}
      {scheduleModalOpen && (
        <Modal
          isOpen={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          title="Schedule Customer Follow-up"
          maxWidth="520px"
        >
          <form onSubmit={handleCreateFollowUp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {scheduleError && (
              <div
                style={{
                  backgroundColor: '#FDE8E8',
                  color: '#9B1C1C',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                {scheduleError}
              </div>
            )}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Enquiry ID *
              </label>
              <input
                type="text"
                placeholder="e.g. ENQ00001"
                value={newEnquiryId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEnquiryId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Scheduled Date & Time *
              </label>
              <input
                type="datetime-local"
                value={newScheduledAt}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewScheduledAt(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: themeTokens.colors.textSecondary, marginBottom: '6px', display: 'block' }}>
                Follow-up Notes / Call Objective *
              </label>
              <textarea
                rows={3}
                placeholder="Enter follow-up discussion notes, client requirements, or next steps."
                value={newNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="outline" label="Cancel" onClick={() => setScheduleModalOpen(false)} />
              <Button type="submit" variant="primary" label={submittingSchedule ? 'Scheduling...' : 'Save & Sync Next Date'} disabled={submittingSchedule} />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 2: Complete Follow-up (with Next Follow-up Chaining) */}
      {completeModalItem && (
        <Modal
          isOpen={Boolean(completeModalItem)}
          onClose={() => setCompleteModalItem(null)}
          title={`Complete Follow-up #${completeModalItem.followup_id}`}
          maxWidth="560px"
        >
          <form onSubmit={handleCompleteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                backgroundColor: themeTokens.colors.softSurface,
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            >
              <div>
                <strong>Client:</strong> {completeModalItem.customer_name} ({completeModalItem.customer_phone})
              </div>
              <div style={{ marginTop: '2px' }}>
                <strong>Enquiry:</strong> {completeModalItem.enquiry_id} — "{completeModalItem.notes}"
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Call / Meeting Outcome *
              </label>
              <select
                value={completeOutcome}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCompleteOutcome(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              >
                <option value="Client Interested - Requested Callback">Client Interested - Requested Callback</option>
                <option value="Scheduled Site Visit">Scheduled Site Visit</option>
                <option value="Budget Negotiating / Under Review">Budget Negotiating / Under Review</option>
                <option value="Unreachable / Call Not Answered">Unreachable / Call Not Answered</option>
                <option value="Not Interested / Closing Requirement">Not Interested / Closing Requirement</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: themeTokens.colors.textSecondary, marginBottom: '6px', display: 'block' }}>
                Outcome Remarks / Conversation Summary
              </label>
              <textarea
                rows={3}
                placeholder="Key takeaways from conversation, feedback on societies, next preferences..."
                value={completeRemarks}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCompleteRemarks(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Chaining Next Follow-up */}
            <div
              style={{
                borderTop: `1px solid ${themeTokens.colors.border}`,
                paddingTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={chainNext}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChainNext(e.target.checked)}
                />
                Schedule Next Follow-up in Chain (Continuous Relationship)
              </label>

              {chainNext && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '22px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Next Scheduled Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={nextScheduledAt}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNextScheduledAt(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${themeTokens.colors.border}`,
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                      required={chainNext}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Next Follow-up Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Call to confirm family site visit on Saturday morning"
                      value={nextNotes}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNextNotes(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${themeTokens.colors.border}`,
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="outline" label="Cancel" onClick={() => setCompleteModalItem(null)} />
              <Button type="submit" variant="primary" label={submittingComplete ? 'Saving...' : 'Record Outcome & Sync Lead'} disabled={submittingComplete} />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 3: Reschedule Follow-up */}
      {rescheduleModalItem && (
        <Modal
          isOpen={Boolean(rescheduleModalItem)}
          onClose={() => setRescheduleModalItem(null)}
          title={`Reschedule Follow-up #${rescheduleModalItem.followup_id}`}
          maxWidth="480px"
        >
          <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                New Scheduled Date & Time *
              </label>
              <input
                type="datetime-local"
                value={rescheduleDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRescheduleDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Reason for Reschedule *
              </label>
              <input
                type="text"
                placeholder="e.g. Client traveling; requested callback on Friday."
                value={rescheduleReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRescheduleReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="outline" label="Cancel" onClick={() => setRescheduleModalItem(null)} />
              <Button type="submit" variant="primary" label={submittingReschedule ? 'Rescheduling...' : 'Confirm Reschedule'} disabled={submittingReschedule} />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 4: Cancel Follow-up */}
      {cancelModalItem && (
        <Modal
          isOpen={Boolean(cancelModalItem)}
          onClose={() => setCancelModalItem(null)}
          title={`Cancel Follow-up #${cancelModalItem.followup_id}`}
          maxWidth="480px"
        >
          <form onSubmit={handleCancelSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: themeTokens.colors.textSecondary }}>
              Cancelling this follow-up will remove it from active calling rosters and recalculate next follow-up dates.
            </p>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Cancellation Reason *
              </label>
              <input
                type="text"
                placeholder="e.g. Enquiry converted to visit; or lead decided not to move."
                value={cancelReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCancelReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="outline" label="Close" onClick={() => setCancelModalItem(null)} />
              <Button
                type="submit"
                variant="danger"
                label={submittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                disabled={submittingCancel}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 5: Full Follow-up Details & Customer Touch History */}
      {selectedFollowupDetail && (
        <Modal
          isOpen={Boolean(selectedFollowupDetail)}
          onClose={() => setSelectedFollowupDetail(null)}
          title={`Follow-up Details: #${selectedFollowupDetail.followup_id} • ${selectedFollowupDetail.customer_name}`}
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Customer & Contact Summary */}
            <div
              style={{
                backgroundColor: themeTokens.colors.softSurface,
                borderRadius: '8px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: `1px solid ${themeTokens.colors.border}`,
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: themeTokens.colors.primaryDark, textTransform: 'uppercase' }}>
                  Customer Profile
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: themeTokens.colors.textPrimary, marginTop: '2px' }}>
                  {selectedFollowupDetail.customer_name}
                </div>
                <div style={{ fontSize: '13px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
                  {selectedFollowupDetail.customer_phone} • Customer Ref: {selectedFollowupDetail.customer_id}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={`tel:${selectedFollowupDetail.customer_phone}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#EFF6FF',
                    color: themeTokens.colors.primaryDark,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <Phone size={14} /> Call
                </a>
                <a
                  href={`https://wa.me/${selectedFollowupDetail.customer_phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#E4F3ED',
                    color: '#03543F',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <MessageSquare size={14} /> WhatsApp
                </a>
              </div>
            </div>

            {/* Context & Schedule Specs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                padding: '14px',
                border: `1px solid ${themeTokens.colors.border}`,
                borderRadius: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, fontWeight: 700 }}>
                  ENQUIRY REFERENCE
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: themeTokens.colors.primaryDark, marginTop: '2px' }}>
                  {selectedFollowupDetail.enquiry_id}
                </div>
                <div style={{ fontSize: '12px', color: themeTokens.colors.textPrimary, marginTop: '2px' }}>
                  {selectedFollowupDetail.enquiry_requirement || 'General requirement'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, fontWeight: 700 }}>
                  RESPONSIBLE EXECUTIVE
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: themeTokens.colors.textPrimary, marginTop: '2px' }}>
                  {selectedFollowupDetail.responsible_name || 'Staff Member'}
                </div>
                <div style={{ fontSize: '12px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
                  Scheduled: {new Date(selectedFollowupDetail.scheduled_at).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Notes & Outcome */}
            <div
              style={{
                padding: '14px',
                border: `1px solid ${themeTokens.colors.border}`,
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, fontWeight: 700 }}>
                AGENDA & DISCUSSION NOTES
              </div>
              <div style={{ fontSize: '13px', color: themeTokens.colors.textPrimary, marginTop: '4px', lineHeight: 1.5 }}>
                "{selectedFollowupDetail.notes}"
              </div>

              {selectedFollowupDetail.outcome && (
                <div style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: '#DEF7EC', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#03543F' }}>OUTCOME LOGGED</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#03543F', marginTop: '2px' }}>
                    {selectedFollowupDetail.outcome}
                  </div>
                  {selectedFollowupDetail.remarks && (
                    <div style={{ fontSize: '12px', color: '#1E429F', marginTop: '4px' }}>
                      Remarks: "{selectedFollowupDetail.remarks}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Customer Cadence Timeline */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: themeTokens.colors.textPrimary }}>
                  Customer Touch Cadence ({followupHistory.length} total)
                </span>
                {loadingHistory && <span style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>Loading history...</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {followupHistory.map((h, idx) => {
                  const isCurrent = h.followup_id === selectedFollowupDetail.followup_id;
                  return (
                    <div
                      key={h.id || h.followup_id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${isCurrent ? themeTokens.colors.primaryDark : themeTokens.colors.border}`,
                        backgroundColor: isCurrent ? '#F0F2FE' : '#FFFFFF',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: themeTokens.colors.textPrimary }}>
                          Touch #{idx + 1} • #{h.followup_id} {isCurrent && ' (Active)'}
                        </span>
                        <Badge label={h.status.toUpperCase()} variant={h.status === 'completed' ? 'success' : 'primary'} />
                      </div>
                      <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
                        {new Date(h.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(h.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '12px', color: themeTokens.colors.textPrimary, marginTop: '4px' }}>
                        Notes: "{h.notes}"
                      </div>
                      {h.outcome && (
                        <div style={{ fontSize: '11px', color: '#03543F', fontWeight: 600, marginTop: '2px' }}>
                          Outcome: {h.outcome} {h.remarks ? `— "${h.remarks}"` : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="outline" label="Close" onClick={() => setSelectedFollowupDetail(null)} />
              {selectedFollowupDetail.status !== 'completed' && selectedFollowupDetail.status !== 'cancelled' && (
                <>
                  <Button
                    variant="primary"
                    label="Complete Touch"
                    icon={<CheckCircle2 size={14} />}
                    onClick={() => {
                      setCompleteModalItem(selectedFollowupDetail);
                      setCompleteOutcome('Client Interested - Requested Callback');
                      setCompleteRemarks('');
                      setChainNext(false);
                      setSelectedFollowupDetail(null);
                    }}
                  />
                  <Button
                    variant="secondary"
                    label="Reschedule"
                    icon={<RotateCcw size={14} />}
                    onClick={() => {
                      setRescheduleModalItem(selectedFollowupDetail);
                      setRescheduleDate('');
                      setRescheduleReason('');
                      setSelectedFollowupDetail(null);
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
