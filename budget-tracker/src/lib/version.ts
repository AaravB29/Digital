/** "desktop-v1.2.3", "v1.2.3" or "1.2.3" → [1, 2, 3]; null if it is not a version. */
export function parseVersion(tag: string): [number, number, number] | null {
  const m = /^(?:desktop-)?v?(\d+)\.(\d+)\.(\d+)$/.exec(tag.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** True when `latestTag` is a higher version than `current`. Unreadable tags never count as newer. */
export function isNewerVersion(latestTag: string, current: string): boolean {
  const a = parseVersion(latestTag);
  const b = parseVersion(current);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

/** Look for updates at most once a day. */
export function shouldCheckForUpdate(lastCheckedAt: string | null, now: Date = new Date()): boolean {
  if (!lastCheckedAt) return true;
  const last = new Date(lastCheckedAt).getTime();
  return Number.isNaN(last) || now.getTime() - last >= 24 * 60 * 60 * 1000;
}

export interface ReleaseInfo {
  tag_name: string;
  html_url: string;
  draft?: boolean;
  prerelease?: boolean;
}

/**
 * The newest published release whose tag starts with `prefix` (e.g. "android-v"), so the
 * Windows and Android apps each only see their own releases.
 */
export function latestReleaseFor(releases: ReleaseInfo[], prefix: string): ReleaseInfo | null {
  let best: ReleaseInfo | null = null;
  for (const r of releases) {
    if (r.draft || r.prerelease || !r.tag_name.startsWith(prefix)) continue;
    const version = r.tag_name.slice(prefix.length);
    if (!parseVersion(version)) continue;
    if (!best || isNewerVersion(version, best.tag_name.slice(prefix.length))) best = r;
  }
  return best;
}
