const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('estateflow_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('estateflow_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('estateflow_token');
}

export function validateMobileNumber(phone: string, label = 'Mobile number'): { valid: boolean; error?: string } {
  if (!phone || !phone.trim()) {
    return { valid: false, error: `${label} is compulsory and cannot be left blank.` };
  }
  const clean = phone.trim();
  const digits = clean.replace(/\D/g, '');
  let standardDigits = digits;
  if (digits.length === 12 && digits.startsWith('91')) {
    standardDigits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    standardDigits = digits.slice(1);
  }

  if (standardDigits.length < 10) {
    return { valid: false, error: `${label} must contain at least 10 digits (got '${clean}').` };
  }
  if (standardDigits.length > 15) {
    return { valid: false, error: `${label} cannot exceed 15 digits.` };
  }
  if (new Set(standardDigits).size <= 2) {
    return { valid: false, error: `${label} '${clean}' is not a valid real mobile number.` };
  }
  if (['1234567890', '0123456789', '9876543210', '0987654321'].includes(standardDigits)) {
    return { valid: false, error: `${label} cannot be a generic placeholder.` };
  }
  if (standardDigits.length === 10 && !/^[6-9]/.test(standardDigits)) {
    return { valid: false, error: `${label} must start with 6, 7, 8, or 9 for a valid 10-digit mobile number.` };
  }
  return { valid: true };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      window.dispatchEvent(new CustomEvent('auth-unauthorized'));
    }
    const errorBody = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(errorBody.detail || `HTTP Error ${response.status}`);
  }

  return response.json();
}

