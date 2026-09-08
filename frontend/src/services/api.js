const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

/**
 * Universal fetch yordamchisi
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'Xatolik yuz berdi');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (phone, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password })
  }),
  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getMe: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // Davomat (Attendance)
  getTodayStatus: () => request('/attendance/today'),
  checkIn: (lat, lng) => request('/attendance/check-in', {
    method: 'POST',
    body: JSON.stringify({ lat, lng })
  }),
  checkOut: (lat, lng) => request('/attendance/check-out', {
    method: 'POST',
    body: JSON.stringify({ lat, lng })
  }),
  getMyHistory: () => request('/attendance/history'),

  // Salomatlik va Sport (Health)
  getTodayHealth: () => request('/health/today'),
  updateWater: (glasses) => request('/health/water', {
    method: 'POST',
    body: JSON.stringify({ glasses })
  }),
  toggleRun200m: (data) => request('/health/run200m', {
    method: 'POST',
    body: JSON.stringify(typeof data === 'object' ? data : { ran: data })
  }),
  toggleLightExercises: (data) => request('/health/light-exercises', {
    method: 'POST',
    body: JSON.stringify(typeof data === 'object' ? data : { done: data })
  }),
  updateSportSession: (data) => request('/health/sport-session', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Boshliq / Admin
  getDashboardStats: () => request('/admin/stats'),
  getEmployees: () => request('/admin/employees'),
  createEmployee: (data) => request('/admin/employees', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateEmployee: (id, data) => request(`/admin/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteEmployee: (id) => request(`/admin/employees/${id}`, {
    method: 'DELETE'
  }),
  getSettings: () => request('/admin/settings'),
  updateSettings: (data) => request('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};
