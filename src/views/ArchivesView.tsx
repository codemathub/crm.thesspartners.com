import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { themeTokens } from '../theme/tokens';
import {
  Archive,
  RotateCcw,
  Trash2,
  Search,
  RefreshCw,
  Award,
  AlertTriangle,
  Building,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { api, ArchiveStats, DealRecord, Property } from '../services/api';

export const ArchivesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'deals' | 'properties' | 'enquiries'>('deals');
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [transFilter, setTransFilter] = useState('all');

  // Lists
  const [deals, setDeals] = useState<DealRecord[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [restoreModalItem, setRestoreModalItem] = useState<{ type: 'property' | 'enquiry'; id: string; title: string } | null>(null);
  const [deleteModalItem, setDeleteModalItem] = useState<{ type: 'property' | 'enquiry'; id: string; title: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.getArchiveStats();
      setStats(res);
    } catch (err) {
      console.error('Failed to load archive stats:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'deals') {
        const res = await api.getArchivedDeals({
          search: searchQuery.trim() || undefined,
          transaction_type: transFilter !== 'all' ? transFilter : undefined,
        });
        setDeals(res.items || []);
      } else if (activeTab === 'properties') {
        const res = await api.getArchivedProperties({
          search: searchQuery.trim() || undefined,
          status_filter: statusFilter !== 'all' ? statusFilter : undefined,
          transaction_type: transFilter !== 'all' ? transFilter : undefined,
        });
        setProperties(res.items || []);
      } else {
        const res = await api.getArchivedEnquiries({
          search: searchQuery.trim() || undefined,
          status_filter: statusFilter !== 'all' ? statusFilter : undefined,
          transaction_type: transFilter !== 'all' ? transFilter : undefined,
        });
        setEnquiries(res.items || []);
      }
    } catch (err) {
      console.error('Failed to load archives:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter, transFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleConfirmRestore = async () => {
    if (!restoreModalItem) return;
    setSubmittingAction(true);
    try {
      if (restoreModalItem.type === 'property') {
        await api.restoreArchivedProperty(restoreModalItem.id);
        alert(`Property '${restoreModalItem.id}' restored to active available inventory.`);
      } else {
        await api.restoreArchivedEnquiry(restoreModalItem.id);
        alert(`Enquiry '${restoreModalItem.id}' restored to active pipeline.`);
      }
      setRestoreModalItem(null);
      fetchStats();
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to restore record.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!deleteModalItem || !deleteReason.trim()) {
      alert('Please provide a mandatory audit reason for permanent deletion.');
      return;
    }
    setSubmittingAction(true);
    try {
      if (deleteModalItem.type === 'property') {
        await api.permanentlyDeleteProperty(deleteModalItem.id, deleteReason.trim());
        alert(`Property '${deleteModalItem.id}' permanently deleted from MongoDB.`);
      } else {
        await api.permanentlyDeleteEnquiry(deleteModalItem.id, deleteReason.trim());
        alert(`Enquiry '${deleteModalItem.id}' permanently deleted from MongoDB.`);
      }
      setDeleteModalItem(null);
      setDeleteReason('');
      fetchStats();
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to permanently delete record.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Columns for Deals Table
  const dealColumns: Column<DealRecord>[] = [
    {
      key: 'deal_id',
      header: 'Deal ID / Ref',
      render: (d) => (
        <div>
          <div style={{ fontWeight: 700, color: themeTokens.colors.primaryDark }}>{d.deal_id}</div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>Enq: {d.enquiry_id}</div>
        </div>
      ),
    },
    {
      key: 'customer_name',
      header: 'Customer',
      render: (d) => (
        <div>
          <div style={{ fontWeight: 600, color: themeTokens.colors.textPrimary }}>{d.customer_name}</div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>ID: {d.customer_id}</div>
        </div>
      ),
    },
    {
      key: 'property_id',
      header: 'Closed Asset',
      render: (d) => (
        <div>
          <div style={{ fontWeight: 600, color: themeTokens.colors.textPrimary }}>{d.property_id}</div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>
            {d.property_society} {d.property_bhk ? `• ${d.property_bhk}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'transaction_type',
      header: 'Transaction',
      render: (d) => (
        <Badge
          label={d.transaction_type.toUpperCase()}
          variant={d.transaction_type === 'sale' ? 'success' : 'info'}
        />
      ),
    },
    {
      key: 'deal_amount',
      header: 'Closed Amount',
      render: (d) => (
        <div style={{ fontWeight: 700, color: '#047857' }}>
          ₹{d.deal_amount?.toLocaleString('en-IN') || '—'}
        </div>
      ),
    },
    {
      key: 'responsible_executive_name',
      header: 'Closed By',
      render: (d) => (
        <span style={{ fontSize: '12px', fontWeight: 500, color: themeTokens.colors.textPrimary }}>
          {d.responsible_executive_name}
        </span>
      ),
    },
    {
      key: 'deal_date',
      header: 'Closing Date',
      render: (d) => (
        <span style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>
          {new Date(d.deal_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Details',
      render: (d) => (
        <Button
          label="View Deal"
          variant="outline"
          size="sm"
          onClick={() => setSelectedRecord({ ...d, _recordType: 'deal' })}
        />
      ),
    },
  ];

  // Columns for Properties Archive Table
  const propertyColumns: Column<Property>[] = [
    {
      key: 'property_id',
      header: 'Property ID',
      render: (p) => (
        <div>
          <div style={{ fontWeight: 700, color: themeTokens.colors.primaryDark }}>{p.property_id}</div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>{p.property_type}</div>
        </div>
      ),
    },
    {
      key: 'society_name',
      header: 'Society & Area',
      render: (p) => (
        <div>
          <div style={{ fontWeight: 600, color: themeTokens.colors.textPrimary }}>{p.society_name}</div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>{p.location}</div>
        </div>
      ),
    },
    {
      key: 'expected_amount',
      header: 'Expected Price',
      render: (p) => (
        <div style={{ fontWeight: 600, color: themeTokens.colors.textPrimary }}>
          ₹{p.expected_amount?.toLocaleString('en-IN')}
          <span style={{ fontSize: '10px', color: themeTokens.colors.textSecondary, marginLeft: '4px' }}>
            {p.transaction_type === 'rent' ? '/mo' : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Archive Status',
      render: (p) => {
        const variant = p.status === 'sold' ? 'success' : p.status === 'rented' ? 'info' : 'warning';
        return <Badge label={p.status.toUpperCase()} variant={variant} />;
      },
    },
    {
      key: 'updated_at',
      header: 'Archived On',
      render: (p) => (
        <span style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>
          {new Date(p.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button
            label="Restore"
            variant="outline"
            size="sm"
            icon={<RotateCcw size={12} />}
            onClick={() => setRestoreModalItem({ type: 'property', id: p.property_id, title: `${p.property_id} (${p.society_name})` })}
          />
          <Button
            label="Delete"
            variant="danger"
            size="sm"
            icon={<Trash2 size={12} />}
            onClick={() => {
              setDeleteModalItem({ type: 'property', id: p.property_id, title: `${p.property_id} (${p.society_name})` });
              setDeleteReason('');
            }}
          />
        </div>
      ),
    },
  ];

  // Columns for Enquiries Archive Table
  const enquiryColumns: Column<any>[] = [
    {
      key: 'enquiry_id',
      header: 'Enquiry ID',
      render: (e) => (
        <div>
          <div style={{ fontWeight: 700, color: themeTokens.colors.primaryDark }}>{e.enquiry_id}</div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>{e.customer_name}</div>
        </div>
      ),
    },
    {
      key: 'looking_for',
      header: 'Requirement',
      render: (e) => (
        <div>
          <div style={{ fontWeight: 600, color: themeTokens.colors.textPrimary }}>{e.looking_for}</div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>
            ₹{e.budget_min?.toLocaleString('en-IN')} - ₹{e.budget_max?.toLocaleString('en-IN')}
          </div>
        </div>
      ),
    },
    {
      key: 'transaction_type',
      header: 'Type',
      render: (e) => (
        <Badge
          label={e.transaction_type.toUpperCase()}
          variant={e.transaction_type === 'sale' ? 'success' : 'info'}
        />
      ),
    },
    {
      key: 'status',
      header: 'Outcome Status',
      render: (e) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Badge
            label={e.status === 'deal_closed' ? 'DEAL CLOSED' : 'ABORTED'}
            variant={e.status === 'deal_closed' ? 'success' : 'danger'}
          />
          {e.abort_reason && (
            <span style={{ fontSize: '10px', color: themeTokens.colors.textSecondary, fontStyle: 'italic', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {e.abort_reason}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'updated_at',
      header: 'Date',
      render: (e) => (
        <span style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>
          {new Date(e.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (e) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button
            label="Restore"
            variant="outline"
            size="sm"
            icon={<RotateCcw size={12} />}
            onClick={() => setRestoreModalItem({ type: 'enquiry', id: e.enquiry_id, title: `${e.enquiry_id} (${e.customer_name})` })}
          />
          <Button
            label="Delete"
            variant="danger"
            size="sm"
            icon={<Trash2 size={12} />}
            onClick={() => {
              setDeleteModalItem({ type: 'enquiry', id: e.enquiry_id, title: `${e.enquiry_id} (${e.customer_name})` });
              setDeleteReason('');
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
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
            <span style={{ fontSize: '10px', fontWeight: 800, color: themeTokens.colors.primaryDark, letterSpacing: '0.08em' }}>
              COMPANY RECORD LIFECYCLE • ARCHIVES & DEALS
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#F3F4F6',
                color: '#4B5563',
                fontWeight: 700,
              }}
            >
              ● Protected Audit Vault
            </span>
          </div>

          <h1 style={{ fontSize: '22px', fontWeight: 800, color: themeTokens.colors.textPrimary, margin: 0 }}>
            Closed Deals, Aborted Pipeline & Historical Archives
          </h1>
          <p style={{ fontSize: '13px', color: themeTokens.colors.textSecondary, marginTop: '4px', marginBottom: 0 }}>
            Searchable historical records of closed deals, rented and sold units, and aborted enquiries. Super Admin restore and deletion governance.
          </p>
        </div>

        <Button
          label="Refresh Archives"
          icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
          variant="outline"
          onClick={() => {
            fetchStats();
            fetchData();
          }}
        />
      </div>

      {/* KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: `1px solid ${themeTokens.colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#059669' }}>
              <Award size={16} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: themeTokens.colors.textSecondary }}>CLOSED DEALS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#065F46' }}>
            {stats?.closed_deals_count || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>Converted contracts</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: `1px solid ${themeTokens.colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <Building size={16} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: themeTokens.colors.textSecondary }}>RENTED UNITS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#1E40AF' }}>
            {stats?.rented_properties_count || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>Active leases</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: `1px solid ${themeTokens.colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#F0FDF4', color: '#16A34A' }}>
              <Building size={16} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: themeTokens.colors.textSecondary }}>SOLD UNITS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#15803D' }}>
            {stats?.sold_properties_count || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>Completed sales</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: `1px solid ${themeTokens.colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#FEF2F2', color: '#DC2626' }}>
              <AlertTriangle size={16} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: themeTokens.colors.textSecondary }}>ABORTED ENQUIRIES</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#991B1B' }}>
            {stats?.aborted_enquiries_count || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>With audit reason</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: `1px solid ${themeTokens.colors.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#F3F4F6', color: '#4B5563' }}>
              <Archive size={16} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: themeTokens.colors.textSecondary }}>OFF-MARKET ARCHIVED</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#374151' }}>
            {stats?.archived_properties_count || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>Restorable units</div>
        </div>
      </div>

      {/* Filter and Tab Bar */}
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
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'deals', label: 'Closed Deals Ledger', count: stats?.closed_deals_count || 0, icon: <Award size={14} /> },
            { key: 'properties', label: 'Rented / Sold / Archived Properties', count: stats?.total_archived_properties || 0, icon: <Building size={14} /> },
            { key: 'enquiries', label: 'Closed & Aborted Enquiries', count: stats?.total_archived_enquiries || 0, icon: <UserCheck size={14} /> },
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
                backgroundColor: activeTab === tab.key ? themeTokens.colors.primaryDark : '#F1F5F9',
                color: activeTab === tab.key ? '#FFFFFF' : '#475569',
                transition: 'all 0.1s ease',
              }}
            >
              <span>{tab.icon}</span>
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

        {/* Search & Filter Controls */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${themeTokens.colors.border}`,
              backgroundColor: '#FFFFFF',
            }}
          >
            <Search size={14} color={themeTokens.colors.textSecondary} />
            <input
              type="text"
              placeholder="Search by ID, client, or society..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '12px', width: '220px' }}
            />
          </div>

          {activeTab === 'properties' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: `1px solid ${themeTokens.colors.border}`,
                fontSize: '12px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="rented">Rented Units</option>
              <option value="sold">Sold Units</option>
              <option value="archived">Archived Units</option>
            </select>
          )}

          {activeTab === 'enquiries' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: `1px solid ${themeTokens.colors.border}`,
                fontSize: '12px',
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="all">All Outcomes</option>
              <option value="deal_closed">Deal Closed</option>
              <option value="aborted">Aborted Enquiries</option>
            </select>
          )}

          <select
            value={transFilter}
            onChange={(e) => setTransFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: `1px solid ${themeTokens.colors.border}`,
              fontSize: '12px',
              backgroundColor: '#FFFFFF',
            }}
          >
            <option value="all">Rent & Sale</option>
            <option value="rent">Rent Only</option>
            <option value="sale">Sale Only</option>
          </select>

          <Button label="Search" variant="primary" size="sm" type="submit" />
        </form>
      </div>

      {/* Main Table Card */}
      <Card>
        {activeTab === 'deals' && (
          <Table
            columns={dealColumns}
            data={deals}
            keyExtractor={(d) => d.id}
            onRowClick={(d) => setSelectedRecord({ ...d, _recordType: 'deal' })}
          />
        )}

        {activeTab === 'properties' && (
          <Table
            columns={propertyColumns}
            data={properties}
            keyExtractor={(p) => p.id}
            onRowClick={(p) => setSelectedRecord({ ...p, _recordType: 'property' })}
          />
        )}

        {activeTab === 'enquiries' && (
          <Table
            columns={enquiryColumns}
            data={enquiries}
            keyExtractor={(e) => e.id}
            onRowClick={(e) => setSelectedRecord({ ...e, _recordType: 'enquiry' })}
          />
        )}
      </Card>

      {/* Modal 1: Record Details View */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Historical Record Details • ${selectedRecord.deal_id || selectedRecord.property_id || selectedRecord.enquiry_id}`}
          maxWidth="560px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              {selectedRecord._recordType === 'deal' && (
                <>
                  <div><strong>Deal Reference:</strong> {selectedRecord.deal_id}</div>
                  <div><strong>Linked Enquiry:</strong> {selectedRecord.enquiry_id}</div>
                  <div><strong>Customer:</strong> {selectedRecord.customer_name} ({selectedRecord.customer_id})</div>
                  <div><strong>Closed Asset:</strong> {selectedRecord.property_id} ({selectedRecord.property_society})</div>
                  <div><strong>Closed Amount:</strong> ₹{selectedRecord.deal_amount?.toLocaleString('en-IN')}</div>
                  <div><strong>Closing Executive:</strong> {selectedRecord.responsible_executive_name}</div>
                  <div><strong>Closing Remarks:</strong> {selectedRecord.final_remarks || '—'}</div>
                  <div><strong>Date:</strong> {new Date(selectedRecord.deal_date).toLocaleString('en-IN')}</div>
                </>
              )}

              {selectedRecord._recordType === 'property' && (
                <>
                  <div><strong>Property ID:</strong> {selectedRecord.property_id}</div>
                  <div><strong>Society:</strong> {selectedRecord.society_name} ({selectedRecord.location})</div>
                  <div><strong>Type / BHK:</strong> {selectedRecord.property_type} • {selectedRecord.bhk || '—'}</div>
                  <div><strong>Owner:</strong> {selectedRecord.owner_name} ({selectedRecord.owner_phone})</div>
                  <div><strong>Status:</strong> {selectedRecord.status.toUpperCase()}</div>
                  <div><strong>Price:</strong> ₹{selectedRecord.expected_amount?.toLocaleString('en-IN')}</div>
                  <div><strong>Last Updated:</strong> {new Date(selectedRecord.updated_at).toLocaleString('en-IN')}</div>
                </>
              )}

              {selectedRecord._recordType === 'enquiry' && (
                <>
                  <div><strong>Enquiry ID:</strong> {selectedRecord.enquiry_id}</div>
                  <div><strong>Customer:</strong> {selectedRecord.customer_name} ({selectedRecord.customer_phone})</div>
                  <div><strong>Requirement:</strong> {selectedRecord.looking_for}</div>
                  <div><strong>Budget:</strong> ₹{selectedRecord.budget_min?.toLocaleString('en-IN')} - ₹{selectedRecord.budget_max?.toLocaleString('en-IN')}</div>
                  <div><strong>Outcome Status:</strong> {selectedRecord.status.toUpperCase()}</div>
                  {selectedRecord.abort_reason && (
                    <div><strong>Abort Reason:</strong> <span style={{ color: '#DC2626' }}>{selectedRecord.abort_reason}</span></div>
                  )}
                  {selectedRecord.final_remarks && (
                    <div><strong>Remarks:</strong> {selectedRecord.final_remarks}</div>
                  )}
                  <div><strong>Last Updated:</strong> {new Date(selectedRecord.updated_at).toLocaleString('en-IN')}</div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button label="Close" variant="outline" size="sm" onClick={() => setSelectedRecord(null)} />
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 2: Restore Record Confirmation */}
      {restoreModalItem && (
        <Modal
          isOpen={!!restoreModalItem}
          onClose={() => setRestoreModalItem(null)}
          title={`Restore ${restoreModalItem.type === 'property' ? 'Property' : 'Enquiry'} to Active Operations`}
          maxWidth="460px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <p style={{ margin: 0, color: themeTokens.colors.textSecondary, lineHeight: 1.5 }}>
              Are you sure you want to restore <strong>{restoreModalItem.title}</strong>?
              {restoreModalItem.type === 'property' ? (
                <span> It will be returned to active inventory with status <strong>Available</strong>.</span>
              ) : (
                <span> It will be returned to the active enquiries pipeline with status <strong>Contacted</strong>.</span>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <Button label="Cancel" variant="outline" size="sm" onClick={() => setRestoreModalItem(null)} />
              <Button
                label={submittingAction ? 'Restoring...' : 'Confirm Restore'}
                variant="primary"
                size="sm"
                icon={<RotateCcw size={12} />}
                disabled={submittingAction}
                onClick={handleConfirmRestore}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 3: High-Friction Exceptional Permanent Deletion Modal */}
      {deleteModalItem && (
        <Modal
          isOpen={!!deleteModalItem}
          onClose={() => setDeleteModalItem(null)}
          title="Exceptional Permanent Deletion (Super Admin Only)"
          maxWidth="500px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <div style={{ display: 'flex', gap: '10px', padding: '12px', backgroundColor: '#FEF2F2', borderRadius: '8px', border: '1px solid #FCA5A5' }}>
              <ShieldAlert size={22} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 800, color: '#991B1B' }}>Warning: Irreversible Deletion</div>
                <div style={{ fontSize: '12px', color: '#B91C1C', marginTop: '2px', lineHeight: 1.4 }}>
                  Permanent deletion physically destroys <strong>{deleteModalItem.title}</strong> from MongoDB Atlas. A mandatory audit log event will be written recording your Super Admin identity and reason.
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Mandatory Audit Justification / Reason *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Test record created during QA; legal expungement authorized by company governance..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '12px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <Button label="Cancel" variant="outline" size="sm" onClick={() => setDeleteModalItem(null)} />
              <Button
                label={submittingAction ? 'Deleting...' : 'Authorize & Permanently Delete'}
                variant="danger"
                size="sm"
                icon={<Trash2 size={12} />}
                disabled={submittingAction || !deleteReason.trim()}
                onClick={handleConfirmPermanentDelete}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
