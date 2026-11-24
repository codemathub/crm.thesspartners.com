import React, { useState, useEffect, useRef } from 'react';
import { themeTokens } from '../theme/tokens';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { api, Property } from '../services/api';
import {
  Search,
  Building,
  User,
  HelpCircle,
  X,
  Users,
  Sparkles,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProperty?: (property: Property) => void;
  onSelectCustomer360?: (customerId: string) => void;
  onSelectEnquiry?: (enquiryId: string) => void;
  onViewPropertyMatches?: (property: Property) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProperty,
  onSelectCustomer360,
  onSelectEnquiry,
  onViewPropertyMatches,
}) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'properties' | 'customers' | 'enquiries'>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    properties: Property[];
    customers: any[];
    enquiries: any[];
    results: any[];
    total: number;
  }>({ properties: [], customers: [], enquiries: [], results: [], total: 0 });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ properties: [], customers: [], enquiries: [], results: [], total: 0 });
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Real-time search with debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ properties: [], customers: [], enquiries: [], results: [], total: 0 });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.globalSearch(trimmed, activeTab, 15);
        setResults(res as any);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  if (!isOpen) return null;

  const totalHits = results.total || 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '60px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${themeTokens.colors.border}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 18px',
            borderBottom: `1px solid ${themeTokens.colors.border}`,
            gap: '12px',
          }}
        >
          <Search size={18} color="#4338CA" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Property ID, Society, Client Name, Phone, Enquiry ID..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              fontWeight: 500,
              color: '#0F172A',
            }}
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94A3B8',
                padding: '4px',
              }}
            >
              <X size={16} />
            </button>
          ) : (
            <kbd style={{ fontSize: '10px', backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #CBD5E1', color: '#64748B' }}>
              ESC to exit
            </kbd>
          )}
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '8px 18px',
            backgroundColor: '#F8FAFC',
            borderBottom: `1px solid ${themeTokens.colors.border}`,
          }}
        >
          {[
            { id: 'all', label: 'All Results' },
            { id: 'properties', label: `Properties (${results.properties?.length || 0})` },
            { id: 'customers', label: `Customers (${results.customers?.length || 0})` },
            { id: 'enquiries', label: `Enquiries (${results.enquiries?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                border: 'none',
                fontSize: '12px',
                fontWeight: activeTab === tab.id ? 700 : 500,
                backgroundColor: activeTab === tab.id ? '#4338CA' : '#E2E8F0',
                color: activeTab === tab.id ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
          {loading && (
            <span style={{ fontSize: '12px', color: '#6366F1', marginLeft: 'auto', alignSelf: 'center' }}>
              Searching...
            </span>
          )}
        </div>

        {/* Results Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>
          {!query.trim() ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>Global Enterprise Search</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Type a keyword, phone number, property ID (e.g. <code>PR-2089</code>), or customer name.
              </div>
            </div>
          ) : totalHits === 0 && !loading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>No results found for "{query}"</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Verify spelling, contact number format, or try broadening your search filter.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Properties Section */}
              {(activeTab === 'all' || activeTab === 'properties') && results.properties?.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    PROPERTIES ({results.properties.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {results.properties.map((p) => (
                      <div
                        key={p.property_id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building size={16} color="#4338CA" />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                              {p.property_id} • {p.property_type} in {p.society_name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>
                              {p.location} • ₹{(p.expected_amount ?? 0).toLocaleString('en-IN')}{p.transaction_type === 'rent' ? '/mo' : ''} • Owner: {p.owner_name} ({p.owner_phone})
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Badge label={p.status} variant="success" />
                          {onViewPropertyMatches && (
                            <Button
                              label="Matched Clients"
                              size="sm"
                              variant="outline"
                              icon={<Users size={12} />}
                              onClick={() => {
                                onClose();
                                onViewPropertyMatches(p);
                              }}
                            />
                          )}
                          {onSelectProperty && (
                            <Button
                              label="View Unit"
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                onClose();
                                onSelectProperty(p);
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers Section */}
              {(activeTab === 'all' || activeTab === 'customers') && results.customers?.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    CUSTOMERS ({results.customers.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {results.customers.map((c) => (
                      <div
                        key={c.customer_id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={16} color="#059669" />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                              {c.name} ({c.customer_id})
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>
                              Phone: <strong style={{ color: '#334155' }}>{c.primary_phone}</strong> • {c.customer_type?.toUpperCase()} • {c.enquiries_count || 0} enquiries
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Badge label={c.priority?.toUpperCase() || 'NORMAL'} variant={c.priority === 'hot' ? 'danger' : 'warning'} />
                          {onSelectCustomer360 && (
                            <Button
                              label="Details"
                              size="sm"
                              variant="primary"
                              icon={<Sparkles size={12} />}
                              onClick={() => {
                                onClose();
                                onSelectCustomer360(c.customer_id);
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enquiries Section */}
              {(activeTab === 'all' || activeTab === 'enquiries') && results.enquiries?.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    ENQUIRIES ({results.enquiries.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {results.enquiries.map((e) => (
                      <div
                        key={e.enquiry_id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <HelpCircle size={16} color="#D97706" />
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                              #{e.enquiry_id} • {e.customer_name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>
                              Seeking: {e.looking_for} • Budget: ₹{(e.budget_min ?? 0).toLocaleString('en-IN')} - ₹{(e.budget_max ?? 0).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Badge label={e.status?.replace(/_/g, ' ') || 'ACTIVE'} variant="neutral" />
                          {onSelectEnquiry && (
                            <Button
                              label="View Enquiry"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                onClose();
                                onSelectEnquiry(e.enquiry_id);
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
