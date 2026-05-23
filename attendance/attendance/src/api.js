const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getStoredAuth = () => {
  try {
    return JSON.parse(localStorage.getItem('staffnetAuth') || 'null');
  } catch {
    return null;
  }
};

const saveAuth = (auth) => {
  localStorage.setItem('staffnetAuth', JSON.stringify(auth));
};

const clearAuth = () => {
  localStorage.removeItem('staffnetAuth');
};

export const normalizeOtp = (value) =>
  String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 6);

const apiRequest = async (path, options = {}) => {
  const auth = getStoredAuth();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (auth?.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed. Please try again.');
  }

  return data;
};

export const api = {
  getStoredAuth,
  saveAuth,
  clearAuth,
  login: (email, password) => apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  signup: (payload) => apiRequest('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  verifyOtp: (email, otp) => apiRequest('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp: normalizeOtp(otp) }),
  }),
  resendOtp: (email) => apiRequest('/api/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  me: () => apiRequest('/api/auth/me'),
  updateProfile: (payload) => apiRequest('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
  getClasses: () => apiRequest('/api/classes'),
  getMyStudents: () => apiRequest('/api/students/my-class'),
  getAttendanceHistory: () => apiRequest('/api/attendance/history'),
  submitAttendance: (payload) => apiRequest('/api/attendance', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  submitLessonReport: (payload) => apiRequest('/api/lesson-reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
  getLessonReports: () => apiRequest('/api/lesson-reports'),
  getTimetable: () => apiRequest('/api/timetable'),
  getTimetableByClass: (className) => apiRequest(`/api/timetable/class/${className}`),
};
