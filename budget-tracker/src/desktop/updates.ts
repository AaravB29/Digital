import { isNewerVersion, shouldCheckForUpdate } from '../lib/version';

export const RELEASES_PAGE = 'https://github.com/AaravB29/Digital/releases';
const LATEST_API = 'https://api.github.com/repos/AaravB29/Digital/releases/latest';
const STORE_KEY = 'budget-tracker-update';

interface Stored {
  checkedAt: string | null;
  latest: { tag: string; url: string } | null;
  dismissed: string | null;
}

function read(): Stored {
  try {
    return { checkedAt: null, latest: null, dismissed: null, ...JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') };
  } catch {
    return { checkedAt: null, latest: null, dismissed: null };
  }
}

function write(s: Stored) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    // Storage blocked: we will simply check again next time.
  }
}

/** The newer release to tell the user about, if any. Asks GitHub at most once a day; quiet when offline. */
export async function findUpdate(current: string): Promise<{ tag: string; url: string } | null> {
  const s = read();
  if (shouldCheckForUpdate(s.checkedAt)) {
    try {
      const res = await fetch(LATEST_API, { headers: { Accept: 'application/vnd.github+json' } });
      if (res.ok) {
        const json = (await res.json()) as { tag_name?: string; html_url?: string };
        s.latest = json.tag_name ? { tag: json.tag_name, url: json.html_url ?? RELEASES_PAGE } : null;
      }
      s.checkedAt = new Date().toISOString();
      write(s);
    } catch {
      // Offline: try again on the next start.
    }
  }
  return s.latest && s.latest.tag !== s.dismissed && isNewerVersion(s.latest.tag, current) ? s.latest : null;
}

export function dismissUpdate(tag: string): void {
  write({ ...read(), dismissed: tag });
}
