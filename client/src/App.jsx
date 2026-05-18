import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import PageLoader from './shared/components/PageLoader';
import AppLayout from './shared/layouts/AppLayout';
import AuthLayout from './shared/layouts/AuthLayout';
import { useAuthStore } from './features/auth/authStore';
import { useAuthBootstrap } from './features/auth/hooks/useAuth';

const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('./features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./features/auth/pages/ResetPasswordPage'));
const ChatPage = lazy(() => import('./features/chat/pages/ChatPage'));
const CreateRoomPage = lazy(() => import('./features/rooms/pages/CreateRoomPage'));
const AnonRoomPage = lazy(() => import('./features/rooms/pages/AnonRoomPage'));
const StatusPage = lazy(() => import('./features/status/pages/StatusPage'));
const ProfilePage = lazy(() => import('./features/profile/pages/ProfilePage'));
const EditProfilePage = lazy(() => import('./features/profile/pages/EditProfilePage'));
const NotFoundPage = lazy(() => import('./shared/pages/NotFoundPage'));

function ProtectedRoute() {
  const { user, initialized } = useAuthStore();

  if (!initialized) {
    return <PageLoader label="Preparing your chats" />;
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}

function ProfessionalRoute() {
  const { user, initialized } = useAuthStore();

  if (!initialized) {
    return <PageLoader label="Preparing your workspace" />;
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (user.role !== 'professional') {
    return <Navigate replace to="/chat" />;
  }

  return <Outlet />;
}

export default function App() {
  useAuthBootstrap();

  return (
    <Suspense
      fallback={<PageLoader />}
    >
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/rooms/new" element={<CreateRoomPage />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<EditProfilePage />} />
            <Route element={<ProfessionalRoute />}>
              <Route path="/professional" element={<Navigate replace to="/rooms/new" />} />
            </Route>
          </Route>
        </Route>

        <Route path="/room/:code" element={<AnonRoomPage />} />
        <Route path="/" element={<Navigate replace to="/chat" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
