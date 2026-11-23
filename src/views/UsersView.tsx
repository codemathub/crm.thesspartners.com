import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, Column } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { themeTokens } from '../theme/tokens';
import { UserPlus, KeyRound, Ban, RefreshCw, ShieldCheck, Trash2, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

interface UsersViewProps {
  currentUser?: any;
}

export const UsersView: React.FC<UsersViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [resetModalUser, setResetModalUser] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Create User Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<'admin' | 'executive'>('executive');
  const [password, setPassword] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState('');

  // Reset Password Form State
  const [newPassword, setNewPassword] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);
  const [resetError, setResetError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setCreateError('Full Name, Email, and Initial Password are required.');
      return;
    }
    setSubmittingCreate(true);
    try {
      const assignedRole = currentUser?.role === 'super_admin' ? role : 'executive';
      await api.createUserDirect({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: assignedRole,
        mobile: mobile.trim() || undefined,
        password: password.trim(),
      });
      setCreateModalOpen(false);
      setFullName('');
      setEmail('');
      setMobile('');
      setPassword('');
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create user account.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword.trim()) return;
    setResetError('');
    setSubmittingReset(true);
    try {
      await api.resetUserPassword(resetModalUser.id, newPassword.trim());
      alert(`Password successfully updated for ${resetModalUser.email}. All previous sessions have been revoked.`);
      setResetModalUser(null);
      setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password.');
    } finally {
      setSubmittingReset(false);
    }
  };

  const handleDeactivate = async (u: any) => {
    if (!window.confirm(`Are you sure you want to deactivate ${u.full_name} (${u.email})? They will immediately be logged out.`)) {
      return;
    }
    try {
      await api.deactivateUser(u.id);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate user.');
    }
  };

  const handleReactivate = async (u: any) => {
    try {
      await api.reactivateUser(u.id);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to reactivate user.');
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!window.confirm(`Permanently delete account for ${u.full_name} (${u.email})? This action cannot be undone.`)) {
      return;
    }
    try {
      await api.deleteUser(u.id);
      if (selectedUser?.id === u.id) setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'full_name',
      header: 'Full Name / Email',
      render: (u) => (
        <div>
          <div style={{ fontWeight: 600, color: themeTokens.colors.textPrimary }}>{u.full_name}</div>
          <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>{u.email}</div>
        </div>
      ),
    },
    {
      key: 'mobile',
      header: 'Mobile',
      render: (u) => <span style={{ fontSize: '12px' }}>{u.mobile || '—'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => {
        const variantMap: Record<string, 'primary' | 'info' | 'neutral'> = {
          super_admin: 'primary',
          admin: 'info',
          executive: 'neutral',
        };
        return <Badge label={u.role.toUpperCase()} variant={variantMap[u.role] || 'neutral'} />;
      },
    },
    {
      key: 'account_status',
      header: 'Status',
      render: (u) => {
        const variant = u.account_status === 'active' ? 'success' : u.account_status === 'invited' ? 'warning' : 'danger';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Badge label={u.account_status.toUpperCase()} variant={variant} />
            {u.password_reset_requested && (
              <Badge label="RESET REQUESTED" variant="danger" />
            )}
          </div>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Created On',
      render: (u) => (
        <span style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>
          {u.created_at
            ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (u) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button
            label={u.password_reset_requested ? 'Set New Pass' : 'Reset Pass'}
            variant={u.password_reset_requested ? 'primary' : 'outline'}
            size="sm"
            icon={<KeyRound size={12} />}
            onClick={() => {
              setResetModalUser(u);
              setNewPassword('');
              setResetError('');
            }}
          />
          {currentUser?.role === 'super_admin' && u.role !== 'super_admin' ? (
            <>
              {u.account_status === 'active' ? (
                <Button
                  label="Deactivate"
                  variant="danger"
                  size="sm"
                  icon={<Ban size={12} />}
                  onClick={() => handleDeactivate(u)}
                />
              ) : (
                <Button
                  label="Reactivate"
                  variant="outline"
                  size="sm"
                  icon={<CheckCircle size={12} />}
                  onClick={() => handleReactivate(u)}
                />
              )}
              <Button
                label="Delete"
                variant="danger"
                size="sm"
                icon={<Trash2 size={12} />}
                onClick={() => handleDeleteUser(u)}
              />
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color={themeTokens.colors.primaryDark} />
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: themeTokens.colors.textPrimary, margin: 0 }}>
              Company User Accounts & Direct Provisioning
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: themeTokens.colors.textSecondary, marginTop: '4px' }}>
            Direct creation with username/password (no invite links required). Super Admin password overrides.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            label="Refresh"
            variant="outline"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={fetchUsers}
          />
          <Button
            label={currentUser?.role === 'super_admin' ? '+ Create User / Admin' : '+ Create Executive'}
            variant="primary"
            icon={<UserPlus size={16} />}
            onClick={() => setCreateModalOpen(true)}
          />
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={users}
          keyExtractor={(u) => u.id}
          onRowClick={(u) => setSelectedUser(u)}
        />
      </Card>

      {/* Modal 1: Create User Directly with Credentials */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title={
            currentUser?.role === 'super_admin'
              ? 'Create Enterprise Account (Admin / Executive Provisioning)'
              : 'Create Field Executive Account'
          }
          maxWidth="520px"
        >
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '12px', color: themeTokens.colors.textSecondary, margin: 0 }}>
              The account is activated immediately in MongoDB Atlas with an Argon2id hash. The employee can directly sign in using this email and password in the mobile app.
            </p>

            {createError && (
              <div style={{ backgroundColor: '#FDE8E8', color: '#9B1C1C', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
                {createError}
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Work Email Address *
              </label>
              <input
                type="email"
                placeholder="e.g. rahul.sharma@estatecrm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Role *
                </label>
                {currentUser?.role === 'super_admin' ? (
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${themeTokens.colors.border}`,
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="executive">Executive (Field Agent)</option>
                    <option value="admin">Admin (Branch Manager)</option>
                  </select>
                ) : (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${themeTokens.colors.border}`,
                      backgroundColor: '#F9FAFB',
                      fontSize: '12px',
                      color: '#374151',
                    }}
                  >
                    Field Executive (Admin credentials only built by Super Admin)
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${themeTokens.colors.border}`,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Initial Login Password * (Min 6 characters)
              </label>
              <input
                type="text"
                placeholder="e.g. ExecPass@2026"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="outline" label="Cancel" onClick={() => setCreateModalOpen(false)} />
              <Button
                type="submit"
                variant="primary"
                label={submittingCreate ? 'Creating Account...' : 'Create Active Account'}
                disabled={submittingCreate}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 2: Super Admin Direct Password Reset */}
      {resetModalUser && (
        <Modal
          isOpen={Boolean(resetModalUser)}
          onClose={() => setResetModalUser(null)}
          title={`Override Password: ${resetModalUser.full_name}`}
          maxWidth="460px"
        >
          <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '12px', color: themeTokens.colors.textSecondary, margin: 0 }}>
              Enter a new password for <strong>{resetModalUser.email}</strong>. This updates their Argon2id hash immediately and terminates all their active device sessions.
            </p>

            {resetError && (
              <div style={{ backgroundColor: '#FDE8E8', color: '#9B1C1C', padding: '8px 12px', borderRadius: '6px', fontSize: '12px' }}>
                {resetError}
              </div>
            )}

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                New Password *
              </label>
              <input
                type="text"
                placeholder="e.g. NewSecret@2026"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${themeTokens.colors.border}`,
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button type="button" variant="outline" label="Cancel" onClick={() => setResetModalUser(null)} />
              <Button
                type="submit"
                variant="primary"
                label={submittingReset ? 'Updating Password...' : 'Confirm Password Reset'}
                disabled={submittingReset}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Modal 3: Selected User Details Dialog */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`Account Details: ${selectedUser.full_name}`}
        >
          <div style={{ fontSize: '13px', color: themeTokens.colors.textPrimary, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div><strong>User ID:</strong> {selectedUser.id}</div>
            <div><strong>Email:</strong> {selectedUser.email}</div>
            <div><strong>Mobile:</strong> {selectedUser.mobile || '—'}</div>
            <div><strong>Role:</strong> {selectedUser.role.toUpperCase()}</div>
            <div><strong>Account Status:</strong> {selectedUser.account_status.toUpperCase()}</div>
            <div><strong>Created At:</strong> {new Date(selectedUser.created_at).toLocaleString()}</div>
            <div style={{ borderTop: `1px solid ${themeTokens.colors.border}`, paddingTop: '12px', marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                label="Reset Password"
                variant="outline"
                size="sm"
                icon={<KeyRound size={12} />}
                onClick={() => {
                  setResetModalUser(selectedUser);
                  setSelectedUser(null);
                }}
              />
              {currentUser?.role === 'super_admin' && selectedUser.role !== 'super_admin' ? (
                <>
                  {selectedUser.account_status === 'active' ? (
                    <Button
                      label="Deactivate"
                      variant="danger"
                      size="sm"
                      icon={<Ban size={12} />}
                      onClick={() => handleDeactivate(selectedUser)}
                    />
                  ) : (
                    <Button
                      label="Reactivate"
                      variant="outline"
                      size="sm"
                      icon={<CheckCircle size={12} />}
                      onClick={() => handleReactivate(selectedUser)}
                    />
                  )}
                  <Button
                    label="Delete Account"
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={12} />}
                    onClick={() => handleDeleteUser(selectedUser)}
                  />
                </>
              ) : null}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
