// Centralized API Service Layer
// All backend API calls consolidated here for better maintainability
import axiosInstance from '../axiosInstance';

// ============================================
// AUTH SERVICES
// ============================================
export const authService = {
  // User authentication
  register: (userData) => axiosInstance.post('/auth/register', userData),
  login: (credentials) => axiosInstance.post('/auth/login', credentials),
  logout: () => axiosInstance.post('/auth/logout'),
  verifyEmail: (token) => axiosInstance.get(`/auth/verify-email/${token}`),
  forgotPassword: (email) => axiosInstance.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => axiosInstance.post('/auth/reset-password', { token, password }),
  getAuthStatus: () => axiosInstance.get('/auth/status'),
  googleCallback: (code) => axiosInstance.post('/auth/google/callback', { code }),
  
  // Company authentication
  companyRegister: (companyData) => axiosInstance.post('/company/auth/register', companyData),
  companyLogin: (credentials) => axiosInstance.post('/company/auth/login', credentials),
  companyLogout: () => axiosInstance.post('/company/auth/logout'),
  companyVerifyEmail: (token) => axiosInstance.get(`/company/auth/verify-email/${token}`),
  companyForgotPassword: (email) => axiosInstance.post('/company/auth/forgot-password', { email }),
  companyResetPassword: (token, password) => axiosInstance.post('/company/auth/reset-password', { token, password }),
  companyGetAuthStatus: () => axiosInstance.get('/company/auth/status'),
  
  // Admin authentication
  adminLogin: (credentials) => axiosInstance.post('/admin/auth/login', credentials),
  adminLogout: () => axiosInstance.post('/admin/auth/logout'),
};

