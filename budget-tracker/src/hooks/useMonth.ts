import { useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { MonthKey } from '../db/types';
import { isMonthKey } from '../lib/months';

/** The month in the URL (/month/YYYY-MM) plus a way to move to another month. */
export function useMonth(): { month: MonthKey; isValid: boolean; goTo: (month: MonthKey) => void } {
  const { monthKey = '' } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  // Keep the open tab (?tab=…) when moving between months.
  const goTo = useCallback((month: MonthKey) => navigate(`/month/${month}${search}`), [navigate, search]);
  return { month: monthKey, isValid: isMonthKey(monthKey), goTo };
}
