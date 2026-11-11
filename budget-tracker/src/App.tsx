import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { currentMonthKey } from './lib/months';
import Layout from './components/Layout';
import MonthPage from './pages/MonthPage';
import SettingsPage from './pages/SettingsPage';

// The charts library is large, so Trends loads only when it is opened.
const TrendsPage = lazy(() => import('./pages/TrendsPage'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to={`/month/${currentMonthKey()}`} replace />} />
        <Route path="month" element={<Navigate to={`/month/${currentMonthKey()}`} replace />} />
        <Route path="month/:monthKey" element={<MonthPage />} />
        <Route
          path="trends"
          element={
            <Suspense fallback={<p className="text-slate-500">Loading charts…</p>}>
              <TrendsPage />
            </Suspense>
          }
        />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
