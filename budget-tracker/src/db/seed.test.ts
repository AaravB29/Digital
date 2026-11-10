import { describe, expect, it } from 'vitest';
import { buildSeedData, FIXED_CATEGORY_ID } from './seed';

describe('buildSeedData', () => {
  const seed = buildSeedData('2026-11');

  it('creates the Fixed category plus nine variable ones', () => {
    expect(seed.categories).toHaveLength(10);
    const fixed = seed.categories.filter((c) => c.isFixed);
    expect(fixed.map((c) => c.id)).toEqual([FIXED_CATEGORY_ID]);
    expect(seed.categories.map((c) => c.name)).toContain('Health & Pharmacy');
  });

  it('gives categories unique ids and sequential sort order', () => {
    expect(new Set(seed.categories.map((c) => c.id)).size).toBe(10);
    expect(seed.categories.map((c) => c.sortOrder)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('creates rent, health insurance and three subscriptions at €0 from the start month', () => {
    expect(seed.fixedTemplates.map((t) => t.name)).toEqual([
      'Rent', 'Health Insurance', 'Mobile plan', 'Spotify', 'Netflix',
    ]);
    for (const t of seed.fixedTemplates) {
      expect(t.defaultAmount).toBe(0);
      expect(t.dayOfMonth).toBe(1);
      expect(t.activeFrom).toBe('2026-11');
      expect(t.activeUntil).toBeUndefined();
    }
  });

  it('defaults to EUR in German formatting', () => {
    expect(seed.settings).toMatchObject({ currency: 'EUR', locale: 'de-DE', startOfMonthDay: 1 });
  });
});
