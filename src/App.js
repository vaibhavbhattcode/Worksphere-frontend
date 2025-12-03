import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DarkModeProvider } from "./context/DarkModeContext";
import { SocketProvider } from "./context/SocketContext";
import Register from "./pages/Register";
import Login from "./pages/Login";
import HomePage from "./pages/HomePage";
import Profile from "./pages/Profile";
import ResumeBuilderAdvanced from "./pages/ResumeBuilderAdvanced";
import CompanyRegister from "./components/Company/CompanyRegister";
import CompanyLogin from "./components/Company/CompanyLogin";
import CompanyDashboard from "./pages/Company/CompanyDashboard";
import CompanyProfile from "./pages/Company/CompanyProfile";
import CompanyProfilePage from "./pages/CompanyProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import JobPostingPage from "./pages/Company/JobPostingPage";
import PostedJobsPage from "./pages/Company/PostedJobsPage";
import JobDetailsPage from "./pages/Company/JobDetailsPage";
import EditJobPage from "./pages/Company/EditJobPage";
import JobList from "./components/JobList";
import JobDetails from "./components/JobDetails";
import MyJobsPage from "./components/MyJobsPage";
import CompanyApplicationsDashboard from "./pages/Company/CompanyApplicationsDashboard";
import CompanyNotificationsPage from "./pages/Company/CompanyNotificationsPage";
import CompaniesPage from "./pages/CompaniesPage";
import CompanyJobsPage from "./pages/CompanyJobsPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import AdminCompanyManagement from "./pages/admin/AdminCompanyManagement";
import AdminJobManagement from "./pages/admin/AdminJobManagement";
import AdminIndustryManagement from "./pages/admin/AdminIndustryManagement";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import CompanyVerifyEmail from "./pages/CompanyVerifyEmail";
import CompanyForgotPassword from "./pages/CompanyForgotPassword";
import CompanyResetPassword from "./pages/CompanyResetPassword";
import NotificationsPage from "./pages/NotificationsPage";
import CareerTipsPage from "./pages/CareerTipsPage";
import ChatPage from "./pages/ChatPage";
import CompanyChatPage from "./pages/Company/CompanyChatPage";
import AuthGoogleCallback from "./pages/AuthGoogleCallback";

function App() {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <BrowserRouter>
          <SocketProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/jobs" element={<JobList />} />
              <Route path="/job/:id" element={<JobDetails />} />
              <Route path="/companies" element={<CompaniesPage />} />
              <Route path="/career-tips" element={<CareerTipsPage />} />
              <Route path="/company/jobs/:companyId" element={<CompanyJobsPage />} />
              <Route path="/company/profile/:id" element={<CompanyProfilePage />} />

              {/* User Protected Routes */}
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

              {/* Company Routes */}
              <Route path="/company/register" element={<CompanyRegister />} />
              <Route path="/company/login" element={<CompanyLogin />} />
              <Route
                path="/company/verify-email"
                element={<CompanyVerifyEmail />}
              />
              <Route
                path="/company/forgot-password"
                element={<CompanyForgotPassword />}
              />
              <Route
                path="/company/reset-password"
                element={<CompanyResetPassword />}
              />
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
              {/* New Company Applications Dashboard */}
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
              {/* Admin Routes */}
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
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/audit-logs"
                element={
                  <AdminProtectedRoute>
                    <AdminAuditLogs />
                  </AdminProtectedRoute>
                }
              />
              {/* Google OAuth callback for jobseekers */}
              <Route path="/auth/google/callback" element={<AuthGoogleCallback />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SocketProvider>
        </BrowserRouter>
      </DarkModeProvider>
    </AuthProvider>
  );
}

export default App;