export interface Society {
  id: string;
  society_id: string;
  name: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MasterDataOption {
  id: string;
  category: string;
  value: string;
  is_active: boolean;
  sort_order: number;
}

export interface AdditionalCharge {
  name: string;
  amount: number;
  frequency: 'one_time' | 'monthly';
}

export interface Property {
  id: string;
  property_id: string;
  transaction_type: 'rent' | 'sale';
  property_type: string;
  bhk?: string;
  additional_rooms: string[];
  society_id: string;
  society_name: string;
  location: string;
  expected_amount: number;
  currency: string;
  negotiable: boolean;
  security_deposit?: number;
  maintenance_mode: 'included' | 'extra';
  maintenance_amount?: number;
  additional_charges: AdditionalCharge[];
  owner_name: string;
  owner_phone: string;
  owner_phone_normalized: string;
  agent_name?: string;
  agent_phone?: string;
  tenant_type?: string;
  status: 'available' | 'rented' | 'sold' | 'reserved' | 'under_negotiation' | 'archived';
  notes?: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

export interface Visit {
  id: string;
  visit_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  enquiry_id: string;
  property_id: string;
  property_society: string;
  property_bhk?: string;
  property_location: string;
  property_amount: number;
  property_transaction_type: string;
  scheduled_at: string;
  assigned_to?: string;
  assigned_name?: string;
  claim_status: 'direct_assigned' | 'unclaimed' | 'claimed';
  claimed_by?: string;
  claimed_by_name?: string;
  claimed_at?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'rescheduled' | 'cancelled';
  outcome?: string;
  remarks?: string;
  reschedule_reason?: string;
  cancellation_reason?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FollowUp {
  id: string;
  followup_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  enquiry_id: string;
  enquiry_requirement?: string;
  scheduled_at: string;
  responsible_employee: string;
  responsible_name?: string;
  notes: string;
  status: 'scheduled' | 'due' | 'completed' | 'missed' | 'cancelled';
  outcome?: string;
  remarks?: string;
  completed_at?: string;
  reschedule_reason?: string;
  cancellation_reason?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FollowUpsListResponse {
  items: FollowUp[];
  total: number;
  overdue_count: number;
  today_count: number;
  upcoming_count: number;
}

export interface CalendarAgendaItem {
  date: string;
  total_count: number;
  followups: FollowUp[];
}

export interface Task {
  id: string;
  task_id: string;
  title: string;
  task_type: string;
  assigned_to: string;
  assigned_name?: string;
  assigned_by: string;
  assigned_by_name?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled';
  target_client_name?: string;
  target_client_phone?: string;
  monthly_budget?: string;
  asset_preference?: string;
  property_id?: string;
  enquiry_id?: string;
  lockbox_tag?: string;
  sla_minutes: number;
  due_at?: string;
  instructions?: string;
  acknowledged_at?: string;
  completed_at?: string;
  completion_remarks?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface TasksListResponse {
  items: Task[];
  total: number;
  pending_count: number;
  sla_breach_count: number;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: string;
  priority: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  expires_at?: string;
}

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  notification_type: string;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsListResponse {
  items: InAppNotification[];
  total: number;
  unread_count: number;
}

export interface PropertyListResponse {
  items: Property[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const api = {
  // Auth & Users
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request<any>('/auth/me'),
  getUsers: () => request<any[]>('/users'),
  createUserDirect: (data: { full_name: string; email: string; role: string; password: string; mobile?: string }) =>
    request<any>('/users/create', { method: 'POST', body: JSON.stringify(data) }),
  resetUserPassword: (userId: string, newPassword: string) =>
    request<any>(`/users/${userId}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password: newPassword }) }),
  deactivateUser: (userId: string) =>
    request<any>(`/users/${userId}/deactivate`, { method: 'POST' }),
  reactivateUser: (userId: string) =>
    request<any>(`/users/${userId}/reactivate`, { method: 'POST' }),
  deleteUser: (userId: string) =>
    request<any>(`/users/${userId}`, { method: 'DELETE' }),

  // Societies
  getSocieties: (activeOnly = false) =>
    request<Society[]>(`/societies${activeOnly ? '?is_active=true' : ''}`),
  createSociety: (name: string, metadata = {}) =>
    request<Society>('/societies', { method: 'POST', body: JSON.stringify({ name, metadata }) }),
  toggleSocietyStatus: (id: string) =>
    request<Society>(`/societies/${id}/toggle-status`, { method: 'PATCH' }),

  // Master Data
  getMasterData: (category?: string, activeOnly = false) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (activeOnly) params.append('is_active', 'true');
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<MasterDataOption[]>(`/master-data${qs}`);
  },
  createMasterDataOption: (category: string, value: string, sortOrder = 0) =>
    request<MasterDataOption>('/master-data', {
      method: 'POST',
      body: JSON.stringify({ category, value, sort_order: sortOrder }),
    }),
  toggleMasterDataStatus: (id: string) =>
    request<MasterDataOption>(`/master-data/${id}/toggle-status`, { method: 'PATCH' }),

  // Properties
  getProperties: (params: {
    search?: string;
    transaction_type?: 'rent' | 'sale';
    property_type?: string;
    society_id?: string;
    location?: string;
    status?: string;
    min_price?: number;
    max_price?: number;
    include_archived?: boolean;
    sort_by?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<{ items: Property[]; total: number; page: number; limit: number; pages: number }>(`/properties${qs}`);
  },
  getProperty: (propertyId: string) => request<Property>(`/properties/${propertyId}`),
  createProperty: (data: any) =>
    request<Property>('/properties', { method: 'POST', body: JSON.stringify(data) }),
  updateProperty: (propertyId: string, data: any) =>
    request<Property>(`/properties/${propertyId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  archiveProperty: (propertyId: string) =>
    request<Property>(`/properties/${propertyId}/archive`, { method: 'POST' }),
  unarchiveProperty: (propertyId: string) =>
    request<Property>(`/properties/${propertyId}/unarchive`, { method: 'POST' }),
  deleteProperty: (propertyId: string) =>
    request<{ detail: string }>(`/properties/${propertyId}`, { method: 'DELETE' }),

  // Customers
  checkDuplicatePhone: (phone: string) =>
    request<{ has_duplicate: boolean; matches: Array<{ id: string; customer_id: string; name: string; primary_phone: string; customer_type: string; enquiries_count: number }> }>(
      `/customers/check-phone?phone=${encodeURIComponent(phone)}`
    ),
  getCustomers: (search?: string, customerType?: string, priority?: string, page = 1) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (customerType && customerType !== 'all') params.append('customer_type', customerType);
    if (priority && priority !== 'all') params.append('priority', priority);
    params.append('page', String(page));
    return request<{ items: any[]; total: number; page: number; pages: number }>(`/customers?${params.toString()}`);
  },
  getCustomer: (customerId: string) =>
    request<{ customer: any; enquiries: any[] }>(`/customers/${customerId}`),
  getCustomer360: (customerId: string) =>
    request<{
      customer: any;
      enquiries: any[];
      visits: any[];
      followups: any[];
      matched_properties: Array<{
        property: Property;
        match_score: number;
        match_reasons: string[];
        for_enquiry?: string;
      }>;
      stats: {
        total_enquiries: number;
        active_enquiries: number;
        total_visits: number;
        pending_visits: number;
        total_followups: number;
        pending_followups: number;
        matched_properties_count: number;
      };
    }>(`/customers/${customerId}/360`),
  createCustomer: (data: any) =>
    request<any>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (customerId: string, data: any) =>
    request<any>(`/customers/${customerId}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Enquiries
  getEnquiries: (params: { search?: string; status?: string; transaction_type?: string; customer_id?: string; page?: number } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'all') {
        searchParams.append(key, String(val));
      }
    });
    return request<{ items: any[]; total: number; page: number; pages: number }>(`/enquiries?${searchParams.toString()}`);
  },
  getEnquiry: (enquiryId: string) => request<any>(`/enquiries/${enquiryId}`),
  createEnquiry: (data: any) =>
    request<any>('/enquiries', { method: 'POST', body: JSON.stringify(data) }),
  updateEnquiry: (enquiryId: string, data: any) =>
    request<any>(`/enquiries/${enquiryId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  changeEnquiryStatus: (enquiryId: string, status: string, reason?: string, notes?: string) =>
    request<any>(`/enquiries/${enquiryId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, reason, notes }),
    }),

  // Global Search & Matching
  globalSearch: (q: string, type = 'all', limit = 10) =>
    request<{
      query: string;
      total: number;
      properties: Property[];
      customers: any[];
      enquiries: any[];
      results: Array<{
        id: string;
        entity_type: 'property' | 'customer' | 'enquiry';
        title: string;
        subtitle: string;
        badge: string;
        data: any;
      }>;
    }>(`/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}`),

  getSuggestions: (q: string, entity = 'all', limit = 8) =>
    request<{
      query: string;
      total: number;
      suggestions: Array<{
        id: string;
        entity_type: 'property' | 'customer' | 'enquiry';
        title: string;
        subtitle: string;
        badge: string;
        extra?: any;
      }>;
    }>(`/search/suggestions?q=${encodeURIComponent(q)}&entity=${entity}&limit=${limit}`),

  getEnquiryMatches: (enquiryId: string, limit = 20) =>
    request<{
      enquiry_id: string;
      customer_name: string;
      looking_for: string;
      transaction_type: string;
      budget_range: string;
      match_count: number;
      matches: Array<{
        property: Property;
        match_score: number;
        match_reasons: string[];
      }>;
    }>(`/search/matches/${enquiryId}?limit=${limit}`),

  getPropertyMatches: (propertyId: string, limit = 20) =>
    request<{
      property_id: string;
      society_name: string;
      property_type: string;
      expected_amount: number;
      total_matches: number;
      matches: Array<{
        enquiry: any;
        match_score: number;
        match_reasons: string[];
      }>;
    }>(`/search/property-matches/${propertyId}?limit=${limit}`),

  // Visits & Operational Hub
  getVisits: (params: {
    status?: string;
    claim_status?: string;
    my_visits?: boolean;
    open_claims_only?: boolean;
    date?: string;
    search?: string;
    property_id?: string;
    limit?: number;
    skip?: number;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    return request<{ items: Visit[]; total: number; open_claims_count: number; today_visits_count: number }>(`/visits?${searchParams.toString()}`);
  },
  getVisit: (visitId: string) => request<Visit>(`/visits/${visitId}`),
  createVisit: (data: { enquiry_id: string; property_id: string; scheduled_at: string; assigned_to?: string; notes?: string }) =>
    request<Visit>('/visits', { method: 'POST', body: JSON.stringify(data) }),
  claimVisit: (visitId: string) =>
    request<Visit>(`/visits/${visitId}/claim`, { method: 'POST' }),
  completeVisit: (visitId: string, data: { outcome?: string; remarks?: string }) =>
    request<Visit>(`/visits/${visitId}/complete`, { method: 'POST', body: JSON.stringify(data) }),
  rescheduleVisit: (visitId: string, data: { new_scheduled_at: string; reason: string }) =>
    request<Visit>(`/visits/${visitId}/reschedule`, { method: 'POST', body: JSON.stringify(data) }),
  cancelVisit: (visitId: string, reason: string) =>
    request<Visit>(`/visits/${visitId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  reassignVisit: (visitId: string, new_assigned_to: string) =>
    request<Visit>(`/visits/${visitId}/reassign`, { method: 'POST', body: JSON.stringify({ new_assigned_to }) }),

  // Follow-ups & Calendar (Phase 9)
  getFollowUps: (params: {
    range?: 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';
    status?: string;
    enquiry_id?: string;
    customer_id?: string;
    employee_id?: string;
    search?: string;
    limit?: number;
    skip?: number;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    return request<FollowUpsListResponse>(`/followups?${searchParams.toString()}`);
  },
  getFollowUp: (followupId: string) => request<FollowUp>(`/followups/${followupId}`),
  createFollowUp: (data: {
    enquiry_id: string;
    scheduled_at: string;
    notes: string;
    responsible_employee?: string;
  }) => request<FollowUp>('/followups', { method: 'POST', body: JSON.stringify(data) }),
  completeFollowUp: (
    followupId: string,
    data: {
      outcome: string;
      remarks?: string;
      next_followup_at?: string;
      next_followup_notes?: string;
    }
  ) => request<FollowUp>(`/followups/${followupId}/complete`, { method: 'POST', body: JSON.stringify(data) }),
  rescheduleFollowUp: (
    followupId: string,
    data: {
      new_scheduled_at: string;
      reason: string;
    }
  ) => request<FollowUp>(`/followups/${followupId}/reschedule`, { method: 'POST', body: JSON.stringify(data) }),
  cancelFollowUp: (followupId: string, reason: string) =>
    request<FollowUp>(`/followups/${followupId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
  addFollowUpNote: (
    followupId: string,
    data: { notes: string; outcome?: string; remarks?: string }
  ) =>
    request<FollowUp>(`/followups/${followupId}/note`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCalendarAgenda: (startDate: string, endDate: string) =>
    request<CalendarAgendaItem[]>(`/followups/calendar/agenda?start_date=${startDate}&end_date=${endDate}`),

  // Tasks, Announcements & Notifications (Phase 10)
  getTasks: (params: {
    status?: string;
    task_type?: string;
    my_tasks?: boolean;
    limit?: number;
    skip?: number;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    return request<TasksListResponse>(`/tasks?${searchParams.toString()}`);
  },
  createTask: (data: {
    title: string;
    assigned_to: string;
    task_type?: string;
    priority?: string;
    sla_minutes?: number;
    target_client_name?: string;
    target_client_phone?: string;
    monthly_budget?: string;
    asset_preference?: string;
    property_id?: string;
    enquiry_id?: string;
    lockbox_tag?: string;
    instructions?: string;
  }) => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  acknowledgeTask: (taskId: string) =>
    request<Task>(`/tasks/${taskId}/acknowledge`, { method: 'POST' }),
  completeTask: (taskId: string, remarks?: string) =>
    request<Task>(`/tasks/${taskId}/complete`, { method: 'POST', body: JSON.stringify({ remarks }) }),
  cancelTask: (taskId: string, reason: string) =>
    request<Task>(`/tasks/${taskId}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  createAnnouncement: (data: {
    title: string;
    body: string;
    audience?: string;
    priority?: string;
  }) => request<Announcement>('/tasks/announcements/create', { method: 'POST', body: JSON.stringify(data) }),
  getActiveAnnouncements: () =>
    request<Announcement[]>('/tasks/announcements/active'),

  getNotifications: (params: { unread_only?: boolean; limit?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.unread_only) searchParams.append('unread_only', 'true');
    if (params.limit) searchParams.append('limit', String(params.limit));
    return request<NotificationsListResponse>(`/notifications?${searchParams.toString()}`);
  },
  markNotificationRead: (id: string) =>
    request<{ detail: string }>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () =>
    request<{ detail: string }>('/notifications/read-all', { method: 'POST' }),

  getAuditLogs: (params: { search?: string; event_type?: string; entity_type?: string; limit?: number; skip?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.append('search', params.search);
    if (params.event_type) searchParams.append('event_type', params.event_type);
    if (params.entity_type) searchParams.append('entity_type', params.entity_type);
    if (params.limit) searchParams.append('limit', String(params.limit));
    if (params.skip) searchParams.append('skip', String(params.skip));
    return request<AuditLogListResponse>(`/audit?${searchParams.toString()}`);
  },

  // Central Password Reset & Credential Recovery Queue (Stitch Screen 07e931405c7a4afb8b645f8cab123b0f)
  getPasswordResetQueue: (status?: string, role?: string) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (role && role !== 'all') params.append('role', role);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<PasswordResetQueueResponse>(`/auth/password-reset-queue${qs}`);
  },
  authorizePasswordReset: (reqId: string, newPassword: string) =>
    request<{ message: string }>(`/auth/password-reset-queue/${reqId}/authorize`, {
      method: 'POST',
      body: JSON.stringify({ new_password: newPassword }),
    }),
  rejectPasswordReset: (reqId: string, reason?: string) =>
    request<{ message: string }>(`/auth/password-reset-queue/${reqId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Deal Close / Abort / Lifecycle (Phase 11)
  closeEnquiryDeal: (enquiryId: string, data: { property_id: string; deal_amount?: number; final_remarks?: string; deal_date?: string; visit_id?: string }) =>
    request<DealRecord>(`/enquiries/${enquiryId}/close-deal`, { method: 'POST', body: JSON.stringify(data) }),
  abortEnquiry: (enquiryId: string, data: { reason: string; final_remarks?: string; visit_id?: string }) =>
    request<any>(`/enquiries/${enquiryId}/abort`, { method: 'POST', body: JSON.stringify(data) }),
  restoreEnquiry: (enquiryId: string) =>
    request<any>(`/enquiries/${enquiryId}/restore`, { method: 'POST' }),
  closeVisitDeal: (visitId: string, data: { deal_amount?: number; final_remarks?: string } = {}) =>
    request<DealRecord>(`/visits/${visitId}/close-deal`, { method: 'POST', body: JSON.stringify(data) }),
  abortVisitDeal: (visitId: string, data: { reason: string; remarks?: string }) =>
    request<any>(`/visits/${visitId}/abort-deal`, { method: 'POST', body: JSON.stringify(data) }),

  // Archives Hub (Phase 11)
  getArchiveStats: () =>
    request<ArchiveStats>(`/archives/stats`),
  getArchivedProperties: (params: { search?: string; status_filter?: string; transaction_type?: string; page?: number; limit?: number } = {}) => {
    const sp = new URLSearchParams();
    if (params.search) sp.append('search', params.search);
    if (params.status_filter && params.status_filter !== 'all') sp.append('status_filter', params.status_filter);
    if (params.transaction_type && params.transaction_type !== 'all') sp.append('transaction_type', params.transaction_type);
    if (params.page) sp.append('page', String(params.page));
    if (params.limit) sp.append('limit', String(params.limit));
    return request<PropertyListResponse>(`/archives/properties?${sp.toString()}`);
  },
  getArchivedEnquiries: (params: { search?: string; status_filter?: string; transaction_type?: string; page?: number; limit?: number } = {}) => {
    const sp = new URLSearchParams();
    if (params.search) sp.append('search', params.search);
    if (params.status_filter && params.status_filter !== 'all') sp.append('status_filter', params.status_filter);
    if (params.transaction_type && params.transaction_type !== 'all') sp.append('transaction_type', params.transaction_type);
    if (params.page) sp.append('page', String(params.page));
    if (params.limit) sp.append('limit', String(params.limit));
    return request<{ items: any[]; total: number; page: number; limit: number; pages: number }>(`/archives/enquiries?${sp.toString()}`);
  },
  getArchivedDeals: (params: { search?: string; transaction_type?: string; page?: number; limit?: number } = {}) => {
    const sp = new URLSearchParams();
    if (params.search) sp.append('search', params.search);
    if (params.transaction_type && params.transaction_type !== 'all') sp.append('transaction_type', params.transaction_type);
    if (params.page) sp.append('page', String(params.page));
    if (params.limit) sp.append('limit', String(params.limit));
    return request<{ items: DealRecord[]; total: number; page: number; limit: number; pages: number }>(`/archives/deals?${sp.toString()}`);
  },
  restoreArchivedProperty: (propertyId: string) =>
    request<{ message: string; entity_type: string; entity_id: string; restored_status: string }>(`/archives/properties/${propertyId}/restore`, { method: 'POST' }),
  restoreArchivedEnquiry: (enquiryId: string) =>
    request<{ message: string; entity_type: string; entity_id: string; restored_status: string }>(`/archives/enquiries/${enquiryId}/restore`, { method: 'POST' }),
  permanentlyDeleteProperty: (propertyId: string, reason: string) =>
    request<{ detail: string }>(`/archives/properties/${propertyId}/permanent`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
  permanentlyDeleteEnquiry: (enquiryId: string, reason: string) =>
    request<{ detail: string }>(`/archives/enquiries/${enquiryId}/permanent`, { method: 'DELETE', body: JSON.stringify({ reason }) }),

  // Reports & Analytics (Phase 12)
  getReportKPIs: () =>
    request<ReportKPIs>(`/reports/kpis`),
  getExecutivePerformance: () =>
    request<{ items: ExecutivePerformanceItem[]; total_executives: number }>(`/reports/executive-performance`),
  getReportDrilldown: (metric: string, limit = 50) =>
    request<DrilldownResponse>(`/reports/drilldown?metric=${encodeURIComponent(metric)}&limit=${limit}`),

  // Excel Export & Import Engine (Phase 13 / PRD 5.19)
  downloadExcelExport: async (endpoint: 'properties' | 'enquiries' | 'deals') => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/excel/export/${endpoint}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      if (res.status === 403) {
        throw new Error('Access Denied: Field Executive roles cannot export company data.');
      }
      throw new Error(`Export failed with HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estateflow_${endpoint}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  previewExcelImport: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/excel/import/preview`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to parse Excel workbook');
    }
    return res.json() as Promise<ExcelImportPreviewResponse>;
  },
  confirmExcelImport: (data: { sheet_type: string; file_name: string; rows: any[] }) =>
    request<ExcelImportCommitResponse>('/excel/import/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // WhatsApp Integration (Phase 13 / PRD 5.20)
  logWhatsAppShare: (data: { property_id?: string; enquiry_id?: string; customer_phone?: string; share_channel?: string; message_excerpt?: string }) =>
    request<{ status: string; timestamp: string }>('/whatsapp/log-share', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getWhatsAppStatus: () =>
    request<WhatsAppStatusResponse>('/whatsapp/status'),
};

export interface ReportKPIs {
  total_properties: number;
  available_properties: number;
  rented_properties: number;
  sold_properties: number;
  archived_properties: number;
  total_enquiries: number;
  new_enquiries_this_week: number;
  active_enquiries: number;
  closed_deals: number;
  aborted_deals: number;
  today_scheduled_visits: number;
  completed_visits: number;
  open_unclaimed_visits: number;
  today_followups: number;
  upcoming_followups: number;
  overdue_followups: number;
  total_deal_volume: number;
  rent_deal_volume: number;
  sale_deal_volume: number;
}

export interface ExecutivePerformanceItem {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  assigned_enquiries: number;
  completed_visits: number;
  overdue_followups: number;
  pending_tasks: number;
  closed_deals: number;
  total_deal_volume: number;
  conversion_rate: number;
}

export interface DrilldownItem {
  id: string;
  entity_type: string;
  title: string;
  subtitle: string;
  badge: string;
  date: string;
  data: Record<string, any>;
}

export interface DrilldownResponse {
  metric: string;
  title: string;
  total: number;
  items: DrilldownItem[];
}


export interface DealRecord {
  id: string;
  deal_id: string;
  enquiry_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone?: string;
  property_id: string;
  property_society?: string;
  property_location?: string;
  property_bhk?: string;
  transaction_type: 'rent' | 'sale';
  deal_amount: number;
  deal_date: string;
  responsible_executive_id: string;
  responsible_executive_name: string;
  final_remarks?: string;
  created_at: string;
}

export interface ArchiveStats {
  closed_deals_count: number;
  aborted_enquiries_count: number;
  rented_properties_count: number;
  sold_properties_count: number;
  archived_properties_count: number;
  total_archived_properties: number;
  total_archived_enquiries: number;
}


export interface PasswordResetQueueItem {
  id: string;
  req_id: string;
  user_id: string;
  email: string;
  full_name: string;
  mobile?: string;
  role: string;
  cluster: string;
  reporting_manager: string;
  reason: string;
  device_signature: string;
  client_ip: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_action?: string;
}

export interface PasswordResetQueueResponse {
  items: PasswordResetQueueItem[];
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  recent_dispatches: {
    name: string;
    role: string;
    action: string;
    status: string;
    resolved_at: string;
  }[];
}

export interface AuditEventItem {
  id: string;
  timestamp: string;
  actor_id?: string;
  actor_name: string;
  actor_email?: string;
  actor_role: string;
  event_type: string;
  action_label?: string;
  entity_type: string;
  entity_id: string;
  entity_name?: string;
  summary?: string;
  diff?: any;
  ip_address?: string;
  status: string;
}

export interface AuditLogListResponse {
  items: AuditEventItem[];
  total: number;
}

export interface ExcelImportPreviewRow {
  row_number: number;
  is_valid: boolean;
  data: Record<string, any>;
  errors: string[];
  warnings: string[];
}

export interface ExcelImportPreviewResponse {
  sheet_type: string;
  file_name: string;
  total_rows: number;
  valid_count: number;
  error_count: number;
  warning_count: number;
  status_mapping_applied: Record<string, string>;
  preview_rows: ExcelImportPreviewRow[];
  errors: { row_number: number; field: string; error: string; raw_value?: string }[];
}

export interface ExcelImportCommitResponse {
  sheet_type: string;
  file_name: string;
  imported_count: number;
  skipped_count: number;
  message: string;
}

export interface WhatsAppStatusResponse {
  is_configured: boolean;
  mode_a_manual_available: boolean;
  mode_b_direct_api_available: boolean;
  phone_number_id?: string;
  business_account_id?: string;
  webhook_verified: boolean;
  message: string;
}
