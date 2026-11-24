import React, { useState, useEffect } from 'react';
import { formatDateTime } from '../utils/dateUtils';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { themeTokens } from '../theme/tokens';
import {
  Plus,
  Search,
  Archive,
  Eye,
  Trash2,
  AlertCircle,
  RefreshCw,
  Download,
  Upload,
  Phone,
  MessageSquare,
  Copy,
  Check,
  Share2,
  Key,
  MapPin,
  Building,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { api, Property, Society, MasterDataOption, AdditionalCharge, validateMobileNumber } from '../services/api';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { Customer360Modal } from '../components/Customer360Modal';

export interface InventoryViewProps {
  initialPropertyId?: string | null;
  onClearInitialPropertyId?: () => void;
  onOpenCustomer360?: (customerId: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  initialPropertyId,
  onClearInitialPropertyId,
  onOpenCustomer360: _onOpenCustomer360,
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTransaction, setFilterTransaction] = useState<'all' | 'rent' | 'sale'>('all');
  const [filterSociety, setFilterSociety] = useState<string>('all');
  const [filterPropertyType, setFilterPropertyType] = useState<string>('all');
  const [includeArchived, setIncludeArchived] = useState(false);

  // Customer 360 State
  const [customer360Id, setCustomer360Id] = useState<string | null>(null);

  // Master Data state for forms & filters
  const [societies, setSocieties] = useState<Society[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<MasterDataOption[]>([]);
  const [locations, setLocations] = useState<MasterDataOption[]>([]);
  const [tenantTypes, setTenantTypes] = useState<MasterDataOption[]>([]);

  // Add Property Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [transactionType, setTransactionType] = useState<'rent' | 'sale'>('rent');
  const [propertyType, setPropertyType] = useState('');
  const [societyId, setSocietyId] = useState('');
  const [location, setLocation] = useState('');
  const [expectedAmount, setExpectedAmount] = useState<number | ''>('');
  const [negotiable, setNegotiable] = useState(false);
  const [securityDeposit, setSecurityDeposit] = useState<number | ''>('');
  const [maintenanceMode, setMaintenanceMode] = useState<'included' | 'extra'>('included');
  const [maintenanceAmount, setMaintenanceAmount] = useState<number | ''>('');
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [tenantType, setTenantType] = useState('');
  const [notes, setNotes] = useState('');

  // Property Details Modal State
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    if (initialPropertyId) {
      const found = properties.find((p) => p.property_id === initialPropertyId);
      if (found) {
        setSelectedProperty(found);
      } else {
        api.getProperty(initialPropertyId).then((p) => {
          if (p) setSelectedProperty(p);
        }).catch(() => {});
      }
      if (onClearInitialPropertyId) onClearInitialPropertyId();
    }
  }, [initialPropertyId, properties]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Excel Import / Export State (Phase 13 / PRD 5.19)
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      await api.downloadExcelExport('properties');
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProperties({
        search: search.trim() || undefined,
        transaction_type: filterTransaction !== 'all' ? filterTransaction : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        society_id: filterSociety !== 'all' ? filterSociety : undefined,
        property_type: filterPropertyType !== 'all' ? filterPropertyType : undefined,
        include_archived: includeArchived,
      });
      setProperties(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory from server');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [socRes, mstrRes] = await Promise.all([
        api.getSocieties(true),
        api.getMasterData(undefined, true),
      ]);
      setSocieties(socRes);
      if (socRes.length > 0 && !societyId) {
        setSocietyId(socRes[0].society_id || socRes[0].id);
      }

      const pts = mstrRes.filter((m) => m.category === 'property_type');
      setPropertyTypes(pts);
      if (pts.length > 0 && !propertyType) setPropertyType(pts[0].value);

      const locs = mstrRes.filter((m) => m.category === 'location');
      setLocations(locs);
      if (locs.length > 0 && !location) setLocation(locs[0].value);

      const tts = mstrRes.filter((m) => m.category === 'tenant_type');
      setTenantTypes(tts);
      if (tts.length > 0 && !tenantType) setTenantType(tts[0].value);
    } catch {
      // master data error fallback
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Live filter auto-fetch on changes or search typing
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, filterStatus, filterTransaction, filterSociety, filterPropertyType, includeArchived]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleAddChargeRow = () => {
    setAdditionalCharges([...additionalCharges, { name: '', amount: 0, frequency: 'monthly' }]);
  };

  const handleRemoveChargeRow = (index: number) => {
    setAdditionalCharges(additionalCharges.filter((_, i) => i !== index));
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expectedAmount || Number(expectedAmount) <= 0) {
      setFormError('Please provide a valid expected price/rent amount.');
      return;
    }
    const cleanOwnerName = ownerName.trim();
    const cleanOwnerPhone = ownerPhone.trim();

    if (!cleanOwnerName || cleanOwnerName.length < 2) {
      setFormError('Property Owner Name is compulsory (min 2 characters).');
      return;
    }

    const ownerPhoneVal = validateMobileNumber(cleanOwnerPhone, 'Property Owner Mobile Number');
    if (!ownerPhoneVal.valid) {
      setFormError(ownerPhoneVal.error || 'Please enter a valid owner mobile number.');
      return;
    }

    if (agentPhone.trim()) {
      const agentPhoneVal = validateMobileNumber(agentPhone.trim(), 'Agent Mobile Number');
      if (!agentPhoneVal.valid) {
        setFormError(agentPhoneVal.error || 'Please enter a valid agent mobile number.');
        return;
      }
    }

    setCreating(true);
    setFormError(null);
    try {
      const payload = {
        transaction_type: transactionType,
        property_type: propertyType,
        society_id: societyId,
        location: location,
        expected_amount: Number(expectedAmount),
        negotiable,
        security_deposit: securityDeposit ? Number(securityDeposit) : undefined,
        maintenance_mode: maintenanceMode,
        maintenance_amount: maintenanceMode === 'extra' && maintenanceAmount ? Number(maintenanceAmount) : undefined,
        additional_charges: additionalCharges.filter((c) => c.name.trim() && c.amount > 0),
        owner_name: cleanOwnerName,
        owner_phone: cleanOwnerPhone,
        agent_name: agentName.trim() || undefined,
        agent_phone: agentPhone.trim() || undefined,
        tenant_type: tenantType || undefined,
        notes: notes.trim() || undefined,
      };

      await api.createProperty(payload);
      setAddModalOpen(false);
      resetForm();
      fetchInventory();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create property on server');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setExpectedAmount('');
    setSecurityDeposit('');
    setMaintenanceAmount('');
    setAdditionalCharges([]);
    setOwnerName('');
    setOwnerPhone('');
    setAgentName('');
    setAgentPhone('');
    setNotes('');
  };

  const copyPropertyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    try {
      setUpdatingStatus(true);
      setStatusMessage(null);
      const updated = await api.updateProperty(propertyId, { status: newStatus as any });
      setSelectedProperty(updated);
      setStatusMessage(`Property status updated to "${newStatus.replace('_', ' ').toUpperCase()}"`);
      fetchInventory();
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to update property status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUnarchive = async (propertyId: string) => {
    try {
      await api.unarchiveProperty(propertyId);
      fetchInventory();
      if (selectedProperty && selectedProperty.property_id === propertyId) {
        setSelectedProperty({ ...selectedProperty, status: 'available' });
        setStatusMessage('Property restored to "AVAILABLE" status');
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } catch (err: any) {
      alert(`Unarchive failed: ${err.message}`);
    }
  };

  const handleShareWhatsApp = (p: Property) => {
    const formattedPrice = `₹${(p.expected_amount ?? 0).toLocaleString('en-IN')}${p.transaction_type === 'rent' ? '/month' : ''}`;
    const text = `🏡 *Property Listing: ${p.property_id}*\n` +
      `• *Type:* ${p.property_type} (${p.transaction_type.toUpperCase()})\n` +
      `• *Society:* ${p.society_name}\n` +
      `• *Location:* ${p.location}\n` +
      `• *Price/Rent:* ${formattedPrice} (${p.negotiable ? 'Negotiable' : 'Fixed'})\n` +
      `• *Maintenance:* ${p.maintenance_mode === 'included' ? 'Included' : `₹${p.maintenance_amount || 0}/mo extra`}\n` +
      (p.security_deposit ? `• *Deposit:* ₹${p.security_deposit.toLocaleString('en-IN')}\n` : '') +
      (p.tenant_type ? `• *Tenant Preference:* ${p.tenant_type}\n` : '') +
      `\nContact EstateFlow for immediate showing or keys custody verification.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleArchive = async (propertyId: string) => {
    if (!confirm(`Are you sure you want to archive property ${propertyId}? It will remain searchable in archives.`)) return;
    try {
      await api.archiveProperty(propertyId);
      fetchInventory();
      if (selectedProperty && selectedProperty.property_id === propertyId) {
        setSelectedProperty({ ...selectedProperty, status: 'archived' });
        setStatusMessage('Property moved to "ARCHIVED"');
        setTimeout(() => setStatusMessage(null), 3500);
      }
    } catch (err: any) {
      alert(`Archive failed: ${err.message}`);
    }
  };

  const handleDelete = async (propertyId: string) => {
    if (!confirm(`[Super Admin] Permanently delete property ${propertyId}? This cannot be undone.`)) return;
    try {
      await api.deleteProperty(propertyId);
      fetchInventory();
      if (selectedProperty?.property_id === propertyId) setSelectedProperty(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const columns: Column<Property>[] = [
    {
      key: 'property_id',
      header: 'Property ID',
      render: (p) => (
        <span
          onClick={() => setSelectedProperty(p)}
          style={{
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: themeTokens.colors.primaryDark,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
          title="Click to view full property dossier and change status"
        >
          {p.property_id}
        </span>
      ),
    },
    {
      key: 'property_type',
      header: 'Type / BHK',
      render: (p) => (
        <div>
          <span style={{ fontWeight: 600 }}>{p.property_type}</span>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, textTransform: 'capitalize' }}>
            {p.transaction_type}
          </div>
        </div>
      ),
    },
    {
      key: 'society',
      header: 'Society & Location',
      render: (p) => (
        <div>
          <div style={{ fontWeight: 600 }}>{p.society_name}</div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>{p.location}</div>
        </div>
      ),
    },
    {
      key: 'expected_amount',
      header: 'Expected Price',
      render: (p) => (
        <div>
          <span style={{ fontWeight: 700 }}>₹{(p.expected_amount ?? 0).toLocaleString('en-IN')}</span>
          <span style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>
            {p.transaction_type === 'rent' ? ' / mo' : ''}
          </span>
          {p.negotiable && (
            <span style={{ display: 'block', fontSize: '10px', color: '#16A34A', fontWeight: 600 }}>
              Negotiable
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'maintenance_mode',
      header: 'Maintenance',
      render: (p) => (
        <span style={{ fontSize: '12px', textTransform: 'capitalize' }}>
          {p.maintenance_mode}
          {p.maintenance_mode === 'extra' && p.maintenance_amount ? ` (₹${p.maintenance_amount})` : ''}
        </span>
      ),
    },
    {
      key: 'owner_name',
      header: 'Owner Details',
      render: (p) => (
        <div>
          <div style={{ fontWeight: 600 }}>{p.owner_name}</div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>{p.owner_phone}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => {
        let variant: 'success' | 'primary' | 'warning' | 'neutral' = 'success';
        if (p.status === 'rented' || p.status === 'sold') variant = 'primary';
        else if (p.status === 'under_negotiation' || p.status === 'reserved') variant = 'warning';
        else if (p.status === 'archived') variant = 'neutral';
        return <Badge label={p.status.replace('_', ' ')} variant={variant} />;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button
            label="View Dossier"
            icon={<Eye size={13} />}
            variant="outline"
            size="sm"
            onClick={() => setSelectedProperty(p)}
          />
          {p.status !== 'archived' && (
            <Button
              label=""
              icon={<Archive size={13} />}
              variant="outline"
              size="sm"
              onClick={() => handleArchive(p.property_id)}
            />
          )}
          <Button
            label=""
            icon={<Trash2 size={13} />}
            variant="danger"
            size="sm"
            onClick={() => handleDelete(p.property_id)}
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
            Property Inventory Directory
          </h1>
          <p style={{ fontSize: '13px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
            All company properties with server-generated 5-letter + 3-digit Property IDs, society references, and pricing.
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
            label={exporting ? 'Exporting...' : 'Export Excel'}
            variant="outline"
            icon={<Download size={14} />}
            onClick={handleExport}
            disabled={exporting}
          />
          <Button
            label="Refresh"
            variant="outline"
            icon={<RefreshCw size={14} />}
            onClick={() => fetchInventory()}
          />
          <Button
            label="Add Property"
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => setAddModalOpen(true)}
          />
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: '13px' }}>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
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
              placeholder="Search by Property ID, society, location, owner name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '13px',
                width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Rent/Sale filter */}
            <select
              value={filterTransaction}
              onChange={(e) => setFilterTransaction(e.target.value as any)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${themeTokens.colors.border}`,
                fontSize: '12px',
                backgroundColor: themeTokens.colors.surface,
              }}
            >
              <option value="all">All Deals (Rent + Sale)</option>
              <option value="rent">Rent Only</option>
              <option value="sale">Sale Only</option>
            </select>

            {/* Society Filter */}
            <select
              value={filterSociety}
              onChange={(e) => setFilterSociety(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${themeTokens.colors.border}`,
                fontSize: '12px',
                backgroundColor: themeTokens.colors.surface,
              }}
            >
              <option value="all">All Societies</option>
              {societies.map((s) => (
                <option key={s.id || s.society_id} value={s.society_id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Configuration / Type Filter */}
            <select
              value={filterPropertyType}
              onChange={(e) => setFilterPropertyType(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${themeTokens.colors.border}`,
                fontSize: '12px',
                backgroundColor: themeTokens.colors.surface,
              }}
            >
              <option value="all">All Configurations</option>
              {propertyTypes.map((pt) => (
                <option key={pt.id} value={pt.value}>
                  {pt.value}
                </option>
              ))}
            </select>

            {/* Status pills */}
            {['all', 'available', 'rented', 'sold', 'under_negotiation'].map((st) => (
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

            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginLeft: '6px' }}>
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
              />
              Show Archived
            </label>
          </div>
        </form>
      </Card>

      <Card title={`Properties Found (${total})`} subtitle="Server-side searchable inventory">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: themeTokens.colors.textSecondary }}>
            Loading properties from database...
          </div>
        ) : (
          <Table columns={columns} data={properties} keyExtractor={(p) => p.property_id} />
        )}
      </Card>

      {/* Add Property Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Property Inventory"
      >
        <form onSubmit={handleCreateProperty} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '6px' }}>
          {formError && (
            <div style={{ padding: '8px 12px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '12px' }}>
              {formError}
            </div>
          )}

          <div style={{ borderBottom: `1px solid ${themeTokens.colors.border}`, paddingBottom: '10px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: themeTokens.colors.primaryDark, marginBottom: '8px' }}>
              1. Identification & Classification
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Transaction Type *</label>
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
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Property Type (BHK) *</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
                >
                  {propertyTypes.map((pt) => (
                    <option key={pt.id} value={pt.value}>{pt.value}</option>
                  ))}
                  {propertyTypes.length === 0 && <option value="2 BHK">2 BHK</option>}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Society *</label>
                <select
                  value={societyId}
                  onChange={(e) => setSocietyId(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
                >
                  {societies.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                  {societies.length === 0 && <option value="SOC0001">Ajnara Homes</option>}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Area / Location *</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.value}>{loc.value}</option>
                  ))}
                  {locations.length === 0 && <option value="Sector 4 Greater Noida">Sector 4 Greater Noida</option>}
                </select>
              </div>
            </div>
          </div>

          <div style={{ borderBottom: `1px solid ${themeTokens.colors.border}`, paddingBottom: '10px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: themeTokens.colors.primaryDark, marginBottom: '8px' }}>
              2. Pricing & Maintenance
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Expected {transactionType === 'rent' ? 'Rent (Monthly)' : 'Sale Price'} (₹) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 22000"
                  value={expectedAmount}
                  onChange={(e) => setExpectedAmount(e.target.value ? Number(e.target.value) : '')}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Security Deposit (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 44000"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value ? Number(e.target.value) : '')}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Maintenance *</label>
                <select
                  value={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.value as any)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
                >
                  <option value="included">Included in Rent</option>
                  <option value="extra">Extra / Additional</option>
                </select>
              </div>

              {maintenanceMode === 'extra' && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Maintenance Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2500"
                    value={maintenanceAmount}
                    onChange={(e) => setMaintenanceAmount(e.target.value ? Number(e.target.value) : '')}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
                  />
                </div>
              )}
            </div>

            <div style={{ marginTop: '10px' }}>
              <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={negotiable}
                  onChange={(e) => setNegotiable(e.target.checked)}
                />
                Price is Negotiable
              </label>
            </div>

            {/* Additional Charges Rows */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Additional Charges (Optional)</span>
                <Button label="+ Add Charge" variant="outline" size="sm" type="button" onClick={handleAddChargeRow} />
              </div>
              {additionalCharges.map((chg, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Charge Name (e.g. Club)"
                    value={chg.name}
                    onChange={(e) => {
                      const updated = [...additionalCharges];
                      updated[idx].name = e.target.value;
                      setAdditionalCharges(updated);
                    }}
                    style={{ flex: 2, padding: '6px', fontSize: '12px', border: `1px solid ${themeTokens.colors.border}`, borderRadius: '4px' }}
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={chg.amount || ''}
                    onChange={(e) => {
                      const updated = [...additionalCharges];
                      updated[idx].amount = Number(e.target.value);
                      setAdditionalCharges(updated);
                    }}
                    style={{ flex: 1, padding: '6px', fontSize: '12px', border: `1px solid ${themeTokens.colors.border}`, borderRadius: '4px' }}
                  />
                  <select
                    value={chg.frequency}
                    onChange={(e) => {
                      const updated = [...additionalCharges];
                      updated[idx].frequency = e.target.value as any;
                      setAdditionalCharges(updated);
                    }}
                    style={{ flex: 1, padding: '6px', fontSize: '12px', border: `1px solid ${themeTokens.colors.border}`, borderRadius: '4px' }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="one_time">One-time</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveChargeRow(idx)}
                    style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '14px' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderBottom: `1px solid ${themeTokens.colors.border}`, paddingBottom: '10px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: themeTokens.colors.primaryDark, marginBottom: '8px' }}>
              3. Owner & Contact Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Owner Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Sharma"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Owner Phone *</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Agent Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sunil Broker"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Agent Phone (Optional)</label>
                <input
                  type="tel"
                  placeholder="Optional broker / agent phone"
                  value={agentPhone}
                  onChange={(e) => setAgentPhone(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Tenant Preference</label>
                <select
                  value={tenantType}
                  onChange={(e) => setTenantType(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
                >
                  <option value="">Any</option>
                  {tenantTypes.map((tt) => (
                    <option key={tt.id} value={tt.value}>{tt.value}</option>
                  ))}
                  {tenantTypes.length === 0 && (
                    <>
                      <option value="Family">Family</option>
                      <option value="Family + Bachelor">Family + Bachelor</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Park facing, immediate possession"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}`, fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <Button label="Cancel" variant="outline" size="sm" type="button" onClick={() => setAddModalOpen(false)} />
            <Button label={creating ? 'Generating ID & Saving...' : 'Save Property'} variant="primary" size="sm" disabled={creating} />
          </div>
        </form>
      </Modal>

      {/* Property Details Dossier Modal */}
      {selectedProperty && (
        <Modal
          isOpen={true}
          onClose={() => {
            setSelectedProperty(null);
            setStatusMessage(null);
          }}
          title=""
          maxWidth="720px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '82vh', overflowY: 'auto', paddingRight: '4px' }}>
            {/* Header & Status Control Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              paddingBottom: '14px',
              borderBottom: `1px solid ${themeTokens.colors.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '18px',
                    fontWeight: 800,
                    color: themeTokens.colors.primaryDark,
                    letterSpacing: '0.05em',
                    backgroundColor: themeTokens.colors.softSurface,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${themeTokens.colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {selectedProperty.property_id}
                  <button
                    type="button"
                    onClick={() => copyPropertyId(selectedProperty.property_id)}
                    title="Copy Property ID"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: themeTokens.colors.textSecondary }}
                  >
                    {copiedId ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                  </button>
                </span>

                <Badge
                  label={selectedProperty.transaction_type.toUpperCase()}
                  variant={selectedProperty.transaction_type === 'rent' ? 'primary' : 'warning'}
                />
              </div>

              {/* Status Selector Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: themeTokens.colors.textSecondary }}>
                  Status:
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedProperty.status}
                    disabled={updatingStatus}
                    onChange={(e) => handleStatusChange(selectedProperty.property_id, e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '12px',
                      border: `1.5px solid ${themeTokens.colors.border}`,
                      backgroundColor:
                        selectedProperty.status === 'available' ? '#DCFCE7' :
                        selectedProperty.status === 'rented' ? '#DBEAFE' :
                        selectedProperty.status === 'sold' ? '#E0E7FF' :
                        selectedProperty.status === 'under_negotiation' ? '#FEF3C7' :
                        selectedProperty.status === 'reserved' ? '#F3E8FF' : '#F3F4F6',
                      color:
                        selectedProperty.status === 'available' ? '#166534' :
                        selectedProperty.status === 'rented' ? '#1E40AF' :
                        selectedProperty.status === 'sold' ? '#3730A3' :
                        selectedProperty.status === 'under_negotiation' ? '#92400E' :
                        selectedProperty.status === 'reserved' ? '#6B21A8' : '#374151',
                      cursor: updatingStatus ? 'wait' : 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="available">🟢 Available (Live in Inventory)</option>
                    <option value="under_negotiation">🟠 Under Negotiation</option>
                    <option value="reserved">🟣 Reserved (Token Paid)</option>
                    <option value="rented">🔵 Rented Out</option>
                    <option value="sold">🔴 Closed / Sold</option>
                    <option value="archived">⚪ Archived (Withdrawn)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Status Update Feedback Banner */}
            {statusMessage && (
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#DCFCE7',
                border: '1px solid #86EFAC',
                color: '#166534',
                borderRadius: '6px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
              }}>
                <CheckCircle2 size={16} color="#16A34A" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Hero Highlights & Key Financials */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: themeTokens.colors.softSurface,
              padding: '16px',
              borderRadius: '10px',
              border: `1px solid ${themeTokens.colors.border}`,
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: themeTokens.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {selectedProperty.transaction_type === 'rent' ? 'Monthly Asking Rent' : 'Expected Sale Price'}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '26px', fontWeight: 800, color: themeTokens.colors.primaryDark }}>
                    ₹{(selectedProperty.expected_amount ?? 0).toLocaleString('en-IN')}
                  </span>
                  <span style={{ fontSize: '13px', color: themeTokens.colors.textSecondary, fontWeight: 500 }}>
                    {selectedProperty.transaction_type === 'rent' ? '/ month' : ''}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: selectedProperty.negotiable ? '#FEF3C7' : '#F3F4F6',
                    color: selectedProperty.negotiable ? '#92400E' : '#4B5563',
                    marginLeft: '6px',
                  }}>
                    {selectedProperty.negotiable ? 'Negotiable' : 'Fixed Price'}
                  </span>
                </div>
              </div>

              {/* Action Buttons in Header */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button
                  label="Share via WhatsApp"
                  icon={<Share2 size={14} />}
                  variant="outline"
                  size="sm"
                  onClick={() => handleShareWhatsApp(selectedProperty)}
                />
              </div>
            </div>

            {/* 2-Column Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {/* Financial Terms Card */}
              <div style={{
                padding: '14px',
                border: `1px solid ${themeTokens.colors.border}`,
                borderRadius: '8px',
                backgroundColor: themeTokens.colors.surface,
              }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: themeTokens.colors.primaryDark, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={15} color={themeTokens.colors.primary} />
                  Financial Terms & Outgo
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: `1px dashed ${themeTokens.colors.border}` }}>
                    <span style={{ color: themeTokens.colors.textSecondary }}>Security Deposit:</span>
                    <span style={{ fontWeight: 600 }}>
                      {selectedProperty.security_deposit
                        ? `₹${(selectedProperty.security_deposit ?? 0).toLocaleString('en-IN')}`
                        : 'Not specified'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: `1px dashed ${themeTokens.colors.border}` }}>
                    <span style={{ color: themeTokens.colors.textSecondary }}>Society Maintenance:</span>
                    <span style={{ fontWeight: 600 }}>
                      {selectedProperty.maintenance_mode === 'included'
                        ? 'Included in Rent'
                        : `₹${(selectedProperty.maintenance_amount || 0).toLocaleString('en-IN')}/mo Extra`}
                    </span>
                  </div>

                  {selectedProperty.additional_charges && selectedProperty.additional_charges.length > 0 ? (
                    <div>
                      <div style={{ color: themeTokens.colors.textSecondary, marginBottom: '4px', fontSize: '11px', fontWeight: 600 }}>
                        Additional Charges Breakdown:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {selectedProperty.additional_charges.map((chg, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', backgroundColor: themeTokens.colors.softSurface, padding: '4px 8px', borderRadius: '4px' }}>
                            <span>{chg.name} ({chg.frequency})</span>
                            <span style={{ fontWeight: 700 }}>₹{(chg.amount ?? 0).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: themeTokens.colors.textSecondary }}>Additional Charges:</span>
                      <span style={{ color: themeTokens.colors.textSecondary }}>None</span>
                    </div>
                  )}

                  {selectedProperty.transaction_type === 'rent' && (
                    <div style={{
                      marginTop: '6px',
                      padding: '8px 10px',
                      backgroundColor: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534' }}>Estimated Monthly Outgo:</span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#15803D' }}>
                        ₹{(
                          (selectedProperty.expected_amount || 0) +
                          (selectedProperty.maintenance_mode === 'extra' ? (selectedProperty.maintenance_amount || 0) : 0) +
                          (selectedProperty.additional_charges || []).filter(c => c.frequency === 'monthly').reduce((acc, c) => acc + (c.amount || 0), 0)
                        ).toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Property & Society Specifications */}
              <div style={{
                padding: '14px',
                border: `1px solid ${themeTokens.colors.border}`,
                borderRadius: '8px',
                backgroundColor: themeTokens.colors.surface,
              }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: themeTokens.colors.primaryDark, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={15} color={themeTokens.colors.primary} />
                  Unit Specifications & Society
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: `1px dashed ${themeTokens.colors.border}` }}>
                    <span style={{ color: themeTokens.colors.textSecondary }}>Society Name:</span>
                    <span style={{ fontWeight: 600 }}>{selectedProperty.society_name}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: `1px dashed ${themeTokens.colors.border}` }}>
                    <span style={{ color: themeTokens.colors.textSecondary }}>Society Code:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedProperty.society_id}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: `1px dashed ${themeTokens.colors.border}` }}>
                    <span style={{ color: themeTokens.colors.textSecondary }}>Micro-Market / Sector:</span>
                    <span style={{ fontWeight: 600 }}>{selectedProperty.location}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: `1px dashed ${themeTokens.colors.border}` }}>
                    <span style={{ color: themeTokens.colors.textSecondary }}>Configuration:</span>
                    <span style={{ fontWeight: 600 }}>{selectedProperty.property_type}</span>
                  </div>

                  {selectedProperty.additional_rooms && selectedProperty.additional_rooms.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: `1px dashed ${themeTokens.colors.border}` }}>
                      <span style={{ color: themeTokens.colors.textSecondary }}>Additional Rooms:</span>
                      <span style={{ fontWeight: 600 }}>{selectedProperty.additional_rooms.join(', ')}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: themeTokens.colors.textSecondary }}>Tenant Preference:</span>
                    <span style={{ fontWeight: 600, color: selectedProperty.tenant_type ? themeTokens.colors.primaryDark : themeTokens.colors.textSecondary }}>
                      {selectedProperty.tenant_type || 'All Eligible Tenants'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stakeholder Contacts & Key Custody Card */}
            <div style={{
              padding: '14px',
              border: `1px solid ${themeTokens.colors.border}`,
              borderRadius: '8px',
              backgroundColor: themeTokens.colors.surface,
            }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: themeTokens.colors.primaryDark, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={15} color={themeTokens.colors.primary} />
                Stakeholder Contacts & Inspection Custody
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {/* Owner Card */}
                <div style={{ padding: '10px', backgroundColor: themeTokens.colors.softSurface, borderRadius: '6px', fontSize: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: themeTokens.colors.textSecondary, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Property Owner
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: themeTokens.colors.textPrimary }}>
                    {selectedProperty.owner_name}
                  </div>
                  <div style={{ color: themeTokens.colors.textSecondary, marginBottom: '8px' }}>
                    {selectedProperty.owner_phone}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a
                      href={`tel:${selectedProperty.owner_phone}`}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#FFFFFF',
                        border: `1px solid ${themeTokens.colors.border}`,
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: themeTokens.colors.textPrimary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'none',
                      }}
                    >
                      <Phone size={11} color="#16A34A" /> Call
                    </a>
                    <a
                      href={`https://wa.me/${selectedProperty.owner_phone_normalized || selectedProperty.owner_phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#25D366',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'none',
                      }}
                    >
                      <MessageSquare size={11} color="#FFFFFF" /> WhatsApp
                    </a>
                  </div>
                </div>

                {/* Agent Card */}
                <div style={{ padding: '10px', backgroundColor: themeTokens.colors.softSurface, borderRadius: '6px', fontSize: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: themeTokens.colors.textSecondary, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Channel Partner / Sourcing Broker
                  </div>
                  {selectedProperty.agent_name ? (
                    <>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: themeTokens.colors.textPrimary }}>
                        {selectedProperty.agent_name}
                      </div>
                      <div style={{ color: themeTokens.colors.textSecondary, marginBottom: '8px' }}>
                        {selectedProperty.agent_phone || 'No phone recorded'}
                      </div>
                      {selectedProperty.agent_phone && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a
                            href={`tel:${selectedProperty.agent_phone}`}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#FFFFFF',
                              border: `1px solid ${themeTokens.colors.border}`,
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: themeTokens.colors.textPrimary,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              textDecoration: 'none',
                            }}
                          >
                            <Phone size={11} color="#16A34A" /> Call
                          </a>
                          <a
                            href={`https://wa.me/${selectedProperty.agent_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#25D366',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              textDecoration: 'none',
                            }}
                          >
                            <MessageSquare size={11} color="#FFFFFF" /> WhatsApp
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: themeTokens.colors.textSecondary, fontStyle: 'italic', marginTop: '6px' }}>
                      Direct Owner Listing (No Channel Partner Broker attached)
                    </div>
                  )}
                </div>
              </div>

              {/* Custody & Showing Instructions Notes */}
              <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: `1px solid ${themeTokens.colors.border}` }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: themeTokens.colors.textSecondary, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <Key size={12} color="#D97706" />
                  Key Custody, Lockbox Protocol & Showing Guidelines:
                </div>
                <p style={{ fontSize: '12px', color: themeTokens.colors.textPrimary, margin: 0, whiteSpace: 'pre-line' }}>
                  {selectedProperty.notes || 'No special showing or key custody restrictions specified. Contact owner prior to scheduling site visits.'}
                </p>
              </div>
            </div>

            {/* Audit Trail & Footer Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              paddingTop: '12px',
              borderTop: `1px solid ${themeTokens.colors.border}`,
              fontSize: '11px',
              color: themeTokens.colors.textSecondary,
            }}>
              <div>
                <span>Created: {formatDateTime(selectedProperty.created_at)}</span>
                {selectedProperty.created_by_name && <span> by <strong>{selectedProperty.created_by_name}</strong></span>}
                {selectedProperty.updated_at && (
                  <span style={{ marginLeft: '10px' }}>
                    • Updated: {formatDateTime(selectedProperty.updated_at)}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedProperty.status !== 'archived' ? (
                  <Button
                    label="Archive Property"
                    icon={<Archive size={12} />}
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchive(selectedProperty.property_id)}
                  />
                ) : (
                  <Button
                    label="Restore / Unarchive"
                    icon={<RotateCcw size={12} />}
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnarchive(selectedProperty.property_id)}
                  />
                )}
                <Button
                  label="Delete"
                  icon={<Trash2 size={12} />}
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(selectedProperty.property_id)}
                />
                <Button
                  label="Close"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProperty(null);
                    setStatusMessage(null);
                  }}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Excel Import Modal (PRD Section 5.19) */}
      <ExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={() => {
          fetchInventory();
        }}
        defaultSheetType="properties"
      />

      {/* 360 Degree Customer Modal */}
      <Customer360Modal
        customerId={customer360Id}
        isOpen={!!customer360Id}
        onClose={() => setCustomer360Id(null)}
      />
    </div>
  );
};
