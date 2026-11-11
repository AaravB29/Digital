/** Chart colours. Two-series pairs were checked with a colour-blindness validator. */
export const CHART = {
  spent: '#0d9488',
  income: '#ea580c',
  fixed: '#7c3aed',
  variable: '#0d9488',
  other: '#94a3b8',
  grid: '#e2e8f0',
  axis: '#64748b',
  surface: '#ffffff',
};

export const axisProps = {
  stroke: CHART.grid,
  tick: { fill: CHART.axis, fontSize: 12 },
  tickLine: false,
} as const;
