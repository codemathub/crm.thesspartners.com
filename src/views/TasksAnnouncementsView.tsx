import React, { useState, useEffect } from 'react';
import { themeTokens } from '../theme/tokens';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  api,
  Task,
  Announcement,
  InAppNotification,
  Property,
} from '../services/api';
import {
  Megaphone,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw,
  ShieldAlert,
  Send,
  Phone,
  MessageCircle,
  XCircle,
  Check,
} from 'lucide-react';

export const TasksAnnouncementsView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter tabs
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'acknowledged' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState<'tasks' | 'announcements' | 'notifications'>('tasks');
  const [notificationUnreadOnly, setNotificationUnreadOnly] = useState(false);

  // Modals
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completeTaskModalOpen, setCompleteTaskModalOpen] = useState(false);
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [cancelModalTask, setCancelModalTask] = useState<Task | null>(null);
  const [cancelReason, setCancelReason] = useState('Task cancelled by Admin');

  // Dispatch Form
  const [newTask, setNewTask] = useState({
    title: '',
    task_type: 'lead_assignment',
    assigned_to: '',
    priority: 'medium',
    sla_minutes: 30,
    target_client_name: '',
    target_client_phone: '',
    monthly_budget: '',
    asset_preference: '',
    property_id: '',
    lockbox_tag: '',
    instructions: '',
  });

  // Broadcast Form
  const [newNotice, setNewNotice] = useState({
    title: '',
    body: '',
    audience: 'all',
    priority: 'normal',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, noticesRes, notifsRes, usersRes, propsRes, custsRes] = await Promise.all([
        api.getTasks({ status: statusFilter === 'all' ? undefined : statusFilter }),
        api.getActiveAnnouncements().catch(() => []),
        api.getNotifications({ limit: 50, unread_only: notificationUnreadOnly || undefined }).catch(() => ({ items: [], total: 0, unread_count: 0 })),
        api.getUsers().catch(() => []),
        api.getProperties({ limit: 100 }).catch(() => ({ items: [], total: 0 })),
        api.getCustomers().catch(() => ({ items: [], total: 0 })),
      ]);
      setTasks(tasksRes.items || []);
      setAnnouncements(noticesRes || []);
      setNotifications(notifsRes.items || []);
      setUsers(usersRes || []);
      setProperties(propsRes.items || []);
      setCustomers(custsRes.items || []);
    } catch (err: any) {
      if (err.message?.includes('credentials') || err.message?.includes('token') || err.message?.includes('401')) {
        return;
      }
      setError(err.message || 'Failed to load task & directive records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleDispatchTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assigned_to) {
      alert('Please fill in title and select an assignee.');
      return;
    }
    try {
      await api.createTask({
        ...newTask,
        sla_minutes: Number(newTask.sla_minutes) || 30,
      });
      setDispatchModalOpen(false);
      setNewTask({
        title: '',
        task_type: 'lead_assignment',
        assigned_to: '',
        priority: 'medium',
        sla_minutes: 30,
        target_client_name: '',
        target_client_phone: '',
        monthly_budget: '',
        asset_preference: '',
        property_id: '',
        lockbox_tag: '',
        instructions: '',
      });
      loadData();
    } catch (err: any) {
      alert(`Error dispatching task: ${err.message}`);
    }
  };

  const handleBroadcastNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.body) {
      alert('Please fill in notice title and body.');
      return;
    }
    try {
      await api.createAnnouncement(newNotice);
      setBroadcastModalOpen(false);
      setNewNotice({ title: '', body: '', audience: 'all', priority: 'normal' });
      loadData();
    } catch (err: any) {
      alert(`Error broadcasting notice: ${err.message}`);
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;
    try {
      await api.completeTask(selectedTask.task_id, completionRemarks);
      setCompleteTaskModalOpen(false);
      setSelectedTask(null);
      setCompletionRemarks('');
      loadData();
    } catch (err: any) {
      alert(`Error completing task: ${err.message}`);
    }
  };

  const handleAcknowledge = async (taskId: string) => {
    try {
      await api.acknowledgeTask(taskId);
      loadData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCancelTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalTask || !cancelReason.trim()) return;
    try {
      await api.cancelTask(cancelModalTask.task_id, cancelReason.trim());
      setCancelModalTask(null);
      setCancelReason('Task cancelled by Admin');
      loadData();
    } catch (err: any) {
      alert(`Error cancelling task: ${err.message}`);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to mark all as read');
    }
  };

  const handleMarkSingleNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      loadData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const executives = users.filter((u: any) => u.role !== 'super_admin');

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${themeTokens.colors.border}`,
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    marginBottom: '4px',
    color: themeTokens.colors.textPrimary,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: themeTokens.colors.primaryDark, margin: 0 }}>
            Operational Directives & Broadcast Notices
          </h2>
          <p style={{ fontSize: '13px', color: themeTokens.colors.textSecondary, margin: '4px 0 0 0' }}>
            Authoritative SLA dispatch, key custody verification, and company-wide notices
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            label="Refresh"
            variant="outline"
            icon={<RefreshCw size={15} />}
            onClick={loadData}
          />
          <Button
            label="Broadcast Notice"
            variant="secondary"
            icon={<Megaphone size={15} />}
            onClick={() => setBroadcastModalOpen(true)}
          />
          <Button
            label="Dispatch Directive"
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => setDispatchModalOpen(true)}
          />
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#FEE2E2',
            color: '#B91C1C',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}

      {/* Main Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: `1px solid ${themeTokens.colors.border}`,
          paddingBottom: '8px',
        }}
      >
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
            backgroundColor: activeTab === 'tasks' ? themeTokens.colors.primaryDark : 'transparent',
            color: activeTab === 'tasks' ? '#FFFFFF' : themeTokens.colors.textSecondary,
          }}
        >
          Assigned Directives ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('announcements')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
            backgroundColor: activeTab === 'announcements' ? themeTokens.colors.primaryDark : 'transparent',
            color: activeTab === 'announcements' ? '#FFFFFF' : themeTokens.colors.textSecondary,
          }}
        >
          Branch Notices ({announcements.length})
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
            backgroundColor: activeTab === 'notifications' ? themeTokens.colors.primaryDark : 'transparent',
            color: activeTab === 'notifications' ? '#FFFFFF' : themeTokens.colors.textSecondary,
          }}
        >
          In-App Notifications ({notifications.length})
        </button>
      </div>

      {/* TAB 1: Assigned Directives */}
      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Status Subfilters */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'pending', 'acknowledged', 'completed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  border: `1px solid ${statusFilter === st ? themeTokens.colors.primaryDark : themeTokens.colors.border}`,
                  backgroundColor: statusFilter === st ? '#EEF0F8' : '#FFFFFF',
                  color: statusFilter === st ? themeTokens.colors.primaryDark : themeTokens.colors.textSecondary,
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: themeTokens.colors.textSecondary }}>
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '32px', color: themeTokens.colors.textSecondary }}>
                <Clock size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No operational directives found</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                  Click "Dispatch Directive" above to assign an SLA task to field executives.
                </p>
              </div>
            </Card>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {tasks.map((task) => {
                const isPending = task.status === 'pending';
                const isAck = task.status === 'acknowledged';
                const isDone = task.status === 'completed';
                const isCancelled = task.status === 'cancelled';

                return (
                  <div
                    key={task.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: `1px solid ${isCancelled ? '#FCA5A5' : themeTokens.colors.border}`,
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    {/* Top Row: Task ID & Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: themeTokens.colors.primaryDark }}>
                          #{task.task_id}
                        </span>
                        <Badge
                          label={task.status.toUpperCase()}
                          variant={
                            isDone ? 'success' : isAck ? 'info' : isPending ? 'warning' : 'danger'
                          }
                        />
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: task.priority === 'urgent' ? '#FEE2E2' : task.priority === 'high' ? '#FEF3C7' : '#F1F5F9',
                            color: task.priority === 'urgent' ? '#B91C1C' : task.priority === 'high' ? '#92400E' : '#475569',
                            textTransform: 'uppercase',
                          }}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: '#EEF0F8',
                          color: '#4F5278',
                          padding: '2px 8px',
                          borderRadius: '12px',
                        }}
                      >
                        {task.sla_minutes}m SLA
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: '#1F2937' }}>
                        {task.title}
                      </h4>
                      {task.instructions && (
                        <p style={{ margin: 0, fontSize: '12px', color: themeTokens.colors.textSecondary, lineHeight: 1.4 }}>
                          {task.instructions}
                        </p>
                      )}
                    </div>

                    {/* Target Client & Budget Card */}
                    {(task.target_client_name || task.monthly_budget || task.asset_preference || task.property_id) && (
                      <div
                        style={{
                          backgroundColor: '#F9FAFB',
                          borderRadius: '8px',
                          padding: '10px',
                          fontSize: '12px',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '6px',
                        }}
                      >
                        {task.target_client_name && (
                          <div>
                            <span style={{ color: themeTokens.colors.textSecondary, fontSize: '11px' }}>Target Client:</span>
                            <div style={{ fontWeight: 600, color: '#1F2937' }}>{task.target_client_name}</div>
                            {task.target_client_phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span style={{ fontSize: '11px', color: '#64748B' }}>{task.target_client_phone}</span>
                                <a href={`tel:${task.target_client_phone}`} style={{ color: '#4F5278' }} title="Call Client"><Phone size={11} /></a>
                                <a href={`https://wa.me/${task.target_client_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#10B981' }} title="WhatsApp Client"><MessageCircle size={11} /></a>
                              </div>
                            )}
                          </div>
                        )}
                        {task.monthly_budget && (
                          <div>
                            <span style={{ color: themeTokens.colors.textSecondary, fontSize: '11px' }}>Monthly Budget:</span>
                            <div style={{ fontWeight: 600, color: '#1F2937' }}>{task.monthly_budget}</div>
                          </div>
                        )}
                        {task.property_id && (
                          <div style={{ gridColumn: task.asset_preference ? 'span 1' : 'span 2' }}>
                            <span style={{ color: themeTokens.colors.textSecondary, fontSize: '11px' }}>Property Ref:</span>
                            <div style={{ fontWeight: 700, color: themeTokens.colors.primaryDark }}>#{task.property_id}</div>
                          </div>
                        )}
                        {task.asset_preference && (
                          <div style={{ gridColumn: task.property_id ? 'span 1' : 'span 2' }}>
                            <span style={{ color: themeTokens.colors.textSecondary, fontSize: '11px' }}>Asset Preference:</span>
                            <div style={{ fontWeight: 600, color: '#1F2937' }}>{task.asset_preference}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Custody Lockbox Tag */}
                    {task.lockbox_tag && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#4F5278',
                          fontWeight: 600,
                        }}
                      >
                        <ShieldAlert size={14} />
                        Lockbox Tag: #{task.lockbox_tag}
                      </div>
                    )}

                    {/* Assignee & Dates */}
                    <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Assigned to: <strong>{task.assigned_name || task.assigned_to}</strong></span>
                      <span>By: {task.assigned_by_name || 'Admin'}</span>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #F3F4F6', flexWrap: 'wrap', alignItems: 'center' }}>
                      {isPending && (
                        <Button
                          label="Acknowledge"
                          variant="secondary"
                          size="sm"
                          icon={<CheckCircle size={13} />}
                          onClick={() => handleAcknowledge(task.task_id)}
                        />
                      )}
                      {!isDone && !isCancelled && (
                        <Button
                          label="Complete"
                          variant="primary"
                          size="sm"
                          icon={<CheckCircle size={13} />}
                          onClick={() => {
                            setSelectedTask(task);
                            setCompleteTaskModalOpen(true);
                          }}
                        />
                      )}
                      {!isDone && !isCancelled && (
                        <Button
                          label="Cancel"
                          variant="outline"
                          size="sm"
                          icon={<XCircle size={13} />}
                          onClick={() => setCancelModalTask(task)}
                        />
                      )}
                      {task.completion_remarks && (
                        <div style={{ fontSize: '11px', color: '#059669', fontStyle: 'italic', width: '100%' }}>
                          ✓ Remarks: {task.completion_remarks}
                        </div>
                      )}
                      {task.cancellation_reason && (
                        <div style={{ fontSize: '11px', color: '#DC2626', fontStyle: 'italic', width: '100%' }}>
                          ✕ Cancelled: {task.cancellation_reason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Branch Notices */}
      {activeTab === 'announcements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {announcements.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '32px', color: themeTokens.colors.textSecondary }}>
                <Megaphone size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No active branch notices</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                  Post a notice to inform field executives about roasters, incentives, or policies.
                </p>
              </div>
            </Card>
          ) : (
            announcements.map((notice) => (
              <div
                key={notice.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderLeft: '4px solid #4F5278',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#4F5278',
                        letterSpacing: '0.5px',
                      }}
                    >
                      BRANCH NOTICE • {notice.audience.toUpperCase()}
                    </span>
                    {notice.priority === 'urgent' && <Badge label="URGENT" variant="danger" />}
                  </div>
                  <span style={{ fontSize: '11px', color: themeTokens.colors.textSecondary }}>
                    {new Date(notice.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1F2937' }}>
                  {notice.title}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#4B5563', lineHeight: 1.5 }}>
                  {notice.body}
                </p>
                <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, marginTop: '4px' }}>
                  Posted by: <strong>{notice.created_by_name || 'Admin'}</strong>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: In-App Notifications */}
      {activeTab === 'notifications' && (
        <Card
          title="Executive Notification Log"
          subtitle="Real-time in-app alerts and push delivery trace across web & mobile"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setNotificationUnreadOnly(false)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '14px',
                  border: `1px solid ${!notificationUnreadOnly ? themeTokens.colors.primaryDark : themeTokens.colors.border}`,
                  backgroundColor: !notificationUnreadOnly ? '#EEF0F8' : '#FFFFFF',
                  color: !notificationUnreadOnly ? themeTokens.colors.primaryDark : themeTokens.colors.textSecondary,
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setNotificationUnreadOnly(true)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '14px',
                  border: `1px solid ${notificationUnreadOnly ? themeTokens.colors.primaryDark : themeTokens.colors.border}`,
                  backgroundColor: notificationUnreadOnly ? '#EEF0F8' : '#FFFFFF',
                  color: notificationUnreadOnly ? themeTokens.colors.primaryDark : themeTokens.colors.textSecondary,
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Unread Only ({notifications.filter((n) => !n.is_read).length})
              </button>
            </div>

            <Button
              label="Mark All as Read"
              variant="outline"
              size="sm"
              icon={<Check size={13} />}
              onClick={handleMarkAllNotificationsRead}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.length === 0 ? (
              <p style={{ fontSize: '13px', color: themeTokens.colors.textSecondary }}>No notifications dispatched yet.</p>
            ) : (
              notifications
                .filter((n) => !notificationUnreadOnly || !n.is_read)
                .map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && handleMarkSingleNotificationRead(n.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: n.is_read ? '#FFFFFF' : '#F0FDF4',
                      border: `1px solid ${n.is_read ? themeTokens.colors.border : '#BBF7D0'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: n.is_read ? 'default' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title={n.is_read ? 'Already read' : 'Click to mark as read'}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937' }}>{n.title}</span>
                        <Badge label={n.notification_type.replace(/_/g, ' ')} variant={n.is_read ? 'neutral' : 'success'} />
                        {!n.is_read && (
                          <span style={{ width: '6px', height: '6px', borderRadius: '3px', backgroundColor: '#10B981' }} />
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '3px' }}>{n.body}</div>
                    </div>
                    <div style={{ fontSize: '11px', color: themeTokens.colors.textSecondary, whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                ))
            )}
          </div>
        </Card>
      )}

      {/* MODAL 1: Dispatch Operational Directive */}
      <Modal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        title="Dispatch Operational Directive"
      >
        <form onSubmit={handleDispatchTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Directive Title *</label>
            <input
              style={inputStyle}
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="e.g. Lead Assignment: Priority Client Showing"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Directive Type</label>
              <select
                style={inputStyle}
                value={newTask.task_type}
                onChange={(e) => setNewTask({ ...newTask, task_type: e.target.value })}
              >
                <option value="lead_assignment">Lead Assignment</option>
                <option value="key_custody">Key Custody Verification</option>
                <option value="document_collection">Document Collection</option>
                <option value="property_inspection">Property Inspection</option>
                <option value="general">General Operational Task</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Assign Executive / Staff *</label>
              <select
                style={inputStyle}
                value={newTask.assigned_to}
                onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                required
              >
                <option value="">-- Select Assignee ({executives.length} available) --</option>
                {executives.map((u: any) => (
                  <option key={u.id} value={u.email}>
                    {u.full_name} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Response SLA (Minutes)</label>
              <input
                type="number"
                style={inputStyle}
                value={String(newTask.sla_minutes)}
                onChange={(e) => setNewTask({ ...newTask, sla_minutes: Number(e.target.value) || 30 })}
                placeholder="30"
              />
            </div>
            <div>
              <label style={labelStyle}>Priority Level</label>
              <select
                style={inputStyle}
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Quick Select Client */}
          <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: `1px solid ${themeTokens.colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: themeTokens.colors.textPrimary }}>
                TARGET CLIENT DETAILS
              </span>
              {customers.length > 0 && (
                <span style={{ fontSize: '10px', color: themeTokens.colors.primaryDark, fontWeight: 700 }}>
                  {customers.length} registered customers
                </span>
              )}
            </div>

            {customers.length > 0 && (
              <select
                style={{ ...inputStyle, marginBottom: '8px', backgroundColor: '#FFFFFF' }}
                onChange={(e) => {
                  const val = e.target.value;
                  const c = customers.find((cust) => cust.customer_id === val);
                  if (c) {
                    setNewTask({
                      ...newTask,
                      target_client_name: c.name,
                      target_client_phone: c.primary_phone,
                    });
                  }
                }}
              >
                <option value="">-- Quick Pick Customer From Directory --</option>
                {customers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.name} ({c.primary_phone}) • {c.customer_type}
                  </option>
                ))}
              </select>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                style={inputStyle}
                value={newTask.target_client_name}
                onChange={(e) => setNewTask({ ...newTask, target_client_name: e.target.value })}
                placeholder="Client full name"
              />
              <input
                style={inputStyle}
                value={newTask.target_client_phone}
                onChange={(e) => setNewTask({ ...newTask, target_client_phone: e.target.value })}
                placeholder="Client phone number"
              />
            </div>
          </div>

          {/* Quick Select Property */}
          <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: `1px solid ${themeTokens.colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: themeTokens.colors.textPrimary }}>
                PROPERTY & ASSET SPECIFICATION
              </span>
              {properties.length > 0 && (
                <span style={{ fontSize: '10px', color: themeTokens.colors.primaryDark, fontWeight: 700 }}>
                  {properties.length} active inventory units
                </span>
              )}
            </div>

            {properties.length > 0 && (
              <select
                style={{ ...inputStyle, marginBottom: '8px', backgroundColor: '#FFFFFF' }}
                onChange={(e) => {
                  const val = e.target.value;
                  const p = properties.find((prop) => prop.property_id === val);
                  if (p) {
                    setNewTask({
                      ...newTask,
                      property_id: p.property_id,
                      asset_preference: `${p.property_type} in ${p.society_name}, ${p.location}`,
                      monthly_budget: p.transaction_type === 'rent' ? `₹${p.expected_amount}/mo` : `₹${p.expected_amount}`,
                    });
                  }
                }}
              >
                <option value="">-- Quick Pick Property From Inventory --</option>
                {properties.map((p) => (
                  <option key={p.property_id} value={p.property_id}>
                    #{p.property_id} — {p.property_type} in {p.society_name} (₹{p.expected_amount})
                  </option>
                ))}
              </select>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                style={inputStyle}
                value={newTask.property_id}
                onChange={(e) => setNewTask({ ...newTask, property_id: e.target.value })}
                placeholder="Property Ref (e.g. PR-2089)"
              />
              <input
                style={inputStyle}
                value={newTask.monthly_budget}
                onChange={(e) => setNewTask({ ...newTask, monthly_budget: e.target.value })}
                placeholder="Budget e.g. ₹35,000 / mo"
              />
            </div>

            <div style={{ marginTop: '8px' }}>
              <input
                style={inputStyle}
                value={newTask.asset_preference}
                onChange={(e) => setNewTask({ ...newTask, asset_preference: e.target.value })}
                placeholder="Asset spec e.g. 3 BHK in Prestige Willow"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Lockbox Tag (For Key Custody)</label>
              <input
                style={inputStyle}
                value={newTask.lockbox_tag}
                onChange={(e) => setNewTask({ ...newTask, lockbox_tag: e.target.value })}
                placeholder="e.g. LB-04B"
              />
            </div>
            <div>
              <label style={labelStyle}>Field Instructions</label>
              <input
                style={inputStyle}
                value={newTask.instructions}
                onChange={(e) => setNewTask({ ...newTask, instructions: e.target.value })}
                placeholder="Special notes or directives"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button
              label="Cancel"
              variant="outline"
              type="button"
              onClick={() => setDispatchModalOpen(false)}
            />
            <Button
              label="Dispatch Directive"
              variant="primary"
              type="submit"
              icon={<Send size={15} />}
            />
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Broadcast Notice */}
      <Modal
        isOpen={broadcastModalOpen}
        onClose={() => setBroadcastModalOpen(false)}
        title="Broadcast Branch Notice"
      >
        <form onSubmit={handleBroadcastNotice} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Notice Title *</label>
            <input
              style={inputStyle}
              value={newNotice.title}
              onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
              placeholder="e.g. Diwali weekend duty roster finalized"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Audience</label>
              <select
                style={inputStyle}
                value={newNotice.audience}
                onChange={(e) => setNewNotice({ ...newNotice, audience: e.target.value })}
              >
                <option value="all">All Executives & Staff</option>
                <option value="executives">Field Executives Only</option>
                <option value="admins">Admins & Management</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select
                style={inputStyle}
                value={newNotice.priority}
                onChange={(e) => setNewNotice({ ...newNotice, priority: e.target.value })}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notice Body *</label>
            <textarea
              value={newNotice.body}
              onChange={(e) => setNewNotice({ ...newNotice, body: e.target.value })}
              rows={4}
              required
              placeholder="Write the full announcement directive here..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${themeTokens.colors.border}`,
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button
              label="Cancel"
              variant="outline"
              type="button"
              onClick={() => setBroadcastModalOpen(false)}
            />
            <Button
              label="Broadcast Notice"
              variant="primary"
              type="submit"
              icon={<Megaphone size={15} />}
            />
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Complete Task */}
      <Modal
        isOpen={completeTaskModalOpen}
        onClose={() => setCompleteTaskModalOpen(false)}
        title={`Complete Directive #${selectedTask?.task_id}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: themeTokens.colors.textPrimary, margin: 0 }}>
            Mark directive <strong>{selectedTask?.title}</strong> as successfully resolved.
          </p>

          <div>
            <label style={labelStyle}>Completion Remarks</label>
            <input
              style={inputStyle}
              value={completionRemarks}
              onChange={(e) => setCompletionRemarks(e.target.value)}
              placeholder="e.g. Physical keys verified in lockbox #LB-04B. Both sets present."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button
              label="Cancel"
              variant="outline"
              onClick={() => setCompleteTaskModalOpen(false)}
            />
            <Button
              label="Confirm Completed"
              variant="primary"
              icon={<CheckCircle size={15} />}
              onClick={handleCompleteTask}
            />
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Cancel Directive */}
      {cancelModalTask && (
        <Modal
          isOpen={!!cancelModalTask}
          onClose={() => setCancelModalTask(null)}
          title={`Cancel Directive #${cancelModalTask.task_id}`}
        >
          <form onSubmit={handleCancelTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: themeTokens.colors.textPrimary, margin: 0 }}>
              Are you sure you want to abort directive <strong>{cancelModalTask.title}</strong>? An audit record will be logged.
            </p>

            <div>
              <label style={labelStyle}>Cancellation Reason *</label>
              <input
                style={inputStyle}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Client postponed showing / Assigned to alternate executive"
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <Button
                label="Keep Directive"
                variant="outline"
                type="button"
                onClick={() => setCancelModalTask(null)}
              />
              <Button
                label="Confirm Cancellation"
                variant="danger"
                type="submit"
                icon={<XCircle size={15} />}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
