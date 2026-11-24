import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { themeTokens } from '../theme/tokens';
import { Search, Plus, UserPlus, FileText, AlertTriangle, Eye, Sparkles, Share2, Download, Upload, Phone, MessageCircle, Calendar, CheckCircle2, Clock, UserCheck } from 'lucide-react';
import { api, validateMobileNumber } from '../services/api';
import { parseUtcDate, formatDateTime, formatDate, formatTime } from '../utils/dateUtils';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { Customer360Modal } from '../components/Customer360Modal';

export interface CustomersEnquiriesViewProps {
  initialCustomerId?: string | null;
  onClearInitialCustomerId?: () => void;
}

export const CustomersEnquiriesView: React.FC<CustomersEnquiriesViewProps> = ({
  initialCustomerId,
  onClearInitialCustomerId,
}) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'enquiries'>('enquiries');

  // Customer State & Filters
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [customerSearch, setCustomerSearch] = useState('');
  const [custTypeFilter, setCustTypeFilter] = useState('all');
  const [custPriorityFilter, setCustPriorityFilter] = useState('all');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customer360Id, setCustomer360Id] = useState<string | null>(null);

  useEffect(() => {
    if (initialCustomerId) {
      setCustomer360Id(initialCustomerId);
      if (onClearInitialCustomerId) onClearInitialCustomerId();
    }
  }, [initialCustomerId]);

  // Enquiry State & Filters
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [enquiryTotal, setEnquiryTotal] = useState(0);
  const [enquirySearch, setEnquirySearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTransaction, setFilterTransaction] = useState('all');
  const [activeOnly, setActiveOnly] = useState<boolean>(true);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);

  // Enquiry Detail Drawer / Modal State
  const [selectedEnquiryDetail, setSelectedEnquiryDetail] = useState<any | null>(null);
  const [enquiryTimeline, setEnquiryTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState<boolean>(false);
  const [timelineNote, setTimelineNote] = useState('');
  const [submittingTimelineNote, setSubmittingTimelineNote] = useState(false);

  // Excel Import / Export State (Phase 13 / PRD 5.19)
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      await api.downloadExcelExport('enquiries');
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  // Add Customer Modal
  const [addCustModal, setAddCustModal] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAltPhone, setCustAltPhone] = useState('');
  const [custWaPhone, setCustWaPhone] = useState('');
  const [custType, setCustType] = useState('tenant');
  const [custPriority, setCustPriority] = useState('warm');
  const [custNotes, setCustNotes] = useState('');
  const [sharedReason, setSharedReason] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<any | null>(null);
  const [savingCust, setSavingCust] = useState(false);
  const [custError, setCustError] = useState<string | null>(null);

  // Add Enquiry Modal
  const [addEnqModal, setAddEnqModal] = useState(false);
  const [selectedCustId, setSelectedCustId] = useState('');
  const [selectedCustName, setSelectedCustName] = useState('');
  const [lookingFor, setLookingFor] = useState('2 BHK');
  const [transactionType, setTransactionType] = useState<'rent' | 'sale'>('rent');
  const [budgetMin, setBudgetMin] = useState<number | ''>(20000);
  const [budgetMax, setBudgetMax] = useState<number | ''>(25000);
  const [locationPref, setLocationPref] = useState('Sector 4 Greater Noida');
  const [tenantType, setTenantType] = useState('Family');
  const [enqNotes, setEnqNotes] = useState('');
  const [savingEnq, setSavingEnq] = useState(false);
  const [enqError, setEnqError] = useState<string | null>(null);

  // Customer Detail Drawer / Modal
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<{ customer: any; enquiries: any[] } | null>(null);

  // Enquiry Status Modal
  const [statusModalEnquiry, setStatusModalEnquiry] = useState<any | null>(null);
  const [newStatus, setNewStatus] = useState('contacted');
  const [abortReason, setAbortReason] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [dealPropertyId, setDealPropertyId] = useState('');
  const [dealAmount, setDealAmount] = useState<number | ''>('');


  // Property Matches Modal
  const [matchesModalEnquiry, setMatchesModalEnquiry] = useState<any | null>(null);
  const [matchesList, setMatchesList] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Schedule Showing from Matches Modal State
  const [scheduleShowingProp, setScheduleShowingProp] = useState<any | null>(null);
  const [showingDateTime, setShowingDateTime] = useState('');
  const [showingNotes, setShowingNotes] = useState('');
  const [schedulingVisit, setSchedulingVisit] = useState(false);

  const openScheduleFromMatch = (prop: any) => {
    setScheduleShowingProp(prop);
    const now = new Date();
    now.setHours(now.getHours() + 2);
    now.setMinutes(0);
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setShowingDateTime(localIso);
    setShowingNotes(`Site visit showing for #${prop.property_id} at ${prop.society_name || 'Society'}`);
  };

  const handleConfirmScheduleShowing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchesModalEnquiry || !scheduleShowingProp || !showingDateTime) return;
    setSchedulingVisit(true);
    try {
      await api.createVisit({
        enquiry_id: matchesModalEnquiry.enquiry_id,
        property_id: scheduleShowingProp.property_id,
        scheduled_at: new Date(showingDateTime).toISOString(),
        notes: showingNotes.trim() || undefined,
      });
      alert(`Site showing scheduled for Unit #${scheduleShowingProp.property_id}!`);
      setScheduleShowingProp(null);
      fetchEnquiries();
      if (selectedEnquiryDetail) {
        openEnquiryDetail(selectedEnquiryDetail);
      }
    } catch (err: any) {
      alert(err.message || 'Could not schedule visit.');
    } finally {
      setSchedulingVisit(false);
    }
  };

  const openMatchesModal = async (enquiry: any) => {
    setMatchesModalEnquiry(enquiry);
    setLoadingMatches(true);
    setMatchesList([]);
    try {
      const res = await api.getEnquiryMatches(enquiry.enquiry_id);
      setMatchesList(res.matches);
    } catch (err: any) {
      alert(`Could not retrieve matching properties: ${err.message}`);
    } finally {
      setLoadingMatches(false);
    }
  };

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const res = await api.getCustomers(
        customerSearch.trim() || undefined,
        custTypeFilter !== 'all' ? custTypeFilter : undefined,
        custPriorityFilter !== 'all' ? custPriorityFilter : undefined
      );
      setCustomers(res.items);
      setCustomerTotal(res.total);
    } catch {
      // Handle error
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchEnquiries = async () => {
    setLoadingEnquiries(true);
    try {
      const res = await api.getEnquiries({
        search: enquirySearch.trim() || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        transaction_type: filterTransaction !== 'all' ? filterTransaction : undefined,
        active_only: activeOnly,
      });
      setEnquiries(res.items);
      setEnquiryTotal(res.total);
    } catch {
      // Handle error
    } finally {
      setLoadingEnquiries(false);
    }
  };

  const openEnquiryDetail = async (enquiry: any) => {
    setSelectedEnquiryDetail(enquiry);
    setLoadingTimeline(true);
    try {
      const res = await api.getEnquiryTimeline(enquiry.enquiry_id);
      setEnquiryTimeline(res.events || []);
    } catch (err: any) {
      console.error('Failed to load timeline:', err);
      setEnquiryTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleAddTimelineNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiryDetail || !timelineNote.trim()) return;
    setSubmittingTimelineNote(true);
    try {
      await api.createFollowUp({
        enquiry_id: selectedEnquiryDetail.enquiry_id,
        scheduled_at: new Date().toISOString(),
        notes: timelineNote.trim(),
      });
      setTimelineNote('');
      const res = await api.getEnquiryTimeline(selectedEnquiryDetail.enquiry_id);
      setEnquiryTimeline(res.events || []);
    } catch (err: any) {
      alert(`Could not log note: ${err.message}`);
    } finally {
      setSubmittingTimelineNote(false);
    }
  };

  // Initial fetch of both counts so tabs display real counts immediately
  useEffect(() => {
    fetchEnquiries();
    fetchCustomers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'customers') fetchCustomers();
      else fetchEnquiries();
    }, 200);
    return () => clearTimeout(timer);
  }, [activeTab, filterStatus, filterTransaction, activeOnly, custTypeFilter, custPriorityFilter, customerSearch, enquirySearch]);

  // Duplicate phone checker on phone input blur
  const handleCheckPhone = async () => {
    if (!custPhone.trim() || custPhone.trim().length < 8) return;
    try {
      const res = await api.checkDuplicatePhone(custPhone.trim());
      if (res.has_duplicate) {
        setDuplicateWarning(res.matches[0]);
      } else {
        setDuplicateWarning(null);
      }
    } catch {
      // ignore
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCustName = custName.trim();
    const cleanCustPhone = custPhone.trim();

    if (!cleanCustName || cleanCustName.length < 2) {
      setCustError('Customer Name is compulsory (min 2 characters).');
      return;
    }

    const phoneVal = validateMobileNumber(cleanCustPhone, 'Customer Mobile Number');
    if (!phoneVal.valid) {
      setCustError(phoneVal.error || 'Please enter a valid customer mobile number.');
      return;
    }

    if (custAltPhone.trim()) {
      const altVal = validateMobileNumber(custAltPhone.trim(), 'Alternate Phone');
      if (!altVal.valid) {
        setCustError(altVal.error || 'Please enter a valid alternate phone.');
        return;
      }
    }

    setSavingCust(true);
    setCustError(null);
    try {
      const res = await api.createCustomer({
        name: cleanCustName,
        primary_phone: cleanCustPhone,
        alternate_phone: custAltPhone.trim() || undefined,
        whatsapp_phone: custWaPhone.trim() || undefined,
        customer_type: custType,
        priority: custPriority,
        notes: custNotes.trim() || undefined,
        shared_phone_reason: sharedReason.trim() || undefined,
      });
      setAddCustModal(false);
      resetCustomerForm();
      fetchCustomers();
      // Prompt to immediately add enquiry
      if (confirm(`Customer ${res.name} (${res.customer_id}) created. Add an enquiry now?`)) {
        openAddEnquiryForCustomer(res.customer_id, res.name);
      }
    } catch (err: any) {
      setCustError(err.message || 'Failed to create customer');
    } finally {
      setSavingCust(false);
    }
  };

  const openAddEnquiryForCustomer = (cid: string, cname: string) => {
    setSelectedCustId(cid);
    setSelectedCustName(cname);
    setAddEnqModal(true);
  };

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetMin || !budgetMax || Number(budgetMin) > Number(budgetMax)) {
      setEnqError('Please specify valid budget range (Min <= Max).');
      return;
    }
    setSavingEnq(true);
    setEnqError(null);
    try {
      await api.createEnquiry({
        customer_id: selectedCustId,
        transaction_type: transactionType,
        looking_for: lookingFor,
        preferred_locations: [locationPref],
        budget_min: Number(budgetMin),
        budget_max: Number(budgetMax),
        tenant_type: tenantType,
        notes: enqNotes.trim() || undefined,
      });
      setAddEnqModal(false);
      resetEnquiryForm();
      fetchEnquiries();
      if (selectedCustomerDetail) {
        // Refresh customer drawer
        openCustomerDetails(selectedCustId);
      }
    } catch (err: any) {
      setEnqError(err.message || 'Failed to save enquiry');
    } finally {
      setSavingEnq(false);
    }
  };

  const openCustomerDetails = async (cid: string) => {
    try {
      const res = await api.getCustomer(cid);
      setSelectedCustomerDetail(res);
    } catch (err: any) {
      alert(`Could not load customer: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalEnquiry) return;
    try {
      if (newStatus === 'deal_closed') {
        if (!dealPropertyId.trim()) {
          alert('Please enter or select the closed Property ID.');
          return;
        }
        await api.closeEnquiryDeal(statusModalEnquiry.enquiry_id, {
          property_id: dealPropertyId.trim().toUpperCase(),
          deal_amount: dealAmount ? Number(dealAmount) : undefined,
          final_remarks: statusNotes.trim() || undefined,
        });
        alert(`Deal closed successfully! Property '${dealPropertyId.trim().toUpperCase()}' status updated to ${statusModalEnquiry.transaction_type === 'rent' ? 'Rented' : 'Sold'}.`);
      } else if (newStatus === 'aborted') {
        if (!abortReason.trim()) {
          alert('Please provide a mandatory abort reason.');
          return;
        }
        await api.abortEnquiry(statusModalEnquiry.enquiry_id, {
          reason: abortReason.trim(),
          final_remarks: statusNotes.trim() || undefined,
        });
        alert(`Enquiry '${statusModalEnquiry.enquiry_id}' marked as aborted.`);
      } else {
        await api.changeEnquiryStatus(
          statusModalEnquiry.enquiry_id,
          newStatus,
          undefined,
          statusNotes.trim() || undefined
        );
      }
      setStatusModalEnquiry(null);
      setDealPropertyId('');
      setDealAmount('');
      setAbortReason('');
      fetchEnquiries();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const resetCustomerForm = () => {
    setCustName('');
    setCustPhone('');
    setCustAltPhone('');
    setCustWaPhone('');
    setCustNotes('');
    setSharedReason('');
    setDuplicateWarning(null);
  };

  const resetEnquiryForm = () => {
    setEnqNotes('');
    setEnqError(null);
  };

  // Columns for Customer Table
  const customerColumns: Column<any>[] = [
    {
      key: 'customer_id',
      header: 'Customer ID',
      render: (c) => (
        <span
          onClick={() => setCustomer360Id(c.customer_id)}
          style={{ fontWeight: 800, color: themeTokens.colors.primaryDark, cursor: 'pointer', textDecoration: 'underline' }}
          title="Open Customer Details"
        >
          {c.customer_id}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (c) => (
        <span
          onClick={() => setCustomer360Id(c.customer_id)}
          style={{ fontWeight: 600, cursor: 'pointer', color: '#1E293B' }}
          title="Open Customer Details"
        >
          {c.name}
        </span>
      ),
    },
    { key: 'primary_phone', header: 'Primary Phone' },
    { key: 'customer_type', header: 'Type', render: (c) => <span style={{ textTransform: 'capitalize' }}>{c.customer_type}</span> },
    {
      key: 'priority',
      header: 'Priority',
      render: (c) => (
        <Badge
          label={c.priority}
          variant={c.priority === 'hot' ? 'danger' : c.priority === 'warm' ? 'warning' : 'neutral'}
        />
      ),
    },
    {
      key: 'enquiries_count',
      header: 'Enquiries',
      render: (c) => <span style={{ fontWeight: 700 }}>{c.enquiries_count} enquiries</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button
            label="Details"
            icon={<Eye size={13} />}
            variant="outline"
            size="sm"
            onClick={() => setCustomer360Id(c.customer_id)}
          />
          <Button label="+ Enquiry" variant="primary" size="sm" onClick={() => openAddEnquiryForCustomer(c.customer_id, c.name)} />
        </div>
      ),
    },
  ];

  // Columns for Enquiry Table
  const enquiryColumns: Column<any>[] = [
    {
      key: 'enquiry_id',
      header: 'Enquiry ID',
      render: (e) => (
        <span
          onClick={(ev) => {
            ev.stopPropagation();
            openEnquiryDetail(e);
          }}
          style={{ fontWeight: 800, color: themeTokens.colors.primaryDark, cursor: 'pointer' }}
          title="Click to view full Enquiry Details & Timeline"
        >
          {e.enquiry_id}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Date & Time',
      render: (e) => {
        if (!e.created_at) return <span style={{ color: '#94A3B8' }}>—</span>;
        const d = parseUtcDate(e.created_at);
        return (
          <div style={{ fontSize: '11px', color: '#475569', minWidth: '105px' }}>
            <div style={{ fontWeight: 600 }}>{formatDate(d)}</div>
            <div style={{ color: '#94A3B8' }}>{formatTime(d)}</div>
          </div>
        );
      },
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (e) => (
        <div
          onClick={(ev) => {
            ev.stopPropagation();
            const targetId = e.customer_id || e.customer_phone || e.customer_name;
            if (targetId) setCustomer360Id(targetId);
          }}
          style={{ cursor: 'pointer' }}
          title="Click to view Customer Details"
        >
          <div
            style={{
              fontWeight: 700,
              color: '#312E81',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ textDecoration: 'underline' }}>{e.customer_name}</span>
            <Eye size={13} color="#4F46E5" />
          </div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
            {e.customer_phone}
          </div>
        </div>
      ),
    },
    {
      key: 'looking_for',
      header: 'Looking For',
      render: (e) => (
        <div>
          <span style={{ fontWeight: 600 }}>{e.looking_for}</span>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, textTransform: 'capitalize' }}>{e.transaction_type}</div>
        </div>
      ),
    },
    {
      key: 'budget',
      header: 'Budget Range',
      render: (e) => (
        <div>
          <span style={{ fontWeight: 700 }}>₹{(e.budget_min ?? 0).toLocaleString('en-IN')} - ₹{(e.budget_max ?? 0).toLocaleString('en-IN')}</span>
          <span style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>{e.transaction_type === 'rent' ? '/mo' : ''}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) => {
        let variant: 'success' | 'primary' | 'warning' | 'danger' | 'neutral' = 'neutral';
        if (e.status === 'deal_closed') variant = 'success';
        else if (e.status === 'visit_scheduled' || e.status === 'negotiation') variant = 'primary';
        else if (e.status === 'follow_up' || e.status === 'contacted') variant = 'warning';
        else if (e.status === 'aborted') variant = 'danger';
        return <Badge label={e.status.replace('_', ' ')} variant={variant} />;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (e) => (
        <div style={{ display: 'flex', gap: '6px' }} onClick={(ev) => ev.stopPropagation()}>
          <Button
            label="Details"
            icon={<FileText size={12} />}
            variant="outline"
            size="sm"
            onClick={() => openEnquiryDetail(e)}
            title="Open Enquiry Details & Executive Timeline"
          />
          <Button
            label="Matches"
            icon={<Sparkles size={13} />}
            variant="primary"
            size="sm"
            onClick={() => openMatchesModal(e)}
          />
          <Button
            label="Status"
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusModalEnquiry(e);
              setNewStatus(e.status);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: themeTokens.colors.textPrimary }}>
            Customers & Enquiries Directory
          </h1>
          <p style={{ fontSize: '13px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
            Unified customer profiles with multiple enquiries per client, duplicate phone detection, and lifecycle tracking.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            label="Import Excel"
            variant="outline"
            icon={<Upload size={14} />}
            onClick={() => setImportModalOpen(true)}
          />
          <Button
            label={exporting ? 'Exporting...' : 'Export Enquiries'}
            variant="outline"
            icon={<Download size={14} />}
            onClick={handleExport}
            disabled={exporting}
          />
          <Button
            label="New Customer Profile"
            variant="outline"
            icon={<UserPlus size={14} />}
            onClick={() => setAddCustModal(true)}
          />
          <Button
            label="New Customer + Enquiry"
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => setAddCustModal(true)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
        <button
          onClick={() => setActiveTab('enquiries')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${activeTab === 'enquiries' ? themeTokens.colors.primaryDark : themeTokens.colors.border}`,
            backgroundColor: activeTab === 'enquiries' ? themeTokens.colors.primaryDark : themeTokens.colors.surface,
            color: activeTab === 'enquiries' ? '#FFFFFF' : themeTokens.colors.textSecondary,
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <FileText size={14} />
          Enquiries Pipeline ({enquiryTotal})
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${activeTab === 'customers' ? themeTokens.colors.primaryDark : themeTokens.colors.border}`,
            backgroundColor: activeTab === 'customers' ? themeTokens.colors.primaryDark : themeTokens.colors.surface,
            color: activeTab === 'customers' ? '#FFFFFF' : themeTokens.colors.textSecondary,
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          <UserPlus size={14} />
          Customer Directory ({customerTotal})
        </button>
      </div>

      {/* Search & Filter Bar */}
      <Card style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: themeTokens.colors.softSurface,
              borderRadius: '6px',
              padding: '6px 12px',
              flex: 1,
              minWidth: '240px',
            }}
          >
            <Search size={16} color={themeTokens.colors.textSecondary} style={{ marginRight: '8px' }} />
            <input
              type="text"
              placeholder={activeTab === 'enquiries' ? "Search enquiries by customer, ID, looking for..." : "Search customers by name, phone, ID..."}
              value={activeTab === 'enquiries' ? enquirySearch : customerSearch}
              onChange={(e) => {
                if (activeTab === 'enquiries') setEnquirySearch(e.target.value);
                else setCustomerSearch(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (activeTab === 'enquiries') fetchEnquiries();
                  else fetchCustomers();
                }
              }}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', width: '100%' }}
            />
          </div>

          {activeTab === 'enquiries' ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', backgroundColor: '#E2E8F0', borderRadius: '6px', padding: '2px' }}>
                <button
                  type="button"
                  onClick={() => setActiveOnly(true)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: activeOnly ? '#4338CA' : 'transparent',
                    color: activeOnly ? '#FFFFFF' : '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Active Only
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOnly(false)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: !activeOnly ? '#4338CA' : 'transparent',
                    color: !activeOnly ? '#FFFFFF' : '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  All / History
                </button>
              </div>

              <select
                value={filterTransaction}
                onChange={(e) => setFilterTransaction(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '12px',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 600,
                  outline: 'none',
                }}
              >
                <option value="all">All Transactions</option>
                <option value="rent">Rent Only</option>
                <option value="sale">Sale Only</option>
              </select>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['all', 'new', 'contacted', 'visit_scheduled', 'deal_closed', 'aborted'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterStatus(st)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: `1px solid ${filterStatus === st ? themeTokens.colors.primaryDark : themeTokens.colors.border}`,
                      backgroundColor: filterStatus === st ? themeTokens.colors.primaryDark : themeTokens.colors.surface,
                      color: filterStatus === st ? '#FFFFFF' : themeTokens.colors.textSecondary,
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={custTypeFilter}
                onChange={(e) => setCustTypeFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '12px',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 600,
                  outline: 'none',
                }}
              >
                <option value="all">All Customer Types</option>
                <option value="tenant">Tenant</option>
                <option value="buyer">Buyer</option>
                <option value="owner">Owner / Landlord</option>
                <option value="investor">Investor</option>
              </select>

              <div style={{ display: 'flex', gap: '6px' }}>
                {['all', 'hot', 'warm', 'cold'].map((pri) => (
                  <button
                    key={pri}
                    type="button"
                    onClick={() => setCustPriorityFilter(pri)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      border: `1px solid ${custPriorityFilter === pri ? themeTokens.colors.primaryDark : themeTokens.colors.border}`,
                      backgroundColor: custPriorityFilter === pri ? themeTokens.colors.primaryDark : themeTokens.colors.surface,
                      color: custPriorityFilter === pri ? '#FFFFFF' : themeTokens.colors.textSecondary,
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {pri === 'all' ? 'All Priority' : pri.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Main Table */}
      <Card title={activeTab === 'enquiries' ? `Enquiries List (${enquiryTotal})` : `Customers List (${customerTotal})`}>
        {activeTab === 'enquiries' ? (
          loadingEnquiries ? (
            <div style={{ padding: '30px', textAlign: 'center', color: themeTokens.colors.textSecondary }}>Loading enquiries...</div>
          ) : (
            <Table
              columns={enquiryColumns}
              data={enquiries}
              keyExtractor={(e) => e.enquiry_id}
              onRowClick={(e) => openEnquiryDetail(e)}
            />
          )
        ) : (
          loadingCustomers ? (
            <div style={{ padding: '30px', textAlign: 'center', color: themeTokens.colors.textSecondary }}>Loading customers...</div>
          ) : (
            <Table
              columns={customerColumns}
              data={customers}
              keyExtractor={(c) => c.customer_id}
              onRowClick={(c) => setCustomer360Id(c.customer_id)}
            />
          )
        )}
      </Card>

      {/* Add Customer Modal with Duplicate Phone Check */}
      <Modal
        isOpen={addCustModal}
        onClose={() => { setAddCustModal(false); resetCustomerForm(); }}
        title="Create Customer Profile"
      >
        <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '75vh', overflowY: 'auto' }}>
          {custError && (
            <div style={{ padding: '8px 12px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '12px' }}>
              {custError}
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Customer Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Rahul Verma"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Primary Phone Number *</label>
            <input
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
              onBlur={handleCheckPhone}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
            />
          </div>

          {/* Duplicate Phone Suggestion Banner (PRD Section 5.8) */}
          {duplicateWarning && (
            <div style={{ padding: '12px', backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400E', fontWeight: 700, fontSize: '12px' }}>
                <AlertTriangle size={15} />
                Existing Customer Found With This Phone
              </div>
              <p style={{ fontSize: '12px', color: '#78350F', margin: '4px 0 8px 0' }}>
                <strong>{duplicateWarning.name}</strong> ({duplicateWarning.customer_id}) has {duplicateWarning.enquiries_count} existing enquiry record(s).
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setAddCustModal(false);
                    openCustomerDetails(duplicateWarning.customer_id);
                  }}
                  style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', backgroundColor: '#D97706', color: '#FFF', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  1. Open Existing Customer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddCustModal(false);
                    openAddEnquiryForCustomer(duplicateWarning.customer_id, duplicateWarning.name);
                  }}
                  style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', backgroundColor: '#2563EB', color: '#FFF', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  2. Add Enquiry to Existing
                </button>
              </div>
              <div style={{ marginTop: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#78350F', display: 'block', marginBottom: '2px' }}>
                  Or 3. Create Separate Profile (Shared Phone Reason Required):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spouse/Family member sharing contact"
                  value={sharedReason}
                  onChange={(e) => setSharedReason(e.target.value)}
                  style={{ width: '100%', padding: '6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #D97706' }}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Customer Type</label>
              <select
                value={custType}
                onChange={(e) => setCustType(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              >
                <option value="tenant">Tenant</option>
                <option value="buyer">Buyer</option>
                <option value="agent">Agent</option>
                <option value="owner">Owner</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Priority</label>
              <select
                value={custPriority}
                onChange={(e) => setCustPriority(e.target.value as any)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              >
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Notes</label>
            <textarea
              placeholder="Preferences, timeline, contact notes..."
              value={custNotes}
              onChange={(e) => setCustNotes(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <Button label="Cancel" variant="outline" size="sm" type="button" onClick={() => setAddCustModal(false)} />
            <Button label={savingCust ? 'Creating Profile...' : 'Save Customer'} variant="primary" size="sm" disabled={savingCust} />
          </div>
        </form>
      </Modal>

      {/* Add Enquiry Modal */}
      <Modal
        isOpen={addEnqModal}
        onClose={() => { setAddEnqModal(false); resetEnquiryForm(); }}
        title={`New Enquiry: ${selectedCustName} (${selectedCustId})`}
      >
        <form onSubmit={handleCreateEnquiry} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {enqError && (
            <div style={{ padding: '8px 12px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '12px' }}>
              {enqError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Transaction Type</label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as any)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              >
                <option value="rent">Rent</option>
                <option value="sale">Sale</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Looking For (BHK) *</label>
              <select
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              >
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="2 BHK + 2T">2 BHK + 2T</option>
                <option value="2 BHK + Study">2 BHK + Study</option>
                <option value="3 BHK">3 BHK</option>
                <option value="3 BHK + 3T">3 BHK + 3T</option>
                <option value="Villa">Villa</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Min Budget (₹) *</label>
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value ? Number(e.target.value) : '')}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Max Budget (₹) *</label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value ? Number(e.target.value) : '')}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Preferred Location</label>
              <input
                type="text"
                value={locationPref}
                onChange={(e) => setLocationPref(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tenant Preference</label>
              <select
                value={tenantType}
                onChange={(e) => setTenantType(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              >
                <option value="Family">Family</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Family + Bachelor">Family + Bachelor</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Notes</label>
            <input
              type="text"
              placeholder="e.g. Prefers high floor, park facing"
              value={enqNotes}
              onChange={(e) => setEnqNotes(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <Button label="Cancel" variant="outline" size="sm" type="button" onClick={() => setAddEnqModal(false)} />
            <Button label={savingEnq ? 'Saving...' : 'Create Enquiry'} variant="primary" size="sm" disabled={savingEnq} />
          </div>
        </form>
      </Modal>

      {/* Customer Profile Details Drawer */}
      {selectedCustomerDetail && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCustomerDetail(null)}
          title={`Customer: ${selectedCustomerDetail.customer.name} (${selectedCustomerDetail.customer.customer_id})`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ padding: '12px', backgroundColor: themeTokens.colors.softSurface, borderRadius: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
              <div><strong>Primary Phone:</strong> {selectedCustomerDetail.customer.primary_phone}</div>
              <div><strong>Customer Type:</strong> {selectedCustomerDetail.customer.customer_type}</div>
              <div><strong>Priority:</strong> {selectedCustomerDetail.customer.priority}</div>
              <div><strong>Lead Source:</strong> {selectedCustomerDetail.customer.lead_source || 'Walk-in'}</div>
              {selectedCustomerDetail.customer.notes && (
                <div style={{ gridColumn: 'span 2' }}><strong>Notes:</strong> {selectedCustomerDetail.customer.notes}</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0 }}>Linked Enquiries ({selectedCustomerDetail.enquiries.length})</h4>
              <Button
                label="+ Add Enquiry"
                variant="primary"
                size="sm"
                onClick={() => openAddEnquiryForCustomer(selectedCustomerDetail.customer.customer_id, selectedCustomerDetail.customer.name)}
              />
            </div>

            {selectedCustomerDetail.enquiries.length === 0 ? (
              <p style={{ fontSize: '12px', color: themeTokens.colors.textSecondary }}>No enquiries registered yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedCustomerDetail.enquiries.map((enq) => (
                  <div key={enq.enquiry_id} style={{ padding: '10px', border: `1px solid ${themeTokens.colors.border}`, borderRadius: '6px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, color: themeTokens.colors.primaryDark }}>{enq.enquiry_id}</span>
                      <Badge label={enq.status} variant={enq.status === 'deal_closed' ? 'success' : 'primary'} />
                    </div>
                    <div><strong>Requirement:</strong> {enq.looking_for} ({enq.transaction_type.toUpperCase()})</div>
                    <div><strong>Budget:</strong> ₹{(enq.budget_min ?? 0).toLocaleString('en-IN')} - ₹{(enq.budget_max ?? 0).toLocaleString('en-IN')}</div>
                    {enq.notes && <div style={{ color: themeTokens.colors.textSecondary, marginTop: '4px' }}>{enq.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Enquiry Status Transition Modal */}
      {statusModalEnquiry && (
        <Modal
          isOpen={true}
          onClose={() => setStatusModalEnquiry(null)}
          title={`Update Status: ${statusModalEnquiry.enquiry_id}`}
        >
          <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Lifecycle Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="follow_up">Follow Up</option>
                <option value="visit_scheduled">Visit Scheduled</option>
                <option value="negotiation">Negotiation</option>
                <option value="on_hold">On Hold</option>
                <option value="not_connected">Not Connected</option>
                <option value="not_interested">Not Interested</option>
                <option value="deal_closed">Deal Closed</option>
                <option value="aborted">Aborted</option>
              </select>
            </div>

            {newStatus === 'deal_closed' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: '#ECFDF5', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#065F46' }}>
                  ✓ Deal Closure Auto-Lifecycle: Selected property will automatically update to {statusModalEnquiry.transaction_type === 'rent' ? 'RENTED' : 'SOLD'}.
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px', color: '#065F46' }}>
                    Closed Property ID * (e.g. ABCDE123)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Property ID"
                    value={dealPropertyId}
                    onChange={(e) => setDealPropertyId(e.target.value.toUpperCase())}
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #059669', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Agreed Closing Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Optional (defaults to property price)"
                    value={dealAmount}
                    onChange={(e) => setDealAmount(e.target.value ? Number(e.target.value) : '')}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
                  />
                </div>
              </div>
            )}

            {newStatus === 'aborted' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px', color: '#DC2626' }}>
                  Abort Reason *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Found property through another agent / out of budget"
                  value={abortReason}
                  onChange={(e) => setAbortReason(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid #DC2626`, fontSize: '13px' }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Status Notes</label>
              <textarea
                placeholder="Details of client conversation..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button label="Cancel" variant="outline" size="sm" type="button" onClick={() => setStatusModalEnquiry(null)} />
              <Button label="Update Status" variant="primary" size="sm" />
            </div>
          </form>
        </Modal>
      )}

      {/* Matching Properties Modal */}
      {matchesModalEnquiry && (
        <Modal
          isOpen={!!matchesModalEnquiry}
          onClose={() => setMatchesModalEnquiry(null)}
          title={`Deterministic Property Matches (${matchesList.length})`}
          maxWidth="850px"
        >
          <div>
            <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: themeTokens.colors.primarySoft, borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: themeTokens.colors.primaryDark }}>
                    {matchesModalEnquiry.enquiry_id} • {matchesModalEnquiry.customer_name}
                  </div>
                  <div style={{ fontSize: '12px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
                    Criteria: <strong>{matchesModalEnquiry.transaction_type?.toUpperCase()}</strong> • Looking for: <strong>{matchesModalEnquiry.looking_for}</strong> • Budget: <strong>₹{matchesModalEnquiry.budget_min?.toLocaleString('en-IN')} - ₹{matchesModalEnquiry.budget_max?.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
                <Badge label="Advisory Only" variant="neutral" />
              </div>
            </div>

            {loadingMatches ? (
              <div style={{ padding: '40px', textAlign: 'center', color: themeTokens.colors.textSecondary }}>
                Computing deterministic match scores...
              </div>
            ) : matchesList.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: themeTokens.colors.textSecondary }}>
                No active available properties meet the matching criteria for this enquiry.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '460px', overflowY: 'auto' }}>
                {matchesList.map((m: any) => {
                  const prop = m.property;
                  const shareText = encodeURIComponent(
                    `*G² Brothers CRM Match Proposal*\nProperty ID: ${prop.property_id}\nType: ${prop.property_type}\nSociety: ${prop.society_name}\nLocation: ${prop.location}\nAmount: ₹${(prop.expected_amount ?? 0).toLocaleString('en-IN')}${prop.transaction_type === 'rent' ? '/month' : ''}\nStatus: Available`
                  );
                  const waUrl = `https://wa.me/?text=${shareText}`;
                  return (
                    <div
                      key={prop.property_id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '8px',
                        border: `1px solid ${themeTokens.colors.border}`,
                        backgroundColor: '#FFFFFF',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1, marginRight: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 800, color: themeTokens.colors.primaryDark, fontSize: '13px' }}>
                            {prop.property_id}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>
                            {prop.property_type} • {prop.society_name}
                          </span>
                          <Badge
                            label={`${m.match_score}% MATCH`}
                            variant={m.match_score >= 80 ? 'success' : m.match_score >= 60 ? 'primary' : 'warning'}
                          />
                        </div>
                        <div style={{ fontSize: '12px', color: themeTokens.colors.textSecondary, marginTop: '3px' }}>
                          ₹{(prop.expected_amount ?? 0).toLocaleString('en-IN')} {prop.transaction_type === 'rent' ? '/mo' : ''} • {prop.location}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                          {m.match_reasons.map((r: string, idx: number) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: themeTokens.colors.softSurface,
                                color: themeTokens.colors.textSecondary,
                              }}
                            >
                              ✓ {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button
                            label="Schedule Showing"
                            variant="primary"
                            size="sm"
                            icon={<Calendar size={12} />}
                            onClick={() => openScheduleFromMatch(prop)}
                          />
                          <Button
                            label="Close Deal"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const enq = matchesModalEnquiry;
                              setMatchesModalEnquiry(null);
                              setStatusModalEnquiry(enq);
                              setNewStatus('deal_closed');
                              setDealPropertyId(prop.property_id);
                              setDealAmount(prop.expected_amount);
                            }}
                          />
                        </div>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: '#25D366',
                            color: '#FFFFFF',
                            textDecoration: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          <Share2 size={13} />
                          Share via WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${themeTokens.colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>
                Advisory only. Candidate properties are not reserved automatically until a Visit is scheduled or Deal is closed.
              </span>
              <Button label="Close" variant="outline" size="sm" onClick={() => setMatchesModalEnquiry(null)} />
            </div>
          </div>
        </Modal>
      )}

      {/* Schedule Showing Sub-Modal from Matches */}
      {scheduleShowingProp && matchesModalEnquiry && (
        <Modal
          isOpen={!!scheduleShowingProp}
          onClose={() => setScheduleShowingProp(null)}
          title={`Schedule Showing — Unit #${scheduleShowingProp.property_id}`}
          maxWidth="480px"
        >
          <form onSubmit={handleConfirmScheduleShowing} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                backgroundColor: '#FAF5FF',
                border: '1px solid #DDD6FE',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#4C1D95' }}>
                #{scheduleShowingProp.property_id} • {scheduleShowingProp.society_name}
              </div>
              <div style={{ fontSize: '12px', color: '#6B21A8', marginTop: '4px' }}>
                {scheduleShowingProp.property_type} • {scheduleShowingProp.location} • ₹{(scheduleShowingProp.expected_amount || 0).toLocaleString('en-IN')}{scheduleShowingProp.transaction_type === 'rent' ? '/mo' : ''}
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#475569', backgroundColor: '#F8FAFC', padding: '8px 12px', borderRadius: '6px' }}>
              Enquiry: <strong>#{matchesModalEnquiry.enquiry_id}</strong> — {matchesModalEnquiry.customer_name} ({matchesModalEnquiry.customer_phone})
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Showing Date & Time *
              </label>
              <input
                type="datetime-local"
                value={showingDateTime}
                onChange={(e) => setShowingDateTime(e.target.value)}
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

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Showing Instructions & Notes
              </label>
              <textarea
                value={showingNotes}
                onChange={(e) => setShowingNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Client requested key from security desk"
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Button
                label="Cancel"
                variant="outline"
                size="sm"
                onClick={() => setScheduleShowingProp(null)}
                type="button"
              />
              <Button
                label={schedulingVisit ? 'Scheduling...' : 'Confirm Showing'}
                variant="primary"
                size="sm"
                disabled={schedulingVisit || !showingDateTime}
                type="submit"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Excel Import Modal (PRD Section 5.19) */}
      <ExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          fetchCustomers();
          fetchEnquiries();
        }}
        defaultSheetType="enquiries"
      />

      {/* Comprehensive Enquiry Detail & Action Modal */}
      {selectedEnquiryDetail && (
        <Modal
          isOpen={!!selectedEnquiryDetail}
          onClose={() => setSelectedEnquiryDetail(null)}
          title={`Enquiry Dossier — #${selectedEnquiryDetail.enquiry_id}`}
          maxWidth="900px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '80vh', overflowY: 'auto' }}>
            {/* Top Bar with Status and Creation Date */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#F8FAFC',
                borderRadius: '8px',
                border: `1px solid ${themeTokens.colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 800, fontSize: '16px', color: themeTokens.colors.primaryDark }}>
                  #{selectedEnquiryDetail.enquiry_id}
                </span>
                <Badge
                  label={selectedEnquiryDetail.status.replace('_', ' ').toUpperCase()}
                  variant={
                    selectedEnquiryDetail.status === 'deal_closed'
                      ? 'success'
                      : selectedEnquiryDetail.status === 'visit_scheduled'
                      ? 'primary'
                      : selectedEnquiryDetail.status === 'aborted'
                      ? 'danger'
                      : 'warning'
                  }
                />
                <Badge
                  label={selectedEnquiryDetail.transaction_type ? selectedEnquiryDetail.transaction_type.toUpperCase() : 'RENT'}
                  variant="neutral"
                />
              </div>

              <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} color="#64748B" />
                <span>
                  Created: {formatDateTime(selectedEnquiryDetail.created_at)}
                </span>
              </div>
            </div>

            {/* Main Content Grid: Left specs & client, Right timeline */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Left Column: Customer & Enquiry Specs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Customer Details Box */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: `1px solid ${themeTokens.colors.border}`,
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '0.04em', marginBottom: '8px' }}>
                    CLIENT CONTACT
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>
                        {selectedEnquiryDetail.customer_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        Phone: {selectedEnquiryDetail.customer_phone || 'Not available'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {selectedEnquiryDetail.customer_phone && (
                        <>
                          <Button
                            label="Call"
                            icon={<Phone size={12} />}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              window.location.href = `tel:${selectedEnquiryDetail.customer_phone}`;
                            }}
                          />
                          <Button
                            label="WA"
                            icon={<MessageCircle size={12} color="#16A34A" />}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const clean = selectedEnquiryDetail.customer_phone.replace(/[^0-9]/g, '');
                              window.open(`https://wa.me/${clean}`, '_blank');
                            }}
                          />
                        </>
                      )}
                      <Button
                        label="Details"
                        icon={<Eye size={12} />}
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          const target = selectedEnquiryDetail.customer_id || selectedEnquiryDetail.customer_phone;
                          if (target) setCustomer360Id(target);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Requirement Specifications */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: `1px solid ${themeTokens.colors.border}`,
                    backgroundColor: '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '0.04em' }}>
                    REQUIREMENT SPECIFICATIONS
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
                      <div style={{ fontSize: '10px', color: '#64748B' }}>LOOKING FOR</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                        {selectedEnquiryDetail.looking_for}
                      </div>
                    </div>

                    <div style={{ padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
                      <div style={{ fontSize: '10px', color: '#64748B' }}>BUDGET RANGE</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                        ₹{(selectedEnquiryDetail.budget_min ?? 0).toLocaleString('en-IN')} - ₹{(selectedEnquiryDetail.budget_max ?? 0).toLocaleString('en-IN')}
                        <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748B' }}>
                          {selectedEnquiryDetail.transaction_type === 'rent' ? '/mo' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedEnquiryDetail.preferred_locations?.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#334155' }}>
                      <span style={{ fontWeight: 600 }}>Locations: </span>
                      {selectedEnquiryDetail.preferred_locations.join(', ')}
                    </div>
                  )}

                  {selectedEnquiryDetail.preferred_societies?.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#334155' }}>
                      <span style={{ fontWeight: 600 }}>Societies: </span>
                      {selectedEnquiryDetail.preferred_societies.join(', ')}
                    </div>
                  )}

                  {selectedEnquiryDetail.tenant_type && (
                    <div style={{ fontSize: '12px', color: '#334155' }}>
                      <span style={{ fontWeight: 600 }}>Tenant Preference: </span>
                      {selectedEnquiryDetail.tenant_type}
                    </div>
                  )}

                  {selectedEnquiryDetail.notes && (
                    <div style={{ padding: '8px 10px', backgroundColor: '#FFFBEB', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#B45309' }}>ENQUIRY NOTES</div>
                      <div style={{ fontSize: '12px', color: '#78350F', marginTop: '2px' }}>
                        {selectedEnquiryDetail.notes}
                      </div>
                    </div>
                  )}
                </div>

                {/* Single Enquiry Action Suite */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: `1px solid ${themeTokens.colors.border}`,
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '0.04em', marginBottom: '10px' }}>
                    EXECUTIVE ACTIONS
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <Button
                      label="Smart Matches"
                      icon={<Sparkles size={13} />}
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const enq = selectedEnquiryDetail;
                        openMatchesModal(enq);
                      }}
                    />
                    <Button
                      label="Update Status"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStatusModalEnquiry(selectedEnquiryDetail);
                        setNewStatus(selectedEnquiryDetail.status);
                      }}
                    />
                    <Button
                      label="Close Deal"
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setStatusModalEnquiry(selectedEnquiryDetail);
                        setNewStatus('deal_closed');
                      }}
                    />
                    <Button
                      label="Drop / Abort"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStatusModalEnquiry(selectedEnquiryDetail);
                        setNewStatus('aborted');
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Executive Action Timeline */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>
                    EXECUTIVE ACTION TIMELINE
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    {enquiryTimeline.length} events logged
                  </span>
                </div>

                {/* Log Quick Follow-up Note Form */}
                <form onSubmit={handleAddTimelineNote} style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Log executive follow-up, call note or action..."
                    value={timelineNote}
                    onChange={(e) => setTimelineNote(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${themeTokens.colors.border}`,
                      fontSize: '12px',
                    }}
                  />
                  <Button
                    label={submittingTimelineNote ? '...' : '+ Note'}
                    size="sm"
                    variant="primary"
                    type="submit"
                    disabled={submittingTimelineNote || !timelineNote.trim()}
                  />
                </form>

                {/* Timeline Stream */}
                {loadingTimeline ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                    Loading action timeline...
                  </div>
                ) : enquiryTimeline.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '12px' }}>
                    No activity logged yet for this enquiry.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' }}>
                    {enquiryTimeline.map((item: any, idx: number) => {
                      const isVisit = item.type === 'visit';
                      const isFollowup = item.type === 'followup';
                      const isStatus = item.event_type?.includes('status') || item.type === 'status_change';
                      const isCreated = item.event_type?.includes('created');

                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            backgroundColor: isVisit ? '#F0FDF4' : isFollowup ? '#FFFBEB' : '#F8FAFC',
                            border: `1px solid ${isVisit ? '#BBF7D0' : isFollowup ? '#FDE68A' : '#E2E8F0'}`,
                            fontSize: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1E293B' }}>
                              {isVisit ? (
                                <Calendar size={13} color="#15803D" />
                              ) : isFollowup ? (
                                <Clock size={13} color="#B45309" />
                              ) : isCreated ? (
                                <CheckCircle2 size={13} color="#4338CA" />
                              ) : isStatus ? (
                                <UserCheck size={13} color="#4F46E5" />
                              ) : (
                                <FileText size={13} color="#475569" />
                              )}
                              <span>
                                {isVisit
                                  ? `Site Showing: ${item.status || 'Scheduled'}`
                                  : isFollowup
                                  ? 'Executive Note / Follow-up'
                                  : item.title || item.event_type || 'Activity'}
                              </span>
                            </div>
                            <span style={{ fontSize: '10px', color: '#64748B' }}>
                              {item.created_at || item.timestamp || item.scheduled_at
                                ? formatDateTime(item.created_at || item.timestamp || item.scheduled_at)
                                : ''}
                            </span>
                          </div>

                          {/* Event Description & Remarks */}
                          <div style={{ marginTop: '4px', color: '#334155' }}>
                            {item.notes || item.remarks || item.outcome || item.details?.notes || (item.details ? JSON.stringify(item.details) : '')}
                          </div>

                          {/* Executive Name */}
                          <div style={{ marginTop: '4px', fontSize: '10px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>Executive:</span>
                            <strong style={{ color: '#0F172A' }}>
                              {item.actor_name || item.executive_name || item.created_by_name || 'System / Auto'}
                            </strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${themeTokens.colors.border}`, paddingTop: '10px' }}>
              <Button label="Close" variant="outline" size="sm" onClick={() => setSelectedEnquiryDetail(null)} />
            </div>
          </div>
        </Modal>
      )}

      {/* 360 Degree Customer Modal */}
      <Customer360Modal
        customerId={customer360Id}
        isOpen={!!customer360Id}
        onClose={() => setCustomer360Id(null)}
      />
    </div>
  );
};
