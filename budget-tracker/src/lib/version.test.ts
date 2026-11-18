import { describe, expect, it } from 'vitest';
import { isNewerVersion, latestReleaseFor, parseVersion, shouldCheckForUpdate } from './version';

describe('parseVersion', () => {
  it('reads release tags', () => {
    expect(parseVersion('desktop-v1.2.3')).toEqual([1, 2, 3]);
    expect(parseVersion('v10.0.1')).toEqual([10, 0, 1]);
    expect(parseVersion('1.0.0')).toEqual([1, 0, 0]);
    expect(parseVersion('desktop-v1.2')).toBeNull();
    expect(parseVersion('latest')).toBeNull();
  });
});

describe('isNewerVersion', () => {
  it('compares number by number, not as text', () => {
    expect(isNewerVersion('desktop-v1.10.0', '1.9.0')).toBe(true);
    expect(isNewerVersion('desktop-v1.0.1', '1.0.0')).toBe(true);
    expect(isNewerVersion('desktop-v2.0.0', '1.99.99')).toBe(true);
  });
  it('is false for the same or an older version, or nonsense', () => {
    expect(isNewerVersion('desktop-v1.0.0', '1.0.0')).toBe(false);
    expect(isNewerVersion('desktop-v0.9.0', '1.0.0')).toBe(false);
    expect(isNewerVersion('nightly', '1.0.0')).toBe(false);
  });
});

describe('shouldCheckForUpdate', () => {
  const now = new Date('2026-11-12T12:00:00Z');
  it('checks when never checked or a day has passed', () => {
    expect(shouldCheckForUpdate(null, now)).toBe(true);
    expect(shouldCheckForUpdate('2026-11-11T12:00:00Z', now)).toBe(true);
    expect(shouldCheckForUpdate('garbage', now)).toBe(true);
  });
  it('waits otherwise', () => {
    expect(shouldCheckForUpdate('2026-11-12T08:00:00Z', now)).toBe(false);
  });
});

describe('latestReleaseFor', () => {
  const r = (tag: string, extra = {}) => ({ tag_name: tag, html_url: `https://x/${tag}`, ...extra });
  const releases = [
    r('android-v1.1.0'),
    r('desktop-v1.1.0'),
    r('desktop-v1.10.0', { prerelease: true }),
    r('desktop-v1.2.0', { draft: true }),
    r('desktop-v1.0.0'),
    r('android-v1.0.5'),
    r('android-vX'),
  ];

  it('only looks at releases for its own platform', () => {
    expect(latestReleaseFor(releases, 'desktop-v')?.tag_name).toBe('desktop-v1.1.0');
    expect(latestReleaseFor(releases, 'android-v')?.tag_name).toBe('android-v1.1.0');
  });

  it('ignores drafts, pre-releases and unreadable tags', () => {
    expect(latestReleaseFor([r('desktop-v2.0.0', { draft: true }), r('desktop-vnext')], 'desktop-v')).toBeNull();
  });

  it('compares versions, not list order', () => {
    expect(latestReleaseFor([r('android-v1.2.0'), r('android-v1.10.0'), r('android-v1.9.9')], 'android-v')?.tag_name).toBe('android-v1.10.0');
  });
});
