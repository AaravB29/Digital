import { isNewerVersion, latestReleaseFor, shouldCheckForUpdate, type ReleaseInfo } from '../lib/version';

const RELEASES_API = 'https://api.github.com/repos/AaravB29/Digital/releases?per_page=30';

interface Stored {
  checkedAt: string | null;
  latest: { tag: string; url: string } | null;
  dismissed: string | null;
}

const EMPTY: Stored = { checkedAt: null, latest: null, dismissed: null };
const key = (prefix: string) => `budget-tracker-update:${prefix}`;

function read(prefix: string): Stored {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(key(prefix)) ?? '{}') };
  } catch {
    return { ...EMPTY };
  }
}

function write(prefix: string, s: Stored) {
  try {
    localStorage.setItem(key(prefix), JSON.stringify(s));
  } catch {
    // Storage blocked: we will simply check again next time.
  }
}

/**
 * The newer release for this platform to tell the user about, if any.
 * Asks GitHub at most once a day and stays quiet when offline.
 */
export async function findUpdate(current: string, prefix: string): Promise<{ tag: string; url: string } | null> {
  const s = read(prefix);
  if (shouldCheckForUpdate(s.checkedAt)) {
    try {
      const res = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } });
      if (res.ok) {
        const latest = latestReleaseFor((await res.json()) as ReleaseInfo[], prefix);
        s.latest = latest ? { tag: latest.tag_name, url: latest.html_url } : null;
        s.checkedAt = new Date().toISOString();
        write(prefix, s);
      }
    } catch {
      // Offline: try again on the next start.
    }
  }
  return s.latest && s.latest.tag !== s.dismissed && isNewerVersion(s.latest.tag.slice(prefix.length), current) ? s.latest : null;
}

export function dismissUpdate(prefix: string, tag: string): void {
  write(prefix, { ...read(prefix), dismissed: tag });
}
