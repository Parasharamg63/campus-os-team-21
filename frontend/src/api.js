// Frontend API Client for आवाज (Avaaj) - CampusOS Track 4 FixIt
// Strictly implements Section 4: FixIt Maintenance Tickets (/api/v1/fixit) & Auth

const API_BASE = '/api/v1';

// Token storage helpers
export const getToken = () => localStorage.getItem('avaaj_token');
export const setToken = (token) => localStorage.setItem('avaaj_token', token);
export const removeToken = () => localStorage.removeItem('avaaj_token');

export const getCurrentUser = () => {
  const user = localStorage.getItem('avaaj_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
};

export const setCurrentUser = (user) => {
  localStorage.setItem('avaaj_user', JSON.stringify(user));
};

export const removeCurrentUser = () => {
  localStorage.removeItem('avaaj_user');
};

const getHeaders = (isFormData = false) => {
  const headers = {};
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

// Generic request helper with robust error handling
async function request(url, options = {}) {
  const isFormData = options.body instanceof FormData;
  const config = {
    ...options,
    headers: {
      ...getHeaders(isFormData),
      ...(options.headers || {}),
    },
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.error?.message || data.message || 'Request failed');
      err.code = data.error?.code || 'ERROR';
      err.status = res.status;
      err.details = data.error?.details || null;
      throw err;
    }
    return data;
  } catch (error) {
    throw error;
  }
}

/* ========================================================
   AUTHENTICATION APIS (Non-Admin, CM, Admin)
   ======================================================== */

// POST /api/v1/auth/login (Non-admin: Student, Faculty, Office Staff & CM)
export const apiLoginUser = async (email_id, otp) => {
  const res = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email_id, otp }),
  });
  if (res.access_token) {
    setToken(res.access_token);
    setCurrentUser(res.profile);
  }
  return res;
};

// POST /api/v1/auth/admin/login (Admin)
export const apiLoginAdmin = async (email_id, otp) => {
  const res = await request(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    body: JSON.stringify({ email_id, otp }),
  });
  if (res.access_token) {
    setToken(res.access_token);
    setCurrentUser(res.profile);
  }
  return res;
};

/* ========================================================
   4. FIXIT: MAINTENANCE TICKETS (/api/v1/fixit)
   ======================================================== */

// 1. POST /tickets -> Form-data: issue_type_id*, title*, description*, photo
// Who: non-admin (student, faculty, office staff)
export const apiCreateTicket = async (formData) => {
  return request(`${API_BASE}/fixit/tickets`, {
    method: 'POST',
    body: formData,
  });
};

// 2. GET /tickets?status=&issue_type_id=
// Who: everyone (CM and admin see all, others see their own)
export const apiGetTickets = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.status && params.status !== 'all') searchParams.append('status', params.status);
  if (params.issue_type_id && params.issue_type_id !== 'all') searchParams.append('issue_type_id', params.issue_type_id);
  if (params.search) searchParams.append('search', params.search);
  if (params.limit) searchParams.append('limit', params.limit);

  const query = searchParams.toString();
  return request(`${API_BASE}/fixit/tickets${query ? `?${query}` : ''}`);
};

// GET /tickets/{id}
export const apiGetTicket = async (ticket_id) => {
  return request(`${API_BASE}/fixit/tickets/${ticket_id}`);
};

// 3. PATCH /tickets/{id} -> Edit (photo, remove_photo=true)
// Who: reporter while open (CM / admin can delete any)
export const apiUpdateTicket = async (ticket_id, formDataOrJson) => {
  const isFormData = formDataOrJson instanceof FormData;
  return request(`${API_BASE}/fixit/tickets/${ticket_id}`, {
    method: 'PATCH',
    body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson),
  });
};

// 3. DELETE /tickets/{id} -> Delete ticket
// Who: reporter while open (CM / admin can delete any)
export const apiDeleteTicket = async (ticket_id) => {
  return request(`${API_BASE}/fixit/tickets/${ticket_id}`, {
    method: 'DELETE',
  });
};

// 4. GET /tickets/{id}/photo -> Download the photo
// Who: reporter, CM, admin
export const downloadComplaintImage = async (target, defaultFilename = 'complaint-image.jpg', type = 'defect') => {
  let ticketId = null;
  if (target && typeof target === 'object' && target.ticket_id) {
    ticketId = target.ticket_id;
  } else if (typeof target === 'string') {
    if (target.startsWith('TKT-') || (!target.includes('/') && !target.includes(':'))) {
      ticketId = target;
    }
  }

  const token = getToken();
  const url = ticketId
    ? `${API_BASE}/fixit/tickets/${ticketId}/photo?type=${type}&download=true`
    : (typeof target === 'string' ? target : '');

  if (!url) return;

  try {
    const res = await fetch(url, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to download photo');
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = ticketId ? `${ticketId}-${type}.jpg` : defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch (err) {
    console.warn('Direct photo fetch fallback:', err);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// 5. PUT /tickets/{id}/status -> { "status": "open" or "resolved", "note" }
// Who: CM
export const apiUpdateTicketStatus = async (ticket_id, { status, note }) => {
  return request(`${API_BASE}/fixit/tickets/${ticket_id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, note }),
  });
};

// 6. POST /tickets/{id}/acknowledge -> Confirm it's fixed and close the ticket
// Who: reporter
export const apiAcknowledgeTicket = async (ticket_id) => {
  return request(`${API_BASE}/fixit/tickets/${ticket_id}/acknowledge`, {
    method: 'POST',
  });
};

// 7. ⭐ PUT /tickets/{id}/tat -> Turnaround time: { "expected_by", "note" }
// The ticket shows overdue: true when the date passes
// Who: CM
export const apiSetTAT = async (ticket_id, { expected_by, note }) => {
  return request(`${API_BASE}/fixit/tickets/${ticket_id}/tat`, {
    method: 'PUT',
    body: JSON.stringify({ expected_by, note }),
  });
};

/* ========================================================
   ISSUE TYPES APIS (/api/v1/fixit/issue-types)
   ======================================================== */

// 8. ⭐ POST /issue-types -> Issue types CRUD: { "name", "description" }
// Who: CM
export const apiCreateIssueType = async ({ name, description }) => {
  return request(`${API_BASE}/fixit/issue-types`, {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
};

// 8. ⭐ PATCH /issue-types/{id} -> Issue types CRUD: { "name", "description" }
// Who: CM
export const apiUpdateIssueType = async (issue_type_id, { name, description }) => {
  return request(`${API_BASE}/fixit/issue-types/${issue_type_id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, description }),
  });
};

// 8. ⭐ DELETE /issue-types/{id} -> Delete issue type
// Who: CM
export const apiDeleteIssueType = async (issue_type_id) => {
  return request(`${API_BASE}/fixit/issue-types/${issue_type_id}`, {
    method: 'DELETE',
  });
};

// 9. ⭐ GET /issue-types & GET /issue-types/{id}
// Who: everyone -> Fetch issue types for the "Raise a ticket" dropdown
export const apiGetIssueTypes = async () => {
  return request(`${API_BASE}/fixit/issue-types`);
};

export const apiGetIssueTypeById = async (id) => {
  return request(`${API_BASE}/fixit/issue-types/${id}`);
};
