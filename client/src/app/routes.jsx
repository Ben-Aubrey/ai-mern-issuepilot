import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../features/auth/LoginPage.jsx';
import { useAuth } from '../features/auth/useAuth.js';
import { ProtectedRoute } from '../features/auth/ProtectedRoute.jsx';
import RegisterPage from '../features/auth/RegisterPage.jsx';

function HomePage() {
  const { user, logout } = useAuth();
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <section className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">IssuePilot</p>
        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">You’re signed in, {user.name}.</h1>
        <p className="mt-3 text-slate-400">Your account is ready. More workspace features are coming in later milestones.</p>
        <button className="mt-8 rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800" onClick={() => logout()}>
          Sign out
        </button>
      </section>
    </main>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
