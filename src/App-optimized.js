import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DarkModeProvider } from "./context/DarkModeContext";
import { SocketProvider } from "./context/SocketContext";

// Loading component for suspense fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

// ============================================
// LAZY LOADED COMPONENTS (Code Splitting)
// ============================================

// Public Pages (loaded immediately for better UX)
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";

// User Pages (lazy loaded)
const Profile = lazy(() => import("./pages/Profile"));
const ResumeBuilderAdvanced = lazy(() => import("./pages/ResumeBuilderAdvanced"));
const MyJobsPage = lazy(() => import("./components/MyJobsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const CareerTipsPage = lazy(() => import("./pages/CareerTipsPage"));

// Job Pages (lazy loaded)
const JobList = lazy(() => import("./components/JobList"));
const JobDetails = lazy(() => import("./components/JobDetails"));

// Company Pages (lazy loaded)
const CompanyRegister = lazy(() => import("./components/Company/CompanyRegister"));
const CompanyLogin = lazy(() => import("./components/Company/CompanyLogin"));
const CompanyDashboard = lazy(() => import("./pages/Company/CompanyDashboard"));
const CompanyProfile = lazy(() => import("./pages/Company/CompanyProfile"));
const CompanyProfilePage = lazy(() => import("./pages/CompanyProfilePage"));
const JobPostingPage = lazy(() => import("./pages/Company/JobPostingPage"));
const PostedJobsPage = lazy(() => import("./pages/Company/PostedJobsPage"));
const JobDetailsPage = lazy(() => import("./pages/Company/JobDetailsPage"));
const EditJobPage = lazy(() => import("./pages/Company/EditJobPage"));
const CompanyApplicationsDashboard = lazy(() => import("./pages/Company/CompanyApplicationsDashboard"));
const CompanyNotificationsPage = lazy(() => import("./pages/Company/CompanyNotificationsPage"));
const CompaniesPage = lazy(() => import("./pages/CompaniesPage"));
const CompanyJobsPage = lazy(() => import("./pages/CompanyJobsPage"));
const CompanyChatPage = lazy(() => import("./pages/Company/CompanyChatPage"));
const CompanyVerifyEmail = lazy(() => import("./pages/CompanyVerifyEmail"));
const CompanyForgotPassword = lazy(() => import("./pages/CompanyForgotPassword"));
const CompanyResetPassword = lazy(() => import("./pages/CompanyResetPassword"));

// Admin Pages (lazy loaded)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUserManagement = lazy(() => import("./pages/admin/AdminUserManagement"));
const AdminCompanyManagement = lazy(() => import("./pages/admin/AdminCompanyManagement"));
const AdminJobManagement = lazy(() => import("./pages/admin/AdminJobManagement"));
const AdminIndustryManagement = lazy(() => import("./pages/admin/AdminIndustryManagement"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));

// Auth Components (lazy loaded)
const AuthGoogleCallback = lazy(() => import("./pages/AuthGoogleCallback"));

// Protected Route Components (loaded immediately as they're wrappers)
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <BrowserRouter>
          <SocketProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* ===== PUBLIC ROUTES ===== */}
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<HomePage />} />
                <Route path="/jobs" element={<JobList />} />
                <Route path="/job/:id" element={<JobDetails />} />
                <Route path="/companies" element={<CompaniesPage />} />
                <Route path="/career-tips" element={<CareerTipsPage />} />
                <Route path="/company/jobs/:companyId" element={<CompanyJobsPage />} />
                <Route path="/company/profile/:id" element={<CompanyProfilePage />} />

                {/* ===== USER PROTECTED ROUTES ===== */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute type="user">
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/resume-builder"
                  element={
                    <ProtectedRoute type="user">
                      <ResumeBuilderAdvanced />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-jobs"
                  element={
                    <ProtectedRoute type="user">
                      <MyJobsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute type="user">
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute type="user">
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />

                {/* ===== COMPANY ROUTES ===== */}
                <Route path="/company/register" element={<CompanyRegister />} />
                <Route path="/company/login" element={<CompanyLogin />} />
                <Route path="/company/verify-email" element={<CompanyVerifyEmail />} />
                <Route path="/company/forgot-password" element={<CompanyForgotPassword />} />
                <Route path="/company/reset-password" element={<CompanyResetPassword />} />

                {/* ===== COMPANY PROTECTED ROUTES ===== */}
                <Route
                  path="/company"
                  element={
                    <ProtectedRoute type="company">
                      <CompanyDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/profile"
                  element={
                    <ProtectedRoute type="company">
                      <CompanyProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/jobs"
                  element={
                    <ProtectedRoute type="company">
                      <JobPostingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/posted-jobs"
                  element={
                    <ProtectedRoute type="company">
                      <PostedJobsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/notifications"
                  element={
                    <ProtectedRoute type="company">
                      <CompanyNotificationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company-jobs/:jobId"
                  element={
                    <ProtectedRoute type="company">
                      <JobDetailsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/jobs/:jobId/edit"
                  element={
                    <ProtectedRoute type="company">
                      <EditJobPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/applications"
                  element={
                    <ProtectedRoute type="company">
                      <CompanyApplicationsDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/company/chat"
                  element={
                    <ProtectedRoute type="company">
                      <CompanyChatPage />
                    </ProtectedRoute>
                  }
                />

                {/* ===== ADMIN ROUTES ===== */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminProtectedRoute>
                      <AdminUserManagement />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/companies"
                  element={
                    <AdminProtectedRoute>
                      <AdminCompanyManagement />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/jobs"
                  element={
                    <AdminProtectedRoute>
                      <AdminJobManagement />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/industries"
                  element={
                    <AdminProtectedRoute>
                      <AdminIndustryManagement />
                    </AdminProtectedRoute>
                  }
                />
                <Route
                  path="/admin/audit-logs"
                  element={
                    <AdminProtectedRoute>
                      <AdminAuditLogs />
                    </AdminProtectedRoute>
                  }
                />

                {/* ===== AUTH CALLBACKS ===== */}
                <Route path="/auth/google/callback" element={<AuthGoogleCallback />} />

                {/* ===== FALLBACK ===== */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </SocketProvider>
        </BrowserRouter>
      </DarkModeProvider>
    </AuthProvider>
  );
}

export default App;
