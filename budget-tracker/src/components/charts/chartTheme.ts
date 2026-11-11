import { useTheme } from '../../hooks/useTheme';

/** Chart colours per theme. Two-series pairs were checked with a colour-blindness validator. */
const LIGHT = {
  spent: '#0d9488', income: '#ea580c', fixed: '#7c3aed', variable: '#0d9488', previous: '#94a3b8',
  grid: '#e2e8f0', axis: '#64748b', surface: '#ffffff', cursor: '#f1f5f9',
};
const DARK: ChartColors = {
  spent: '#0d9488', income: '#ea580c', fixed: '#8b5cf6', variable: '#0d9488', previous: '#64748b',
  grid: '#334155', axis: '#94a3b8', surface: '#0f172a', cursor: '#1e293b',
};

export type ChartColors = typeof LIGHT;

/** Neutral used for the folded "Other" group; reads on both themes. */
export const OTHER_COLOR = '#94a3b8';

export function useChartColors(): ChartColors {
  return useTheme().dark ? DARK : LIGHT;
}

export const axisProps = (c: ChartColors) =>
  ({ stroke: c.grid, tick: { fill: c.axis, fontSize: 12 }, tickLine: false }) as const;