// ============================================
// USER PROFILE SERVICES
// ============================================
export const userService = {
  getProfile: () => axiosInstance.get('/user/profile'),
  updateProfile: (profileData) => axiosInstance.put('/user/profile', profileData),
  getResumeBuilderProfile: () => axiosInstance.get('/user/profile/resume-builder'),
  uploadPhoto: (formData) => axiosInstance.post('/user/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadResume: (formData) => axiosInstance.post('/user/profile/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadVideo: (formData) => axiosInstance.post('/user/profile/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  parseResume: (formData) => axiosInstance.post('/user/profile/parse-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  generateAbout: (profileData) => axiosInstance.post('/ai/generate-about', profileData),
  getProfileAnalytics: () => axiosInstance.get('/user/profile/analytics'),
};

// ============================================
// JOB SERVICES
// ============================================
export const jobService = {
  // Public job listings
  getAllJobs: (params = {}) => axiosInstance.get('/api/jobs', { params }),
  getJobById: (jobId) => axiosInstance.get(`/api/jobs/${jobId}`),
  searchJobs: (searchParams) => axiosInstance.get('/api/jobs/search', { params: searchParams }),
  
  // Company job management
  createJob: (jobData) => axiosInstance.post('/company/jobs', jobData),
  updateJob: (jobId, jobData) => axiosInstance.put(`/company/jobs/${jobId}`, jobData),
  deleteJob: (jobId) => axiosInstance.delete(`/company/jobs/${jobId}`),
  getCompanyJobs: () => axiosInstance.get('/company/jobs'),
  getCompanyJobById: (jobId) => axiosInstance.get(`/company/jobs/${jobId}`),
  getJobStatsByCompany: () => axiosInstance.get('/company/jobs/stats'),
  
  // Job suggestions
  getJobTitleSuggestions: (query) => axiosInstance.get('/api/job-titles/suggest', { params: { q: query } }),
  
  // Saved jobs
  saveJob: (jobId) => axiosInstance.post('/user/saved-jobs', { jobId }),
  unsaveJob: (jobId) => axiosInstance.delete(`/user/saved-jobs/${jobId}`),
  getSavedJobs: () => axiosInstance.get('/user/saved-jobs'),
};

// ============================================
// APPLICATION SERVICES
// ============================================
export const applicationService = {
  // User applications
  applyToJob: (jobId, coverLetter) => axiosInstance.post('/applications', { jobId, coverLetter }),
  getUserApplications: (params = {}) => axiosInstance.get('/applications', { params }),
  getApplicationById: (applicationId) => axiosInstance.get(`/applications/${applicationId}`),
  withdrawApplication: (applicationId) => axiosInstance.delete(`/applications/${applicationId}`),
  
  // Company application management
  getCompanyApplications: (params = {}) => axiosInstance.get('/company/applications', { params }),
  getApplicationDetails: (applicationId) => axiosInstance.get(`/company/applications/${applicationId}`),
  updateApplicationStatus: (applicationId, status, notes) => 
    axiosInstance.put(`/company/applications/${applicationId}/status`, { status, notes }),
  bulkUpdateApplications: (applicationIds, status) => 
    axiosInstance.post('/company/applications/bulk-update', { applicationIds, status }),
  scheduleInterview: (applicationId, interviewData) => 
    axiosInstance.post(`/company/applications/${applicationId}/interview`, interviewData),
};

// ============================================
// COMPANY SERVICES
// ============================================
export const companyService = {
  // Company profile
  getCompanyProfile: () => axiosInstance.get('/company/profile'),
  updateCompanyProfile: (profileData) => axiosInstance.put('/company/profile', profileData),
  uploadCompanyLogo: (formData) => axiosInstance.post('/company/profile/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Public company data
  getAllCompanies: (params = {}) => axiosInstance.get('/api/companies', { params }),
  getCompanyById: (companyId) => axiosInstance.get(`/api/companies/${companyId}`),
  getCompanyJobs: (companyId) => axiosInstance.get(`/api/companies/${companyId}/jobs`),
  
  // Company dashboard
  getCompanyDashboardStats: () => axiosInstance.get('/company/dashboard/stats'),
};

// ============================================
// NOTIFICATION SERVICES
// ============================================
export const notificationService = {
  getUserNotifications: (params = {}) => axiosInstance.get('/notifications', { params }),
  markAsRead: (notificationId) => axiosInstance.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => axiosInstance.put('/notifications/read-all'),
  deleteNotification: (notificationId) => axiosInstance.delete(`/notifications/${notificationId}`),
  
  getCompanyNotifications: (params = {}) => axiosInstance.get('/company/notifications', { params }),
  markCompanyNotificationAsRead: (notificationId) => axiosInstance.put(`/company/notifications/${notificationId}/read`),
};

// ============================================
// CHAT SERVICES
// ============================================
export const chatService = {
  // User chat
  getUserConversations: () => axiosInstance.get('/chat/conversations'),
  startConversation: (companyId) => axiosInstance.post('/chat/start', { companyId }),
  getMessages: (conversationId, cursor) => {
    const params = cursor ? { cursor } : {};
    return axiosInstance.get(`/chat/${conversationId}/messages`, { params });
  },
  sendMessage: (conversationId, text) => axiosInstance.post(`/chat/${conversationId}/messages`, { text }),
  sendAttachment: (conversationId, formData) => axiosInstance.post(`/chat/${conversationId}/messages`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  markAsRead: (conversationId) => axiosInstance.post(`/chat/${conversationId}/read`, {}),
  
  // Company chat
  getCompanyConversations: () => axiosInstance.get('/company/chat/conversations'),
  getCompanyMessages: (conversationId, cursor) => {
    const params = cursor ? { cursor } : {};
    return axiosInstance.get(`/company/chat/${conversationId}/messages`, { params });
  },
  sendCompanyMessage: (conversationId, text) => axiosInstance.post(`/company/chat/${conversationId}/messages`, { text }),
  sendCompanyAttachment: (conversationId, formData) => axiosInstance.post(`/company/chat/${conversationId}/messages`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  markCompanyAsRead: (conversationId) => axiosInstance.post(`/company/chat/${conversationId}/read`, {}),
};

// ============================================
// INDUSTRY SERVICES
// ============================================
export const industryService = {
  getAllIndustries: () => axiosInstance.get('/api/industries'),
  getIndustryById: (industryId) => axiosInstance.get(`/api/industries/${industryId}`),
};

// ============================================
// ADMIN SERVICES
// ============================================
export const adminService = {
  // Dashboard stats
  getDashboardStats: () => axiosInstance.get('/admin/stats'),
  getUserGrowth: (interval = 'daily') => axiosInstance.get('/admin/user-growth', { params: { interval } }),
  getJobTrends: (interval = 'daily') => axiosInstance.get('/admin/job-trends', { params: { interval } }),
  getJobStats: () => axiosInstance.get('/admin/job-stats'),
  getCompanyStats: () => axiosInstance.get('/admin/company-stats'),
  
  // User management
  getAllUsers: (params = {}) => axiosInstance.get('/admin/users', { params }),
  getUserById: (userId) => axiosInstance.get(`/admin/users/${userId}`),
  updateUser: (userId, userData) => axiosInstance.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => axiosInstance.delete(`/admin/users/${userId}`),
  toggleUserStatus: (userId, isActive) => axiosInstance.put(`/admin/users/${userId}/status`, { isActive }),
  
  // Company management
  getAllCompanies: (params = {}) => axiosInstance.get('/admin/companies', { params }),
  getCompanyDetails: (companyId) => axiosInstance.get(`/admin/companies/${companyId}/details`),
  updateCompany: (companyId, companyData) => axiosInstance.put(`/admin/companies/${companyId}`, companyData),
  deleteCompany: (companyId) => axiosInstance.delete(`/admin/companies/${companyId}`),
  toggleCompanyStatus: (companyId, isActive) => axiosInstance.put(`/admin/companies/${companyId}/status`, { isActive }),
  
  // Job management
  getAllJobs: (params = {}) => axiosInstance.get('/admin/jobs', { params }),
  updateJob: (jobId, jobData) => axiosInstance.put(`/admin/jobs/${jobId}`, jobData),
  deleteJob: (jobId) => axiosInstance.delete(`/admin/jobs/${jobId}`),
  toggleJobStatus: (jobId, isActive) => axiosInstance.put(`/admin/jobs/${jobId}/status`, { isActive }),
  
  // Industry management
  getAllIndustriesAdmin: () => axiosInstance.get('/api/industries/admin/all'),
  createIndustry: (formData) => axiosInstance.post('/api/industries', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateIndustry: (industryId, formData) => axiosInstance.put(`/api/industries/${industryId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteIndustry: (industryId) => axiosInstance.delete(`/api/industries/${industryId}`),
  
  // Audit logs
  getAuditLogs: (params = {}) => axiosInstance.get('/admin/audit-logs', { params }),
};

// ============================================
// SEARCH SERVICES
// ============================================
export const searchService = {
  search: (query, filters = {}) => axiosInstance.get('/api/search', { 
    params: { q: query, ...filters } 
  }),
  saveSearch: (searchQuery) => axiosInstance.post('/user/searches', { query: searchQuery }),
  getSavedSearches: () => axiosInstance.get('/user/searches'),
  deleteSearch: (searchId) => axiosInstance.delete(`/user/searches/${searchId}`),
};

// ============================================
// INTERVIEW SERVICES
// ============================================
export const interviewService = {
  scheduleInterview: (data) => axiosInstance.post('/company/interviews', data),
  getCompanyInterviews: (params = {}) => axiosInstance.get('/company/interviews', { params }),
  getUserInterviews: (params = {}) => axiosInstance.get('/user/interviews', { params }),
  updateInterviewStatus: (interviewId, status) => 
    axiosInstance.put(`/company/interviews/${interviewId}/status`, { status }),
  rescheduleInterview: (interviewId, newDateTime) => 
    axiosInstance.put(`/company/interviews/${interviewId}/reschedule`, { dateTime: newDateTime }),
};

// ============================================
// UTILITY SERVICES
// ============================================
export const utilityService = {
  // Location autocomplete (external API)
  getLocationSuggestions: (query) => {
    // This uses external API, not backend
    return axiosInstance.get(`https://nominatim.openstreetmap.org/search`, {
      params: { q: query, format: 'json', limit: 5 }
    });
  },
  
  // Currency data (external API)
  getCurrencies: () => {
    return axiosInstance.get('https://openexchangerates.org/api/currencies.json', {
      headers: { 'Accept': 'application/json' }
    });
  },
};

// ============================================
// ERROR HANDLING WRAPPER
// ============================================
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    if (status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('user');
      localStorage.removeItem('company');
      window.location.href = '/login';
      return { success: false, message: 'Session expired. Please login again.' };
    }
    
    if (status === 403) {
      return { success: false, message: 'You do not have permission to perform this action.' };
    }
    
    if (status === 404) {
      return { success: false, message: 'Resource not found.' };
    }
    
    if (status === 429) {
      return { success: false, message: 'Too many requests. Please try again later.' };
    }
    
    return { 
      success: false, 
      message: data?.message || data?.error || 'An error occurred. Please try again.' 
    };
  } else if (error.request) {
    // Request made but no response
    return { 
      success: false, 
      message: 'Network error. Please check your internet connection.' 
    };
  } else {
    // Something else happened
    return { 
      success: false, 
      message: error.message || 'An unexpected error occurred.' 
    };
  }
};

// Export all services
export default {
  auth: authService,
  user: userService,
  job: jobService,
  application: applicationService,
  company: companyService,
  notification: notificationService,
  chat: chatService,
  industry: industryService,
  admin: adminService,
  search: searchService,
  interview: interviewService,
  utility: utilityService,
  handleApiError,
};
