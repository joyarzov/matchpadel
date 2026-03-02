import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const MatchesListPage = lazy(() => import('@/pages/MatchesListPage'));
const CreateMatchPage = lazy(() => import('@/pages/CreateMatchPage'));
const MatchDetailPage = lazy(() => import('@/pages/MatchDetailPage'));
const MyMatchesPage = lazy(() => import('@/pages/MyMatchesPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const EditMatchPage = lazy(() => import('@/pages/EditMatchPage'));
const ChangePasswordPage = lazy(() => import('@/pages/ChangePasswordPage'));
const AvailabilityPage = lazy(() => import('@/pages/AvailabilityPage'));
const RankingPage = lazy(() => import('@/pages/RankingPage'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const ClubsManagement = lazy(() => import('@/pages/admin/ClubsManagement'));
const CourtsManagement = lazy(() => import('@/pages/admin/CourtsManagement'));
const UsersManagement = lazy(() => import('@/pages/admin/UsersManagement'));
const MatchesOverview = lazy(() => import('@/pages/admin/MatchesOverview'));

function LoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export default function AppRouter() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/matches" element={<MatchesListPage />} />
          <Route path="/matches/create" element={<CreateMatchPage />} />
          <Route path="/matches/:id" element={<MatchDetailPage />} />
          <Route path="/matches/:id/edit" element={<EditMatchPage />} />
          <Route path="/my-matches" element={<MyMatchesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/availability" element={<AvailabilityPage />} />
          <Route path="/ranking" element={<RankingPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/clubs" element={<ClubsManagement />} />
          <Route path="/admin/courts" element={<CourtsManagement />} />
          <Route path="/admin/users" element={<UsersManagement />} />
          <Route path="/admin/matches" element={<MatchesOverview />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
