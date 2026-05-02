import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-loaded feature pages
const Login = lazy(() => import('./features/auth/LoginPage'));
const BranchSelection = lazy(() => import('./features/auth/BranchSelectionPage'));
const OfficeSelection = lazy(() => import('./features/auth/OfficeSelectionPage'));
const Dashboard = lazy(() => import('./features/dashboard/DashboardPage'));
const CaseList = lazy(() => import('./features/cases/CaseListPage'));
const CaseForm = lazy(() => import('./features/cases/CaseFormPage'));
const CaseDetail = lazy(() => import('./features/cases/CaseDetailPage'));
const NoticeEditor = lazy(() => import('./features/notices/NoticeEditorPage'));
const PendingReviewList = lazy(() => import('./features/review/PendingReviewList'));
const ReviewPage = lazy(() => import('./features/review/ReviewPage'));
const NoticeRegistry = lazy(() => import('./features/registry/NoticeRegistryPage'));
const AuditLog = lazy(() => import('./features/registry/AuditLogPage'));
const VersionCompare = lazy(() => import('./features/registry/VersionCompare'));
const VersionHistory = lazy(() => import('./features/registry/VersionHistory'));
const Settings = lazy(() => import('./features/branch/SettingsPage'));
const Users = lazy(() => import('./features/users/UserListPage'));
const BranchSetupWizard = lazy(() => import('./features/onboarding/BranchSetupWizard'));
const InviteSignupPage = lazy(() => import('./features/onboarding/InviteSignupPage'));
const AppBanksView = lazy(() => import('./features/app-admin/AppBanksView'));
const AppBankDetailView = lazy(() => import('./features/app-admin/AppBankDetailView'));
const SubtreeView = lazy(() => import('./features/bank-oversight/SubtreeView'));
const BranchOversightView = lazy(() => import('./features/bank-oversight/BranchOversightView'));
const SsoCallback = lazy(() => import('./features/auth/SsoCallbackPage'));

function Loading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>
        <Route path="/invite/:token" element={<InviteSignupPage />} />
        <Route path="/sso/callback" element={<SsoCallback />} />

        {/* Authenticated but no office required */}
        <Route path="/offices" element={<OfficeSelection />} />
        <Route path="/branches" element={<BranchSelection />} />
        <Route path="/onboarding" element={<BranchSetupWizard />} />

        {/* Protected routes (require auth + branch) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cases" element={<CaseList />} />
            <Route path="/cases/new" element={<CaseForm />} />
            <Route path="/cases/:caseId" element={<CaseDetail />} />
            <Route path="/cases/:caseId/edit" element={<CaseForm />} />
            <Route path="/notices/new" element={<NoticeEditor />} />
            <Route path="/notices/:noticeId/edit" element={<NoticeEditor />} />
            <Route path="/notices/:noticeId/review" element={<ReviewPage />} />
            <Route path="/review" element={<PendingReviewList />} />
            <Route path="/registry" element={<NoticeRegistry />} />
            <Route path="/registry/compare" element={<VersionCompare />} />
            <Route path="/registry/versions" element={<VersionHistory />} />
            <Route path="/audit-logs" element={<AuditLog />} />
            <Route path="/users" element={<Users />} />
            <Route
              path="/banks"
              element={
                <ProtectedRoute userKind="app">
                  <AppBanksView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/banks/:bankRootId"
              element={
                <ProtectedRoute userKind="app">
                  <AppBankDetailView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bank-tree"
              element={
                <ProtectedRoute userKind="bank">
                  <SubtreeView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bank-tree/:branchId"
              element={
                <ProtectedRoute userKind="bank">
                  <BranchOversightView />
                </ProtectedRoute>
              }
            />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/offices" replace />} />
      </Routes>
    </Suspense>
  );
}
