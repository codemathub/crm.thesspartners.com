import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { themeTokens } from '../theme/tokens';
import { AutocompleteIdInput } from '../components/AutocompleteIdInput';
import {
  Calendar,
  Clock,
  UserCheck,
  AlertCircle,
  RefreshCw,
  CalendarCheck,
} from 'lucide-react';
import { api, Visit } from '../services/api';

export interface VisitsViewProps {
  initialEnquiryId?: string | null;
  initialPropertyId?: string | null;
  onClearTargetIds?: () => void;
}

export const VisitsView: React.FC<VisitsViewProps> = ({
  initialEnquiryId,
  initialPropertyId,
  onClearTargetIds,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'open_pool' | 'today' | 'completed'>('all');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [total, setTotal] = useState(0);
  const [openClaimsCount, setOpenClaimsCount] = useState(0);
  const [todayVisitsCount, setTodayVisitsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Users for assignment
  const [executives, setExecutives] = useState<any[]>([]);

  // Schedule Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [enquiryId, setEnquiryId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [savingVisit, setSavingVisit] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  useEffect(() => {
    if (initialEnquiryId || initialPropertyId) {
      if (initialEnquiryId) setEnquiryId(initialEnquiryId);
      if (initialPropertyId) setPropertyId(initialPropertyId);
      setScheduleModalOpen(true);
      if (onClearTargetIds) onClearTargetIds();
    }
  }, [initialEnquiryId, initialPropertyId]);

  // Complete Modal
  const [completeVisitItem, setCompleteVisitItem] = useState<Visit | null>(null);
  const [outcome, setOutcome] = useState('Liked Property');
  const [remarks, setRemarks] = useState('');

  // Reschedule Modal
  const [rescheduleItem, setRescheduleItem] = useState<Visit | null>(null);
  const [newDate, setNewDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Cancel Modal
  const [cancelItem, setCancelItem] = useState<Visit | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Reassign Modal
  const [reassignItem, setReassignItem] = useState<Visit | null>(null);
  const [reassignExec, setReassignExec] = useState('');

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const params: any = { search: searchQuery || undefined };

      if (activeTab === 'open_pool') {
        params.open_claims_only = true;
      } else if (activeTab === 'today') {
        params.date = todayStr;
      } else if (activeTab === 'completed') {
        params.status = 'completed';
      }

      const res = await api.getVisits(params);
      setVisits(res.items);
      setTotal(res.total);
      setOpenClaimsCount(res.open_claims_count);
      setTodayVisitsCount(res.today_visits_count);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.getUsers();
      const execs = res.filter((u: any) => u.role === 'executive' || u.role === 'admin');
      setExecutives(execs);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchVisits();
    fetchUsers();
  }, [activeTab]);

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enquiryId.trim() || !propertyId.trim() || !scheduledAt) {
      setScheduleError('Enquiry ID, Property ID, and Scheduled Date/Time are required.');
      return;
    }
    setSavingVisit(true);
    setScheduleError(null);
    try {
      await api.createVisit({
        enquiry_id: enquiryId.trim(),
        property_id: propertyId.trim().toUpperCase(),
        scheduled_at: new Date(scheduledAt).toISOString(),
        assigned_to: assignedTo || undefined,
        notes: visitNotes.trim() || undefined,
      });
      setScheduleModalOpen(false);
      resetScheduleForm();
      fetchVisits();
    } catch (err: any) {
      setScheduleError(err.message || 'Failed to schedule visit.');
    } finally {
      setSavingVisit(false);
    }
  };

  const resetScheduleForm = () => {
    setEnquiryId('');
    setPropertyId('');
    setScheduledAt('');
    setAssignedTo('');
    setVisitNotes('');
    setScheduleError(null);
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeVisitItem) return;
    try {
      if (outcome === 'Deal Closed') {
        await api.closeVisitDeal(completeVisitItem.visit_id, {
          final_remarks: remarks.trim() || undefined,
        });
        alert(`🏆 Deal closed directly from visit! Property '${completeVisitItem.property_id}' status updated to ${completeVisitItem.property_transaction_type === 'rent' ? 'Rented' : 'Sold'}.`);
      } else if (outcome === 'Aborted') {
        await api.abortVisitDeal(completeVisitItem.visit_id, {
          reason: remarks.trim() || 'Client decided not to proceed after site visit.',
          remarks: remarks.trim() || undefined,
        });
        alert(`Enquiry linked to visit '${completeVisitItem.visit_id}' marked as aborted.`);
      } else {
        await api.completeVisit(completeVisitItem.visit_id, {
          outcome: outcome.trim() || undefined,
          remarks: remarks.trim() || undefined,
        });
      }
      setCompleteVisitItem(null);
      fetchVisits();
    } catch (err: any) {
      alert(err.message || 'Could not mark visit completed.');
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleItem || !newDate || !rescheduleReason.trim()) {
      alert('Updated Date/Time and Reason are mandatory.');
      return;
    }
    try {
      await api.rescheduleVisit(rescheduleItem.visit_id, {
        new_scheduled_at: new Date(newDate).toISOString(),
        reason: rescheduleReason.trim(),
      });
      setRescheduleItem(null);
      fetchVisits();
    } catch (err: any) {
      alert(err.message || 'Could not reschedule visit.');
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelItem || !cancelReason.trim()) {
      alert('Cancellation reason is mandatory.');
      return;
    }
    try {
      await api.cancelVisit(cancelItem.visit_id, cancelReason.trim());
      setCancelItem(null);
      fetchVisits();
    } catch (err: any) {
      alert(err.message || 'Could not cancel visit.');
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignItem || !reassignExec) {
      alert('Please select an executive.');
      return;
    }
    try {
      await api.reassignVisit(reassignItem.visit_id, reassignExec);
      setReassignItem(null);
      fetchVisits();
    } catch (err: any) {
      alert(err.message || 'Could not reassign visit.');
    }
  };

  const columns: Column<Visit>[] = [
    {
      key: 'visit_id',
      header: 'Visit ID',
      render: (v) => <span style={{ fontWeight: 800, color: themeTokens.colors.primaryDark }}>{v.visit_id}</span>,
    },
    {
      key: 'scheduled_at',
      header: 'Scheduled Time',
      render: (v) => {
        const d = new Date(v.scheduled_at);
        return (
          <div>
            <div style={{ fontWeight: 700, color: themeTokens.colors.textPrimary }}>
              {d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>
              {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      },
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (v) => (
        <div>
          <div style={{ fontWeight: 600 }}>{v.customer_name}</div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>
            {v.customer_phone} • {v.enquiry_id}
          </div>
        </div>
      ),
    },
    {
      key: 'property',
      header: 'Property Specification',
      render: (v) => (
        <div>
          <span style={{ fontWeight: 700, color: themeTokens.colors.primaryDark }}>{v.property_id}</span>
          <span style={{ fontSize: '12px', marginLeft: '6px' }}>{v.property_bhk}</span>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>
            {v.property_society}, {v.property_location}
          </div>
        </div>
      ),
    },
    {
      key: 'claim_status',
      header: 'Assignment / Claim',
      render: (v) => {
        if (v.claim_status === 'unclaimed') {
          if (v.status === 'completed' || v.status === 'cancelled') {
            return <span style={{ fontSize: '12px', color: themeTokens.colors.textSecondary }}>—</span>;
          }
          return (
            <span
              style={{
                display: 'inline-block',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              ● Open Pool (Unclaimed)
            </span>
          );
        }
        return (
          <div>
            <span style={{ fontWeight: 600, fontSize: '12px' }}>{v.assigned_name || 'Assigned'}</span>
            <div style={{ fontSize: '10px', color: themeTokens.colors.textSecondary }}>
              {v.claim_status === 'claimed' ? 'Claimed from pool' : 'Direct assignment'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => {
        let variant: 'success' | 'primary' | 'warning' | 'danger' | 'neutral' = 'neutral';
        if (v.status === 'completed') variant = 'success';
        else if (v.status === 'scheduled') variant = 'primary';
        else if (v.status === 'rescheduled') variant = 'warning';
        else if (v.status === 'cancelled') variant = 'danger';
        return <Badge label={v.status.toUpperCase()} variant={variant} />;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (v) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          {v.status !== 'completed' && v.status !== 'cancelled' && (
            <>
              <Button
                label="Complete"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCompleteVisitItem(v);
                  setOutcome('Liked Property');
                  setRemarks('');
                }}
              />
              <Button
                label="Resched"
                variant="outline"
                size="sm"
                onClick={() => {
                  setRescheduleItem(v);
                  setNewDate('');
                  setRescheduleReason('');
                }}
              />
              <Button
                label="Reassign"
                variant="outline"
                size="sm"
                onClick={() => {
                  setReassignItem(v);
                  setReassignExec(v.assigned_to || '');
                }}
              />
              <Button
                label="Cancel"
                variant="outline"
                size="sm"
                onClick={() => {
                  setCancelItem(v);
                  setCancelReason('');
                }}
              />
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: themeTokens.colors.primaryDark, letterSpacing: '0.08em' }}>
              ● OPERATIONAL HUB
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: themeTokens.colors.primarySoft,
                color: themeTokens.colors.primaryDark,
                fontWeight: 700,
              }}
            >
              ⚡ {openClaimsCount} Open Claims Available
            </span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: themeTokens.colors.textPrimary, marginTop: '4px' }}>
            Visits & Field Operations
          </h1>
          <p style={{ fontSize: '13px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
            Customer property showings, atomic open claim pool, and field dispatch execution.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            label="Refresh"
            icon={<RefreshCw size={14} />}
            variant="outline"
            onClick={fetchVisits}
          />
          <Button
            label="+ Schedule Visit"
            icon={<Calendar size={15} />}
            variant="primary"
            onClick={() => setScheduleModalOpen(true)}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: `1px solid ${themeTokens.colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: themeTokens.colors.textSecondary }}>Today's Scheduled</span>
            <Clock size={16} color={themeTokens.colors.primaryDark} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: themeTokens.colors.textPrimary, marginTop: '6px' }}>
            {todayVisitsCount}
          </div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
            Due for execution today
          </div>
        </div>

        <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: `1px solid ${themeTokens.colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#92400E' }}>Available to Claim</span>
            <AlertCircle size={16} color="#F59E0B" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#92400E', marginTop: '6px' }}>
            {openClaimsCount}
          </div>
          <div style={{ fontSize: '11px', color: '#B45309', marginTop: '2px' }}>
            Unassigned in company pool
          </div>
        </div>

        <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: `1px solid ${themeTokens.colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: themeTokens.colors.textSecondary }}>Total Pipeline Visits</span>
            <CalendarCheck size={16} color={themeTokens.colors.primaryDark} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: themeTokens.colors.textPrimary, marginTop: '6px' }}>
            {total}
          </div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
            Active visit schedule
          </div>
        </div>

        <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: '#FFFFFF', border: `1px solid ${themeTokens.colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: themeTokens.colors.textSecondary }}>Active Field Executives</span>
            <UserCheck size={16} color={themeTokens.colors.primaryDark} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: themeTokens.colors.textPrimary, marginTop: '6px' }}>
            {executives.length}
          </div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
            Eligible to claim & conduct visits
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <Card>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: `1px solid ${themeTokens.colors.border}`, paddingBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { key: 'all', label: `All Visits (${total})` },
              { key: 'open_pool', label: `Open Claim Pool (${openClaimsCount})` },
              { key: 'today', label: `Today's Schedule (${todayVisitsCount})` },
              { key: 'completed', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  backgroundColor: activeTab === tab.key ? themeTokens.colors.primaryDark : themeTokens.colors.softSurface,
                  color: activeTab === tab.key ? '#FFFFFF' : themeTokens.colors.textSecondary,
                  transition: 'all 0.1s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ width: '260px' }}>
            <input
              placeholder="Search Visit ID, customer, property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchVisits()}
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: '6px',
                border: `1px solid ${themeTokens.colors.border}`,
                fontSize: '12px',
              }}
            />
          </div>
        </div>

        {/* Visits Table */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: themeTokens.colors.textSecondary }}>
            Loading visits operational pipeline...
          </div>
        ) : (
          <Table columns={columns as any} data={visits} keyExtractor={(v: any) => v.visit_id} />
        )}
      </Card>

      {/* Schedule Visit Modal */}
      {scheduleModalOpen && (
        <Modal
          isOpen={scheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          title="Schedule Field Visit"
          maxWidth="560px"
        >
          <form onSubmit={handleCreateVisit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {scheduleError && (
              <div style={{ padding: '10px', backgroundColor: '#FEE2E2', borderRadius: '6px', color: '#B91C1C', fontSize: '13px' }}>
                {scheduleError}
              </div>
            )}

            <AutocompleteIdInput
              label="Target Enquiry / Client"
              placeholder="Type 2-3 chars (e.g. ENQ, 80, Deepak)..."
              value={enquiryId}
              onChange={setEnquiryId}
              entityType="enquiry"
              required
              helperText="Search client enquiries by typing 2-3 characters"
            />

            <AutocompleteIdInput
              label="Property ID (8-char)"
              placeholder="Type 2-3 chars (e.g. AE, 203, ACE)..."
              value={propertyId}
              onChange={setPropertyId}
              entityType="property"
              required
              helperText="Search properties by typing 2-3 characters of ID, Society, or Unit"
            />

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Scheduled Date & Time *
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Assign Executive (Optional - Leave blank for Open Claim Pool)
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              >
                <option value="">Leave Unclaimed (Post to Open Executive Pool)</option>
                {executives.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email}) - {u.role.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Visit Notes & Special Instructions
              </label>
              <textarea
                placeholder="e.g. Client prefers morning visit; show amenities & parking"
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button label="Cancel" variant="outline" size="sm" type="button" onClick={() => setScheduleModalOpen(false)} />
              <Button label={savingVisit ? 'Scheduling...' : 'Schedule Visit'} variant="primary" size="sm" disabled={savingVisit} />
            </div>
          </form>
        </Modal>
      )}

      {/* Complete Visit Modal */}
      {completeVisitItem && (
        <Modal
          isOpen={!!completeVisitItem}
          onClose={() => setCompleteVisitItem(null)}
          title={`Complete Visit ${completeVisitItem.visit_id}`}
          maxWidth="500px"
        >
          <form onSubmit={handleComplete} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Visit Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              >
                <option value="Liked Property">Liked Property (High Intent)</option>
                <option value="Deal Closed">🏆 Close Deal Now (Auto-Update Property to Rented/Sold)</option>
                <option value="Requested Second Visit">Requested Second Visit (with Family)</option>
                <option value="Wants Negotiation">Wants Price / Term Negotiation</option>
                <option value="Disliked - Layout">Disliked - Layout / Floor Plan</option>
                <option value="Disliked - Location">Disliked - Society / Location</option>
                <option value="Not Interested">Not Interested in Property</option>
                <option value="Aborted">❌ Abort Enquiry (Record Reason & Cancel)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Remarks & Client Feedback
              </label>
              <textarea
                placeholder="Detailed client comments..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button label="Cancel" variant="outline" size="sm" type="button" onClick={() => setCompleteVisitItem(null)} />
              <Button label="Mark Completed" variant="primary" size="sm" />
            </div>
          </form>
        </Modal>
      )}

      {/* Reschedule Visit Modal */}
      {rescheduleItem && (
        <Modal
          isOpen={!!rescheduleItem}
          onClose={() => setRescheduleItem(null)}
          title={`Reschedule Visit ${rescheduleItem.visit_id}`}
          maxWidth="500px"
        >
          <form onSubmit={handleReschedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                New Scheduled Date & Time *
              </label>
              <input
                type="datetime-local"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Reason for Rescheduling *
              </label>
              <input
                type="text"
                placeholder="e.g. Client requested evening slot"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button label="Back" variant="outline" size="sm" type="button" onClick={() => setRescheduleItem(null)} />
              <Button label="Confirm Reschedule" variant="primary" size="sm" />
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Visit Modal */}
      {cancelItem && (
        <Modal
          isOpen={!!cancelItem}
          onClose={() => setCancelItem(null)}
          title={`Cancel Visit ${cancelItem.visit_id}`}
          maxWidth="500px"
        >
          <form onSubmit={handleCancel} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px', color: '#B91C1C' }}>
                Cancellation Reason *
              </label>
              <input
                type="text"
                placeholder="e.g. Customer cancelled / Property already booked"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #DC2626', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button label="Back" variant="outline" size="sm" type="button" onClick={() => setCancelItem(null)} />
              <Button label="Confirm Cancellation" variant="danger" size="sm" />
            </div>
          </form>
        </Modal>
      )}

      {/* Reassign Visit Modal */}
      {reassignItem && (
        <Modal
          isOpen={!!reassignItem}
          onClose={() => setReassignItem(null)}
          title={`Reassign Visit ${reassignItem.visit_id}`}
          maxWidth="500px"
        >
          <form onSubmit={handleReassign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Select New Responsible Executive *
              </label>
              <select
                value={reassignExec}
                onChange={(e) => setReassignExec(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              >
                <option value="">Select Executive...</option>
                {executives.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button label="Cancel" variant="outline" size="sm" type="button" onClick={() => setReassignItem(null)} />
              <Button label="Reassign" variant="primary" size="sm" />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
