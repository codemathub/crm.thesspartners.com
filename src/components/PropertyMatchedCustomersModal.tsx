import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { themeTokens } from '../theme/tokens';
import { api, Property } from '../services/api';
import {
  Users,
  MessageCircle,
  Phone,
  Calendar,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';

interface PropertyMatchedCustomersModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCustomer360?: (customerId: string) => void;
  onScheduleVisit?: (property: Property, enquiry: any) => void;
}

export const PropertyMatchedCustomersModal: React.FC<PropertyMatchedCustomersModalProps> = ({
  property,
  isOpen,
  onClose,
  onOpenCustomer360,
  onScheduleVisit,
}) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMatches = async () => {
    if (!property) return;
    setLoading(true);
    try {
      const res = await api.getPropertyMatches(property.property_id);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load property matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && property) {
      fetchMatches();
    } else {
      setData(null);
    }
  }, [isOpen, property]);

  if (!isOpen || !property) return null;

  const matches = data?.matches || [];
  const totalMatches = data?.total_matches || matches.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Prospective Matched Customers — ${property.property_id} (${property.property_type})`}
      maxWidth="780px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '74vh', overflowY: 'auto' }}>
        {/* Unit Summary Card */}
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#EEF2FF',
            borderRadius: '8px',
            border: '1px solid #C7D2FE',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#312E81' }}>
                {property.property_id} • {property.property_type}
              </span>
              <Badge label={property.status} variant="success" />
            </div>
            <div style={{ fontSize: '12px', color: '#4338CA', marginTop: '2px' }}>
              {property.society_name}, {property.location} • <strong>₹{(property.expected_amount ?? 0).toLocaleString('en-IN')}{property.transaction_type === 'rent' ? ' / month' : ''}</strong>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#3730A3' }}>
              {loading ? 'Finding prospective matches...' : `${totalMatches} Matched Prospective Enquiries`}
            </span>
          </div>
        </div>

        {/* Matches List */}
        {loading && !data ? (
          <div style={{ padding: '30px', textAlign: 'center', color: themeTokens.colors.textSecondary }}>
            Running deterministic matching algorithm against active client enquiries...
          </div>
        ) : matches.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
            <Users size={32} color="#9CA3AF" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '14px', fontWeight: 600 }}>No Active Customer Matches</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              No current enquiries in the database align with this unit's price or configuration.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {matches.map((item: any, idx: number) => {
              const enq = item.enquiry;
              const reasons = item.match_reasons || [];
              const score = item.match_score || 0;
              return (
                <div
                  key={enq.enquiry_id || enq.id || idx}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>
                          {enq.customer_name || 'Prospective Client'}
                        </span>
                        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748B', backgroundColor: '#F1F5F9', padding: '1px 6px', borderRadius: '4px' }}>
                          #{enq.enquiry_id}
                        </span>
                        {enq.customer_phone && (
                          <span style={{ fontSize: '12px', color: '#4338CA', fontWeight: 600 }}>
                            <Phone size={11} style={{ display: 'inline', marginRight: '3px' }} />
                            {enq.customer_phone}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px' }}>
                        Seeking: <strong>{enq.looking_for}</strong> • Budget: <strong>₹{(enq.budget_min ?? 0).toLocaleString('en-IN')} - ₹{(enq.budget_max ?? 0).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          backgroundColor: score >= 80 ? '#D1FAE5' : '#FEF3C7',
                          color: score >= 80 ? '#047857' : '#92400E',
                        }}
                      >
                        ⚡ {score}% Match
                      </span>
                    </div>
                  </div>

                  {/* Match Criteria Badges */}
                  {reasons.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {reasons.map((r: string, rIdx: number) => (
                        <span
                          key={rIdx}
                          style={{
                            fontSize: '11px',
                            backgroundColor: '#F8FAFC',
                            color: '#475569',
                            border: '1px solid #E2E8F0',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle size={10} color="#10B981" /> {r}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions Row */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '10px' }}>
                    {onOpenCustomer360 && (enq.customer_id || enq.customer_id_ref) && (
                      <Button
                        label="View 360° Dossier"
                        size="sm"
                        variant="outline"
                        icon={<ExternalLink size={12} />}
                        onClick={() => {
                          onClose();
                          onOpenCustomer360(enq.customer_id || enq.customer_id_ref);
                        }}
                      />
                    )}
                    {enq.customer_phone && (
                      <Button
                        label="WhatsApp Unit Proposal"
                        size="sm"
                        variant="outline"
                        icon={<MessageCircle size={12} color="#16A34A" />}
                        onClick={() => {
                          const text = `*G² Brothers CRM Match Proposal*\nProperty ID: ${property.property_id}\nType: ${property.property_type}\nSociety: ${property.society_name}, ${property.location}\nAmount: ₹${(property.expected_amount ?? 0).toLocaleString('en-IN')}${property.transaction_type === 'rent' ? '/month' : ''}\nStatus: Available`;
                          const url = `https://wa.me/${enq.customer_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
                          window.open(url, '_blank');
                        }}
                      />
                    )}
                    {onScheduleVisit && (
                      <Button
                        label="Schedule Showing"
                        size="sm"
                        variant="primary"
                        icon={<Calendar size={12} />}
                        onClick={() => {
                          onClose();
                          onScheduleVisit(property, enq);
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
    </Modal>
  );
};
