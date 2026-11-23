import React, { useState, useRef } from 'react';
import { themeTokens } from '../theme/tokens';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import {
  api,
  ExcelImportPreviewResponse,
  ExcelImportCommitResponse,
} from '../services/api';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Database,
  RefreshCw,
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultSheetType?: 'properties' | 'enquiries';
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultSheetType = 'properties',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<ExcelImportPreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<ExcelImportCommitResponse | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewError(null);
    setCommitResult(null);
    setLoadingPreview(true);

    try {
      const res = await api.previewExcelImport(file);
      setPreviewData(res);
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to parse Excel file');
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCommit = async () => {
    if (!previewData || !previewData.preview_rows.length) return;
    setCommitting(true);
    setPreviewError(null);

    try {
      const validRows = previewData.preview_rows.filter((r) => r.is_valid);
      const res = await api.confirmExcelImport({
        sheet_type: previewData.sheet_type,
        file_name: previewData.file_name,
        rows: validRows.map((r) => r.data),
      });
      setCommitResult(res);
      onSuccess();
    } catch (err: any) {
      setPreviewError(err.message || 'Failed to commit import');
    } finally {
      setCommitting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setPreviewError(null);
    setCommitResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Excel Data Import Engine (PRD Section 5.19)"
      maxWidth="820px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Step Indicator Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: themeTokens.colors.softSurface,
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={16} color={themeTokens.colors.primaryDark} />
            <span style={{ fontWeight: 700, color: themeTokens.colors.textPrimary }}>
              Upload Legacy Workbook (.xlsx, .xls) • Target: {defaultSheetType.toUpperCase()}
            </span>
          </div>
          <span style={{ color: themeTokens.colors.textSecondary }}>
            {selectedFile ? `${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)` : 'Admin / Super Admin Workflow • Row-level Auditing'}
          </span>
        </div>

        {/* Success Commit Banner */}
        {commitResult && (
          <div style={{
            backgroundColor: '#DEF7EC',
            border: '1px solid #31C48D',
            padding: '16px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="#03543F" />
              <span style={{ fontWeight: 800, color: '#03543F', fontSize: '14px' }}>
                Import Successfully Committed!
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#03543F' }}>
              {commitResult.message}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <Button size="sm" variant="primary" label="Close" onClick={onClose} />
              <Button size="sm" variant="outline" label="Import Another File" onClick={handleReset} />
            </div>
          </div>
        )}

        {/* Error Banner */}
        {previewError && (
          <div style={{
            backgroundColor: '#FDE8E8',
            border: '1px solid #F98080',
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#9B1C1C',
          }}>
            <XCircle size={16} />
            <span>{previewError}</span>
          </div>
        )}

        {/* Upload Drop Zone (Visible when no commit yet) */}
        {!commitResult && !previewData && (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${themeTokens.colors.border}`,
              borderRadius: '10px',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: '#FAFAFA',
              transition: 'background 0.2s',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '24px',
                backgroundColor: themeTokens.colors.primarySoft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {loadingPreview ? (
                  <RefreshCw size={22} className="animate-spin" color={themeTokens.colors.primaryDark} />
                ) : (
                  <UploadCloud size={24} color={themeTokens.colors.primaryDark} />
                )}
              </div>
              <span style={{ fontWeight: 700, fontSize: '14px', color: themeTokens.colors.textPrimary }}>
                {loadingPreview ? 'Parsing & Validating Workbook...' : 'Click to select or drag and drop an Excel file'}
              </span>
              <span style={{ fontSize: '12px', color: themeTokens.colors.textSecondary }}>
                Supports standard Property Inventory sheets or Customer Enquiry trackers
              </span>
            </div>
          </div>
        )}

        {/* Validation & Preview Report (PRD 5.19) */}
        {!commitResult && previewData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* KPI Counts Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${themeTokens.colors.border}`, backgroundColor: '#FFFFFF' }}>
                <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>SHEET TYPE</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: themeTokens.colors.primaryDark, textTransform: 'capitalize' }}>
                  {previewData.sheet_type}
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', border: `1px solid ${themeTokens.colors.border}`, backgroundColor: '#FFFFFF' }}>
                <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>TOTAL ROWS</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: themeTokens.colors.textPrimary }}>
                  {previewData.total_rows}
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', border: `1px solid #31C48D`, backgroundColor: '#DEF7EC' }}>
                <div style={{ fontSize: '11px', color: '#03543F' }}>READY TO COMMIT</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#03543F' }}>
                  {previewData.valid_count} Valid
                </div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', border: `1px solid #F98080`, backgroundColor: '#FDE8E8' }}>
                <div style={{ fontSize: '11px', color: '#9B1C1C' }}>REJECTED / ERRORS</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#9B1C1C' }}>
                  {previewData.error_count} Errors
                </div>
              </div>
            </div>

            {/* Legacy Status Mapping Notice */}
            {Object.keys(previewData.status_mapping_applied).length > 0 && (
              <div style={{
                backgroundColor: '#FEF08A',
                border: '1px solid #EAB308',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#854D0E',
              }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={14} />
                  <span>Legacy Status Mapping Applied (PRD 5.19 Rule):</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {Object.entries(previewData.status_mapping_applied).map(([orig, mapped]) => (
                    <span key={orig} style={{ backgroundColor: '#FEF9C3', padding: '2px 8px', borderRadius: '4px', border: '1px solid #FDE047' }}>
                      "{orig}" <ArrowRight size={10} style={{ display: 'inline', margin: '0 2px' }} /> <strong>{mapped}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div style={{ maxHeight: '280px', overflowY: 'auto', border: `1px solid ${themeTokens.colors.border}`, borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: themeTokens.colors.softSurface, borderBottom: `1px solid ${themeTokens.colors.border}` }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Row #</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Key Identifier</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Details</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Validation Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.preview_rows.map((r) => (
                    <tr
                      key={r.row_number}
                      style={{
                        borderBottom: '1px solid #F3F4F6',
                        backgroundColor: r.is_valid ? '#FFFFFF' : '#FFF5F5',
                      }}
                    >
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: themeTokens.colors.textSecondary }}>
                        #{r.row_number}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <Badge
                          label={r.is_valid ? 'VALID' : 'INVALID'}
                          variant={r.is_valid ? 'success' : 'danger'}
                        />
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>
                        {previewData.sheet_type === 'properties'
                          ? r.data.society_name || 'Missing Society'
                          : r.data.customer_name || 'Missing Client'}
                      </td>
                      <td style={{ padding: '8px 10px', color: themeTokens.colors.textSecondary }}>
                        {previewData.sheet_type === 'properties'
                          ? `${r.data.bhk || ''} • ₹${(r.data.expected_amount || 0).toLocaleString('en-IN')}`
                          : `${r.data.customer_phone || ''} • ${r.data.looking_for || ''}`}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        {r.errors.length > 0 && (
                          <div style={{ color: '#DC2626', fontWeight: 600 }}>{r.errors.join('; ')}</div>
                        )}
                        {r.warnings.length > 0 && (
                          <div style={{ color: '#D97706', fontSize: '11px' }}>{r.warnings.join('; ')}</div>
                        )}
                        {r.errors.length === 0 && r.warnings.length === 0 && (
                          <span style={{ color: '#16A34A' }}>Ready for import</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <Button
                variant="outline"
                label="Choose Another File"
                onClick={handleReset}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="outline" label="Cancel" onClick={onClose} />
                <Button
                  variant="primary"
                  label={`Confirm & Commit ${previewData.valid_count} Records`}
                  icon={<Database size={15} />}
                  onClick={handleCommit}
                  disabled={committing || previewData.valid_count === 0}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
