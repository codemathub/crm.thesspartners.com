import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { themeTokens } from '../theme/tokens';
import { Plus, Building2, Sliders, AlertCircle } from 'lucide-react';
import { api, Society, MasterDataOption } from '../services/api';

export const SettingsView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'societies' | 'property_types' | 'locations' | 'tenant_types'>('societies');
  const [societies, setSocieties] = useState<Society[]>([]);
  const [masterData, setMasterData] = useState<MasterDataOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add society state
  const [addSocietyModal, setAddSocietyModal] = useState(false);
  const [newSocietyName, setNewSocietyName] = useState('');
  const [savingSociety, setSavingSociety] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Add master data state
  const [addOptionModal, setAddOptionModal] = useState(false);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [savingOption, setSavingOption] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [socList, mstrList] = await Promise.all([
        api.getSocieties(),
        api.getMasterData(),
      ]);
      setSocieties(socList);
      setMasterData(mstrList);
    } catch (err: any) {
      setError(err.message || 'Failed to load master data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocietyName.trim()) {
      setModalError('Society name cannot be empty');
      return;
    }
    setSavingSociety(true);
    setModalError(null);
    try {
      const created = await api.createSociety(newSocietyName.trim());
      setSocieties((prev) => [created, ...prev]);
      setNewSocietyName('');
      setAddSocietyModal(false);
    } catch (err: any) {
      setModalError(err.message || 'Could not create society');
    } finally {
      setSavingSociety(false);
    }
  };

  const handleToggleSociety = async (id: string) => {
    try {
      const updated = await api.toggleSocietyStatus(id);
      setSocieties((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (err: any) {
      alert(`Status toggle failed: ${err.message}`);
    }
  };

  const handleToggleOption = async (id: string) => {
    try {
      const updated = await api.toggleMasterDataStatus(id);
      setMasterData((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (err: any) {
      alert(`Option toggle failed: ${err.message}`);
    }
  };

  const handleCreateOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptionValue.trim()) return;
    setSavingOption(true);
    try {
      const cat = activeCategory === 'property_types' ? 'property_type' : activeCategory === 'locations' ? 'location' : 'tenant_type';
      const created = await api.createMasterDataOption(cat, newOptionValue.trim());
      setMasterData((prev) => [...prev, created]);
      setNewOptionValue('');
      setAddOptionModal(false);
    } catch (err: any) {
      alert(`Failed to add option: ${err.message}`);
    } finally {
      setSavingOption(false);
    }
  };

  const filteredMasterData = masterData.filter((m) => {
    if (activeCategory === 'property_types') return m.category === 'property_type';
    if (activeCategory === 'locations') return m.category === 'location';
    if (activeCategory === 'tenant_types') return m.category === 'tenant_type';
    return false;
  });

  const societyColumns: Column<Society>[] = [
    { key: 'id', header: 'Society ID', render: (s) => <span style={{ fontWeight: 800 }}>{s.id}</span> },
    { key: 'name', header: 'Society Name', render: (s) => <span style={{ fontWeight: 600 }}>{s.name}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <Badge label={s.is_active ? 'Active' : 'Inactive'} variant={s.is_active ? 'success' : 'neutral'} />,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (s) => (
        <Button
          label={s.is_active ? 'Deactivate' : 'Activate'}
          variant="outline"
          size="sm"
          onClick={() => handleToggleSociety(s.id)}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: themeTokens.colors.textPrimary }}>
            Master Data & Society Settings
          </h1>
          <p style={{ fontSize: '13px', color: themeTokens.colors.textSecondary, marginTop: '2px' }}>
            Database-managed dropdown values and unique society records. Read-only for Executive roles.
          </p>
        </div>

        {activeCategory === 'societies' ? (
          <Button
            label="Add New Society"
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => setAddSocietyModal(true)}
          />
        ) : (
          <Button
            label="Add Option"
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => setAddOptionModal(true)}
          />
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: '13px' }}>{error}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: 'societies', label: 'Societies', icon: <Building2 size={14} /> },
          { key: 'property_types', label: 'Property Types (BHK)', icon: <Sliders size={14} /> },
          { key: 'locations', label: 'Locations', icon: <Sliders size={14} /> },
          { key: 'tenant_types', label: 'Tenant Types', icon: <Sliders size={14} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveCategory(tab.key as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: `1px solid ${activeCategory === tab.key ? themeTokens.colors.primaryDark : themeTokens.colors.border}`,
              backgroundColor: activeCategory === tab.key ? themeTokens.colors.primaryDark : themeTokens.colors.surface,
              color: activeCategory === tab.key ? '#FFFFFF' : themeTokens.colors.textSecondary,
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: themeTokens.colors.textSecondary }}>
          Loading master records from database...
        </div>
      ) : activeCategory === 'societies' ? (
        <Card title="Registered Societies" subtitle={`Total registered societies: ${societies.length}`}>
          <Table columns={societyColumns} data={societies} keyExtractor={(s) => s.id} />
        </Card>
      ) : (
        <Card title={`Configured Options (${activeCategory})`} subtitle="Options dynamically retrieved by mobile and web forms">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
            {filteredMasterData.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '12px',
                  backgroundColor: themeTokens.colors.softSurface,
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: `1px solid ${themeTokens.colors.border}`,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{item.value}</span>
                <button
                  onClick={() => handleToggleOption(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Badge label={item.is_active ? 'Active' : 'Inactive'} variant={item.is_active ? 'success' : 'neutral'} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Society Modal */}
      <Modal
        isOpen={addSocietyModal}
        onClose={() => setAddSocietyModal(false)}
        title="Add New Society"
      >
        <form onSubmit={handleCreateSociety} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Society Name *</label>
            <input
              type="text"
              placeholder="e.g. Mahagun Mywoods"
              value={newSocietyName}
              onChange={(e) => setNewSocietyName(e.target.value)}
              disabled={savingSociety}
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

          {modalError && (
            <div style={{ fontSize: '12px', color: '#DC2626' }}>{modalError}</div>
          )}

          <p style={{ fontSize: '12px', color: themeTokens.colors.textSecondary }}>
            The server assigns a unique sequential Society ID (e.g. SOC0011) and enforces case-insensitive name uniqueness.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <Button label="Cancel" variant="outline" size="sm" onClick={() => setAddSocietyModal(false)} />
            <Button
              label={savingSociety ? 'Saving...' : 'Save Society'}
              variant="primary"
              size="sm"
              disabled={savingSociety}
            />
          </div>
        </form>
      </Modal>

      {/* Add Master Option Modal */}
      <Modal
        isOpen={addOptionModal}
        onClose={() => setAddOptionModal(false)}
        title={`Add Option: ${activeCategory}`}
      >
        <form onSubmit={handleCreateOption} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Option Value *</label>
            <input
              type="text"
              placeholder="e.g. Penthouse or Independent Floor"
              value={newOptionValue}
              onChange={(e) => setNewOptionValue(e.target.value)}
              disabled={savingOption}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <Button label="Cancel" variant="outline" size="sm" onClick={() => setAddOptionModal(false)} />
            <Button
              label={savingOption ? 'Saving...' : 'Save Option'}
              variant="primary"
              size="sm"
              disabled={savingOption}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
