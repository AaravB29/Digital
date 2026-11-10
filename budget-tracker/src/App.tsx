import { Navigate, Route, Routes } from 'react-router-dom';
import { currentMonthKey } from './lib/months';
import Layout from './components/Layout';
import MonthPage from './pages/MonthPage';
import TrendsPage from './pages/TrendsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to={`/month/${currentMonthKey()}`} replace />} />
        <Route path="month" element={<Navigate to={`/month/${currentMonthKey()}`} replace />} />
        <Route path="month/:monthKey" element={<MonthPage />} />
        <Route path="trends" element={<TrendsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
