import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { NotificationToast } from './components/NotificationToast';
import { ProtectedRoute } from './components/ProtectedRoute';import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { PreviewPage } from './pages/PreviewPage';
import { QuestionsPage } from './pages/QuestionsPage';
import { TestFormPage } from './pages/TestFormPage';
import { useAuthStore } from './store/authStore';

function LoginRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LoginPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <NotificationToast />
      <Routes>        <Route path="/login" element={<LoginRedirect />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tests/new" element={<TestFormPage />} />
          <Route path="/tests/:id/edit" element={<TestFormPage />} />
          <Route path="/tests/:id/questions" element={<QuestionsPage />} />
          <Route path="/tests/:id/preview" element={<PreviewPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
