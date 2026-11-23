import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { themeTokens } from '../theme/tokens';
import {
  Building,
  UserCheck,
  Calendar,
  Award,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { api, ReportKPIs, ExecutivePerformanceItem, DrilldownItem } from '../services/api';

export const OverviewView: React.FC<{ onNavigate?: (nav: any) => void }> = ({ onNavigate }) => {
  const [kpis, setKpis] = useState<ReportKPIs | null>(null);
  const [executives, setExecutives] = useState<ExecutivePerformanceItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Drilldown state
  const [drilldownModal, setDrilldownModal] = useState<{ title: string; metric: string } | null>(null);
  const [drilldownItems, setDrilldownItems] = useState<DrilldownItem[]>([]);
  const [loadingDrilldown, setLoadingDrilldown] = useState(false);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [kpiRes, execRes] = await Promise.all([
        api.getReportKPIs(),
        api.getExecutivePerformance(),
      ]);
      setKpis(kpiRes);
      setExecutives(execRes.items || []);
    } catch (err) {
      console.error('Failed to load overview analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

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
      header: 'Executive Name',
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600, color: themeTokens.colors.textPrimary }}>{row.name}</span>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>{row.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge
          label={row.role.toUpperCase()}
          variant={row.role === 'Admin' ? 'info' : 'primary'}
        />
      ),
    },
    {
      key: 'assigned_enquiries',
      header: 'Assigned Leads',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.assigned_enquiries}</span>,
    },
    {
      key: 'completed_visits',
      header: 'Completed Visits',
      render: (row) => <span style={{ fontWeight: 600, color: '#2563EB' }}>{row.completed_visits}</span>,
    },
    {
      key: 'overdue_followups',
      header: 'Overdue Follow-ups',
      render: (row) => (
        <span
          style={{
            color: row.overdue_followups > 0 ? themeTokens.colors.danger : themeTokens.colors.success,
            fontWeight: 700,
          }}
        >
          {row.overdue_followups}
        </span>
      ),
    },
    {
      key: 'closed_deals',
      header: 'Closed Deals',
      render: (row) => (
        <span style={{ fontWeight: 800, color: '#047857' }}>{row.closed_deals}</span>
      ),
    },
    {
      key: 'total_deal_volume',
      header: 'Closed Volume',
      render: (row) => (
        <span style={{ fontWeight: 600, color: themeTokens.colors.textPrimary }}>
          ₹{row.total_deal_volume ? row.total_deal_volume.toLocaleString('en-IN') : '0'}
        </span>
      ),
    },
    {
      key: 'conversion_rate',
      header: 'Conversion Rate',
      render: (row) => (
        <Badge
          label={`${row.conversion_rate}%`}
          variant={row.conversion_rate >= 20 ? 'success' : row.conversion_rate >= 10 ? 'primary' : 'neutral'}
        />
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={22} color={themeTokens.colors.primaryDark} />
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: themeTokens.colors.textPrimary, margin: 0 }}>
              Company Overview & Operations Center
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: themeTokens.colors.textSecondary, marginTop: '4px', margin: 0 }}>
            Live authoritative metrics across MongoDB Atlas collections. Click any tile to review underlying records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            label="Refresh Metrics"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            variant="outline"
            onClick={fetchOverviewData}
          />
        </div>
      </div>

      {/* Primary KPI Grid (4 main tiles) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Card 1: Properties */}
        <div
          onClick={() => openDrilldown('Available Properties', 'available_properties')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${themeTokens.colors.border}`,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: themeTokens.colors.textSecondary }}>PROPERTY INVENTORY</span>
            <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <Building size={16} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: themeTokens.colors.textPrimary, lineHeight: 1 }}>
            {kpis?.total_properties || 0}
          </div>
          <div style={{ fontSize: '12px', color: themeTokens.colors.textSecondary, marginTop: '6px', marginBottom: '14px' }}>
            Total Managed Units
          </div>
          <div style={{ borderTop: `1px solid #F1F5F9`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Badge label={`Available: ${kpis?.available_properties || 0}`} variant="success" />
            <span
              onClick={(e) => {
                if (onNavigate) {
                  e.stopPropagation();
                  onNavigate('inventory');
                }
              }}
              style={{
                fontSize: '11px',
                color: onNavigate ? '#2563EB' : themeTokens.colors.textSecondary,
                fontWeight: onNavigate ? 600 : 400,
                cursor: onNavigate ? 'pointer' : 'default',
              }}
            >
              Rented: {kpis?.rented_properties || 0} • Sold: {kpis?.sold_properties || 0} {onNavigate && '→'}
            </span>
          </div>
        </div>

        {/* Card 2: Enquiries */}
        <div
          onClick={() => openDrilldown('New Enquiries This Week', 'new_enquiries_this_week')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${themeTokens.colors.border}`,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: themeTokens.colors.textSecondary }}>CUSTOMER ENQUIRIES</span>
            <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#F0FDF4', color: '#16A34A' }}>
              <UserCheck size={16} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: themeTokens.colors.textPrimary, lineHeight: 1 }}>
            {kpis?.total_enquiries || 0}
          </div>
          <div style={{ fontSize: '12px', color: themeTokens.colors.textSecondary, marginTop: '6px', marginBottom: '14px' }}>
            Total Pipeline Leads
          </div>
          <div style={{ borderTop: `1px solid #F1F5F9`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Badge label={`Active: ${kpis?.active_enquiries || 0}`} variant="primary" />
            <span
              onClick={(e) => {
                if (onNavigate) {
                  e.stopPropagation();
                  onNavigate('customers');
                }
              }}
              style={{
                fontSize: '11px',
                color: onNavigate ? '#16A34A' : themeTokens.colors.textSecondary,
                fontWeight: onNavigate ? 600 : 400,
                cursor: onNavigate ? 'pointer' : 'default',
              }}
            >
              +{kpis?.new_enquiries_this_week || 0} this week {onNavigate && '→'}
            </span>
          </div>
        </div>

        {/* Card 3: Visits */}
        <div
          onClick={() => openDrilldown("Today's Scheduled Visits", 'today_scheduled_visits')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${themeTokens.colors.border}`,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: themeTokens.colors.textSecondary }}>TODAY'S VISITS</span>
            <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#FEF3C7', color: '#D97706' }}>
              <Calendar size={16} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: themeTokens.colors.textPrimary, lineHeight: 1 }}>
            {kpis?.today_scheduled_visits || 0}
          </div>
          <div style={{ fontSize: '12px', color: themeTokens.colors.textSecondary, marginTop: '6px', marginBottom: '14px' }}>
            Scheduled Today
          </div>
          <div style={{ borderTop: `1px solid #F1F5F9`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Badge label={`Completed: ${kpis?.completed_visits || 0}`} variant="info" />
            <span
              onClick={(e) => {
                if (onNavigate) {
                  e.stopPropagation();
                  onNavigate('visits');
                }
              }}
              style={{
                fontSize: '11px',
                color: onNavigate ? '#D97706' : themeTokens.colors.textSecondary,
                fontWeight: onNavigate ? 600 : 400,
                cursor: onNavigate ? 'pointer' : 'default',
              }}
            >
              Open Claims: {kpis?.open_unclaimed_visits || 0} {onNavigate && '→'}
            </span>
          </div>
        </div>

        {/* Card 4: Deals Closed */}
        <div
          onClick={() => openDrilldown('Closed Deals', 'closed_deals')}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${themeTokens.colors.border}`,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: themeTokens.colors.textSecondary }}>CLOSED DEALS</span>
            <div style={{ padding: '6px', borderRadius: '6px', backgroundColor: '#ECFDF5', color: '#059669' }}>
              <Award size={16} />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#047857', lineHeight: 1 }}>
            {kpis?.closed_deals || 0}
          </div>
          <div style={{ fontSize: '12px', color: themeTokens.colors.textSecondary, marginTop: '6px', marginBottom: '14px' }}>
            Contracts Converted
          </div>
          <div style={{ borderTop: `1px solid #F1F5F9`, paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669' }}>
              ₹{kpis?.total_deal_volume ? kpis.total_deal_volume.toLocaleString('en-IN') : '0'} Vol
            </span>
            <span
              onClick={(e) => {
                if (onNavigate) {
                  e.stopPropagation();
                  onNavigate('archives');
                }
              }}
              style={{
                fontSize: '11px',
                color: onNavigate ? '#059669' : '#DC2626',
                fontWeight: onNavigate ? 600 : 400,
                cursor: onNavigate ? 'pointer' : 'default',
              }}
            >
              Aborted: {kpis?.aborted_deals || 0} {onNavigate && '→'}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Operational Cadence Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}
      >
        <div
          onClick={() => openDrilldown('Overdue Follow-ups', 'overdue_followups')}
          style={{
            backgroundColor: '#FFFFFF',
            padding: '16px 20px',
            borderRadius: '10px',
            border: `1px solid ${themeTokens.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#FEF2F2', color: '#DC2626' }}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>Follow-ups Requiring Action</div>
              <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>Overdue customer callbacks</div>
            </div>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: (kpis?.overdue_followups || 0) > 0 ? '#DC2626' : '#059669' }}>
            {kpis?.overdue_followups || 0}
          </span>
        </div>

        <div
          onClick={() => {
            if (onNavigate) onNavigate('followups');
            else openDrilldown('Follow-ups', 'upcoming_followups');
          }}
          style={{
            backgroundColor: '#FFFFFF',
            padding: '16px 20px',
            borderRadius: '10px',
            border: `1px solid ${themeTokens.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB' }}>
              <Calendar size={18} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>Upcoming Scheduled Reminders</div>
              <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>Future scheduled pipeline calls</div>
            </div>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#1E40AF' }}>
            {kpis?.upcoming_followups || 0}
          </span>
        </div>

        <div
          onClick={() => {
            if (onNavigate) onNavigate('archives');
          }}
          style={{
            backgroundColor: '#FFFFFF',
            padding: '16px 20px',
            borderRadius: '10px',
            border: `1px solid ${themeTokens.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#F3F4F6', color: '#4B5563' }}>
              <Layers size={18} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1F2937' }}>Archived Asset Vault</div>
              <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>Rented, sold, and off-market units</div>
            </div>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#374151' }}>
            {(kpis?.rented_properties || 0) + (kpis?.sold_properties || 0) + (kpis?.archived_properties || 0)}
          </span>
        </div>
      </div>

      {/* Executive Performance Table */}
      <Card
        title="Executive Performance & Conversion Leaderboard"
        subtitle="Live multi-dimensional ranking computed from field visits, follow-up SLAs, and closed deal volume"
      >
        <Table
          columns={columns}
          data={executives}
          keyExtractor={(row) => row.id}
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
                Querying MongoDB Atlas database...
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: `1px solid ${themeTokens.colors.border}` }}>
              {onNavigate && (
                <Button
                  label={`Go to ${
                    drilldownModal.metric.includes('properties')
                      ? 'Property Inventory'
                      : drilldownModal.metric.includes('enquiries')
                      ? 'Customers & Enquiries'
                      : 'Visits Schedule'
                  }`}
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const targetNav = drilldownModal.metric.includes('properties')
                      ? 'inventory'
                      : drilldownModal.metric.includes('enquiries')
                      ? 'customers'
                      : 'visits';
                    setDrilldownModal(null);
                    onNavigate(targetNav);
                  }}
                />
              )}
              <Button label="Close" variant="outline" size="sm" onClick={() => setDrilldownModal(null)} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
