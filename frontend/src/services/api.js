import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized, clear token
      localStorage.removeItem('campus_token');
      localStorage.removeItem('campus_user');
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authApi = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

// Student Services
export const studentApi = {
  getDashboard: async () => {
    const res = await api.get('/student/dashboard');
    return res.data;
  },
  getAttendance: async () => {
    const res = await api.get('/student/attendance');
    return res.data;
  },
  getAssignments: async () => {
    const res = await api.get('/student/assignments');
    return res.data;
  },
  createAssignment: async (assignmentData) => {
    const res = await api.post('/student/assignments', assignmentData);
    return res.data;
  },
  toggleAssignment: async (id) => {
    const res = await api.patch(`/student/assignments/${id}/toggle`);
    return res.data;
  },
  deleteAssignment: async (id) => {
    const res = await api.delete(`/student/assignments/${id}`);
    return res.data;
  },
  getTimetable: async () => {
    const res = await api.get('/student/timetable');
    return res.data;
  },
  getExams: async () => {
    const res = await api.get('/student/exams');
    return res.data;
  },
};

// Support Ticket Services
export const ticketApi = {
  getTickets: async () => {
    const res = await api.get('/tickets');
    return res.data;
  },
  createTicket: async (ticketData) => {
    const res = await api.post('/tickets', ticketData);
    return res.data;
  },
  updateTicket: async (id, updateData) => {
    const res = await api.patch(`/tickets/${id}`, updateData);
    return res.data;
  },
};

// Chat & Hybrid RAG Assistant Services
export const chatApi = {
  sendMessage: async (message, history = []) => {
    const res = await api.post('/chat', { message, history });
    return res.data;
  },
};

// Admin Services
export const adminApi = {
  getDocuments: async () => {
    const res = await api.get('/admin/documents');
    return res.data;
  },
  uploadDocument: async (formData) => {
    const res = await api.post('/admin/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  deleteDocument: async (id) => {
    const res = await api.delete(`/admin/documents/${id}`);
    return res.data;
  },
};

export default api;
