// Frontend API Client for आवाज (Avaaj) - CampusOS Track 4 FixIt

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

// Auth API
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

export const apiGetMyProfile = async () => {
  return request(`${API_BASE}/users/me`);
};

export const apiGetAdminProfile = async () => {
  return request(`${API_BASE}/admin/me`);
};

// FixIt Tickets API
export const apiGetTickets = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.append('status', params.status);
  if (params.issue_type_id) searchParams.append('issue_type_id', params.issue_type_id);
  if (params.mine) searchParams.append('mine', params.mine);
  if (params.search) searchParams.append('search', params.search);
  if (params.limit) searchParams.append('limit', params.limit);

  const query = searchParams.toString();
  return request(`${API_BASE}/fixit/tickets${query ? `?${query}` : ''}`);
};

export const apiGetTicket = async (ticket_id) => {
  return request(`${API_BASE}/fixit/tickets/${ticket_id}`);
};

export const apiTrackTicket = async (ticket_id) => {
  return request(`${API_BASE}/fixit/tickets/track/${encodeURIComponent(ticket_id)}`);
};

export const apiCreateTicket = async (formData) => {
  return request(`${API_BASE}/fixit/tickets`, {
    method: 'POST',
    body: formData,
  });
};

export const apiUpdateTicketStatus = async (ticket_id, formDataOrJson) => {
  const isFormData = formDataOrJson instanceof FormData;
  return request(`${API_BASE}/fixit/tickets/${ticket_id}/status`, {
    method: 'PUT',
    body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson),
  });
};

export const apiAcknowledgeTicket = async (ticket_id) => {
  return request(`${API_BASE}/fixit/tickets/${ticket_id}/acknowledge`, {
    method: 'POST',
  });
};

export const apiSetTAT = async (ticket_id, { expected_by, note }) => {
  return request(`${API_BASE}/fixit/tickets/${ticket_id}/tat`, {
    method: 'PUT',
    body: JSON.stringify({ expected_by, note }),
  });
};

export const apiAssignTicket = async (ticket_id, cm_email) => {
  return request(`${API_BASE}/fixit/tickets/${ticket_id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ cm_email }),
  });
};

export const apiDeleteTicket = async (ticket_id) => {
  return request(`${API_BASE}/fixit/tickets/${ticket_id}`, {
    method: 'DELETE',
  });
};

// Issue Types API
export const apiGetIssueTypes = async () => {
  return request(`${API_BASE}/fixit/issue-types`);
};

export const apiCreateIssueType = async ({ name, description }) => {
  return request(`${API_BASE}/fixit/issue-types`, {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  });
};

export const apiDeleteIssueType = async (issue_type_id) => {
  return request(`${API_BASE}/fixit/issue-types/${issue_type_id}`, {
    method: 'DELETE',
  });
};

// Admin API
export const apiGetAdminStats = async () => {
  return request(`${API_BASE}/admin/stats`);
};

export const apiGetAdminUsers = async (role = '') => {
  return request(`${API_BASE}/admin/users${role ? `?role=${role}` : ''}`);
};

export const apiCreateAdminUser = async (userData) => {
  return request(`${API_BASE}/admin/users`, {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const apiDeleteAdminUser = async (email_id) => {
  return request(`${API_BASE}/admin/users/${email_id}`, {
    method: 'DELETE',
  });
};

// Notifications API
export const apiGetNotifications = async (email = '') => {
  return request(`${API_BASE}/notifications${email ? `?email=${email}` : ''}`);
};

export const apiMarkNotificationRead = async (id) => {
  return request(`${API_BASE}/notifications/${id}/read`, {
    method: 'POST',
  });
};

// Feedback API
export const apiGetFeedbacks = async () => {
  return request(`${API_BASE}/feedbacks`);
};

export const apiSubmitFeedback = async (data) => {
  return request(`${API_BASE}/feedbacks`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
