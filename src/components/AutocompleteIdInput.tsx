import React, { useState, useEffect, useRef } from 'react';
import { themeTokens } from '../theme/tokens';
import { api } from '../services/api';
import { Search, X, Check, Building, FileText, User } from 'lucide-react';

export interface AutocompleteIdInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, suggestion?: any) => void;
  entityType?: 'all' | 'property' | 'enquiry' | 'customer';
  required?: boolean;
  helperText?: string;
}

export const AutocompleteIdInput: React.FC<AutocompleteIdInputProps> = ({
  label,
  placeholder = 'Type 2-3 chars (e.g. AE, 203, ENQ)...',
  value,
  onChange,
  entityType = 'all',
  required = false,
  helperText,
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    if (value !== query) {
      setQuery(value || '');
      if (!value) setSelectedItem(null);
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getSuggestions(trimmed, entityType, 8);
      setSuggestions(res.suggestions || []);
      setIsOpen((res.suggestions || []).length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setQuery(text);
    onChange(text);
    if (selectedItem && selectedItem.id !== text) {
      setSelectedItem(null);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length >= 1) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(text);
      }, 200);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (item: any) => {
    setQuery(item.id);
    setSelectedItem(item);
    setIsOpen(false);
    onChange(item.id, item);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedItem(null);
    setSuggestions([]);
    setIsOpen(false);
    onChange('');
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'property':
        return <Building size={14} color="#4F5278" />;
      case 'enquiry':
        return <FileText size={14} color="#6366F1" />;
      case 'customer':
        return <User size={14} color="#057A55" />;
      default:
        return <Search size={14} color="#6B7280" />;
    }
  };

  const getBadgeStyle = (badge: string) => {
    const b = (badge || '').toUpperCase();
    if (b === 'AVAILABLE' || b === 'HOT' || b === 'ACTIVE') {
      return { background: '#DEF7EC', color: '#03543F' };
    }
    if (b === 'RENTED' || b === 'SOLD' || b === 'CLOSED') {
      return { background: '#FDE8E8', color: '#9B1C1C' };
    }
    if (b === 'UNDER_NEGOTIATION' || b === 'WARM') {
      return { background: '#FEF08A', color: '#854D0E' };
    }
    return { background: '#EEF0F8', color: '#4F5278' };
  };

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={dropdownRef}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: themeTokens.colors.textPrimary }}>
            {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
          </label>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#6366F1' }}>
            ⚡ Smart Autocomplete (2-3 chars)
          </span>
        </div>
      )}

      {/* Input container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          border: `1.5px solid ${isOpen ? '#4F5278' : themeTokens.colors.border}`,
          borderRadius: isOpen ? '6px 6px 0 0' : '6px',
          padding: '6px 10px',
          backgroundColor: '#FFFFFF',
          transition: 'border-color 0.15s ease',
        }}
      >
        <Search size={14} color="#6B7280" style={{ marginRight: '6px', flexShrink: 0 }} />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim().length >= 1) fetchSuggestions(query);
          }}
          required={required}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '13px',
            color: themeTokens.colors.textPrimary,
            fontWeight: 600,
            background: 'transparent',
          }}
        />
        {loading && <span style={{ fontSize: '11px', color: '#6B7280', marginRight: '4px' }}>Searching...</span>}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={14} color="#9CA3AF" />
          </button>
        )}
      </div>

      {/* Selected Item Preview Pill */}
      {selectedItem && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '6px',
            padding: '6px 10px',
            marginTop: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Check size={14} color="#057A55" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#065F46' }}>
                {selectedItem.title}
              </div>
              <div style={{ fontSize: '11px', color: '#047857' }}>{selectedItem.subtitle}</div>
            </div>
          </div>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              ...getBadgeStyle(selectedItem.badge),
            }}
          >
            {selectedItem.badge}
          </span>
        </div>
      )}

      {/* Dropdown Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            border: '1.5px solid #4F5278',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            maxHeight: '220px',
            overflowY: 'auto',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: '4px 10px',
              background: '#F8FAFC',
              fontSize: '10px',
              fontWeight: 800,
              color: '#64748B',
              borderBottom: '1px solid #F1F5F9',
              letterSpacing: '0.04em',
            }}
          >
            MATCHING SUGGESTIONS ({suggestions.length})
          </div>
          {suggestions.map((item) => (
            <div
              key={`${item.entity_type}-${item.id}`}
              onClick={() => handleSelect(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 10px',
                borderBottom: '1px solid #F1F5F9',
                cursor: 'pointer',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '8px',
                  flexShrink: 0,
                }}
              >
                {getEntityIcon(item.entity_type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>{item.title}</span>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      ...getBadgeStyle(item.badge),
                    }}
                  >
                    {item.badge}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {helperText && !selectedItem && (
        <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px' }}>{helperText}</div>
      )}
    </div>
  );
};
