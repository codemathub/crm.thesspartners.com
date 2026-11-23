import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { themeTokens } from '../theme/tokens';
import {
  Building,
  RefreshCw,
  Download,
} from 'lucide-react';
import { api, ReportKPIs, ExecutivePerformanceItem, DrilldownItem } from '../services/api';

export const ReportsView: React.FC = () => {
  const [kpis, setKpis] = useState<ReportKPIs | null>(null);
  const [executives, setExecutives] = useState<ExecutivePerformanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Drilldown Modal
  const [drilldownModal, setDrilldownModal] = useState<{ title: string; metric: string } | null>(null);
  const [drilldownItems, setDrilldownItems] = useState<DrilldownItem[]>([]);
  const [loadingDrilldown, setLoadingDrilldown] = useState(false);
  const [exportingDeals, setExportingDeals] = useState(false);

  const handleExportDeals = async () => {
    try {
      setExportingDeals(true);
      await api.downloadExcelExport('deals');
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setExportingDeals(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [kpiRes, execRes] = await Promise.all([
        api.getReportKPIs(),
        api.getExecutivePerformance(),
      ]);
      setKpis(kpiRes);
      setExecutives(execRes.items || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const openDrilldown = async (title: string, metric: string) => {
    setDrilldownModal({ title, metric });
    setLoadingDrilldown(true);
    try {
      const res = await api.getReportDrilldown(metric);
      setDrilldownItems(res.items || []);
    } catch (err) {
      console.error('Failed to load drilldown:', err);
      setDrilldownItems([]);
    } finally {
      setLoadingDrilldown(false);
    }
  };

  const columns: Column<ExecutivePerformanceItem>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (e) => (
        <div>
          <div style={{ fontWeight: 700, color: themeTokens.colors.textPrimary }}>{e.name}</div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>{e.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (e) => <Badge label={e.role.toUpperCase()} variant={e.role === 'Admin' ? 'info' : 'primary'} />,
    },
    {
      key: 'assigned_enquiries',
      header: 'Pipeline Leads',
      render: (e) => <span style={{ fontWeight: 600 }}>{e.assigned_enquiries}</span>,
    },
    {
      key: 'completed_visits',
      header: 'Field Visits',
      render: (e) => <span style={{ fontWeight: 600, color: '#2563EB' }}>{e.completed_visits}</span>,
    },
    {
      key: 'pending_tasks',
      header: 'Active Tasks',
      render: (e) => <span style={{ fontWeight: 600 }}>{e.pending_tasks}</span>,
    },
    {
      key: 'overdue_followups',
      header: 'Overdue Follow-ups',
      render: (e) => (
        <span style={{ fontWeight: 700, color: e.overdue_followups > 0 ? themeTokens.colors.danger : '#059669' }}>
          {e.overdue_followups}
        </span>
      ),
    },
    {
      key: 'closed_deals',
      header: 'Deals Closed',
      render: (e) => <span style={{ fontWeight: 800, color: '#047857' }}>{e.closed_deals}</span>,
    },
    {
      key: 'total_deal_volume',
      header: 'Closed Volume (₹)',
      render: (e) => (
        <span style={{ fontWeight: 700, color: themeTokens.colors.textPrimary }}>
          ₹{e.total_deal_volume?.toLocaleString('en-IN') || '0'}
        </span>
      ),
    },
    {
      key: 'conversion_rate',
      header: 'Conversion',
      render: (e) => (
        <Badge
          label={`${e.conversion_rate}%`}
          variant={e.conversion_rate >= 20 ? 'success' : e.conversion_rate >= 10 ? 'primary' : 'neutral'}
        />
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
              EXECUTIVE INTELLIGENCE • PRD SECTION 5.18
            </span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#EEF2FF',
                color: '#3730A3',
                fontWeight: 700,
              }}
            >
              ● Company Performance Ledger
            </span>
          </div>

          <h1 style={{ fontSize: '22px', fontWeight: 800, color: themeTokens.colors.textPrimary, margin: 0 }}>
            Executive Performance & Company Reporting Analytics
          </h1>
          <p style={{ fontSize: '13px', color: themeTokens.colors.textSecondary, marginTop: '4px', marginBottom: 0 }}>
            Authoritative breakdown of executive conversion rates, field activity throughput, and property inventory turnover.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Date range filter pills */}
          <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '3px' }}>
            {(['7d', '30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: dateRange === r ? 700 : 500,
                  backgroundColor: dateRange === r ? '#FFFFFF' : 'transparent',
                  color: dateRange === r ? themeTokens.colors.primaryDark : '#64748B',
                  boxShadow: dateRange === r ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : r === '90d' ? 'Quarter' : 'All Time'}
              </button>
            ))}
          </div>

          <Button
            label={exportingDeals ? 'Exporting...' : 'Export Deals (.xlsx)'}
            icon={<Download size={14} />}
            variant="outline"
            onClick={handleExportDeals}
            disabled={exportingDeals}
          />
          <Button
            label="Refresh"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            variant="outline"
            onClick={fetchReports}
          />
        </div>
      </div>

      {/* Primary KPI Grid (6 metrics) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
        <div
          onClick={() => openDrilldown('Total Managed Properties', 'available_properties')}
          style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: `1px solid ${themeTokens.colors.border}`, cursor: 'pointer' }}
        >
          <div style={{ fontSize: '10px', fontWeight: 800, color: themeTokens.colors.textSecondary, letterSpacing: '0.04em' }}>
            TOTAL INVENTORY
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: themeTokens.colors.textPrimary, marginTop: '4px' }}>
            {kpis?.total_properties || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 600, marginTop: '2px' }}>
            {kpis?.available_properties || 0} Available
          </div>
        </div>

        <div
          onClick={() => openDrilldown('Closed Deals', 'closed_deals')}
          style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: `1px solid ${themeTokens.colors.border}`, cursor: 'pointer' }}
        >
          <div style={{ fontSize: '10px', fontWeight: 800, color: themeTokens.colors.textSecondary, letterSpacing: '0.04em' }}>
            CLOSED DEALS
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#047857', marginTop: '4px' }}>
            {kpis?.closed_deals || 0}
          </div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
            ₹{kpis?.total_deal_volume ? (kpis.total_deal_volume / 100000).toFixed(1) : '0'} Lakhs Vol
          </div>
        </div>

        <div
          onClick={() => openDrilldown('New Enquiries This Week', 'new_enquiries_this_week')}
          style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: `1px solid ${themeTokens.colors.border}`, cursor: 'pointer' }}
        >
          <div style={{ fontSize: '10px', fontWeight: 800, color: themeTokens.colors.textSecondary, letterSpacing: '0.04em' }}>
            NEW LEADS (7D)
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#2563EB', marginTop: '4px' }}>
            +{kpis?.new_enquiries_this_week || 0}
          </div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
            {kpis?.total_enquiries || 0} Total in Pipeline
          </div>
        </div>

        <div
          onClick={() => openDrilldown("Today's Scheduled Visits", 'today_scheduled_visits')}
          style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: `1px solid ${themeTokens.colors.border}`, cursor: 'pointer' }}
        >
          <div style={{ fontSize: '10px', fontWeight: 800, color: themeTokens.colors.textSecondary, letterSpacing: '0.04em' }}>
            TODAY'S VISITS
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>
            {kpis?.today_scheduled_visits || 0}
          </div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
            {kpis?.completed_visits || 0} Conducted Total
          </div>
        </div>

        <div
          onClick={() => openDrilldown('Overdue Follow-ups', 'overdue_followups')}
          style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: `1px solid ${themeTokens.colors.border}`, cursor: 'pointer' }}
        >
          <div style={{ fontSize: '10px', fontWeight: 800, color: themeTokens.colors.textSecondary, letterSpacing: '0.04em' }}>
            OVERDUE FOLLOW-UPS
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: (kpis?.overdue_followups || 0) > 0 ? '#DC2626' : '#059669', marginTop: '4px' }}>
            {kpis?.overdue_followups || 0}
          </div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
            SLA Breached
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: `1px solid ${themeTokens.colors.border}` }}>
          <div style={{ fontSize: '10px', fontWeight: 800, color: themeTokens.colors.textSecondary, letterSpacing: '0.04em' }}>
            ABORT RATE
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#7C3AED', marginTop: '4px' }}>
            {kpis?.total_enquiries ? Math.round(((kpis.aborted_deals || 0) / kpis.total_enquiries) * 100) : 0}%
          </div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
            {kpis?.aborted_deals || 0} Aborted Leads
          </div>
        </div>
      </div>

      {/* Inventory Status Composition */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', border: `1px solid ${themeTokens.colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Building size={18} color="#4F5278" />
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#1F2937' }}>Inventory Status Composition</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <div style={{ padding: '12px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803D' }}>AVAILABLE</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#166534', marginTop: '2px' }}>
              {kpis?.available_properties || 0}
            </div>
            <div style={{ fontSize: '10px', color: '#15803D', marginTop: '2px' }}>Ready for showings</div>
          </div>

          <div style={{ padding: '12px', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#1E40AF' }}>RENTED</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#1E3A8A', marginTop: '2px' }}>
              {kpis?.rented_properties || 0}
            </div>
            <div style={{ fontSize: '10px', color: '#1E40AF', marginTop: '2px' }}>Active leases</div>
          </div>

          <div style={{ padding: '12px', backgroundColor: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857' }}>SOLD</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#064E3B', marginTop: '2px' }}>
              {kpis?.sold_properties || 0}
            </div>
            <div style={{ fontSize: '10px', color: '#047857', marginTop: '2px' }}>Title transferred</div>
          </div>

          <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>ARCHIVED</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>
              {kpis?.archived_properties || 0}
            </div>
            <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>Off-market vault</div>
          </div>
        </div>
      </div>

      {/* Executive Performance Table */}
      <Card
        title="Executive Performance & Conversion Leaderboard (PRD Section 5.18)"
        subtitle="Individual staff throughput: leads handled, field visits completed, overdue reminders, and closed transactions"
      >
        <Table
          columns={columns}
          data={executives}
          keyExtractor={(e) => e.id}
        />
      </Card>

      {/* Drilldown Modal */}
      {drilldownModal && (
        <Modal
          isOpen={!!drilldownModal}
          onClose={() => setDrilldownModal(null)}
          title={`Underlying Records: ${drilldownModal.title}`}
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loadingDrilldown ? (
              <div style={{ padding: '32px', textAlign: 'center', color: themeTokens.colors.textSecondary }}>
                Querying database records...
              </div>
            ) : drilldownItems.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: themeTokens.colors.textSecondary }}>
                No records found for this metric.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {drilldownItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${themeTokens.colors.border}`,
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: themeTokens.colors.textPrimary }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
                        {item.subtitle}
                      </div>
                    </div>
                    <Badge label={item.badge} variant="neutral" />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: `1px solid ${themeTokens.colors.border}` }}>
              <Button label="Close" variant="outline" size="sm" onClick={() => setDrilldownModal(null)} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
