import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { MonthKey } from '../db/types';
import { isMonthKey } from '../lib/months';

/** The month in the URL (/month/YYYY-MM) plus a way to move to another month. */
export function useMonth(): { month: MonthKey; isValid: boolean; goTo: (month: MonthKey) => void } {
  const { monthKey = '' } = useParams();
  const navigate = useNavigate();
  const goTo = useCallback((month: MonthKey) => navigate(`/month/${month}`), [navigate]);
  return { month: monthKey, isValid: isMonthKey(monthKey), goTo };
}
