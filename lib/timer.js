/**
 * Calculates elapsed seconds from a session stored in localStorage.
 *
 * Session shape:
 * {
 *   startTimestamp: number,   // ms since epoch when session started (or last resumed)
 *   accumulatedMs: number,    // ms accumulated before the current run
 *   paused: boolean,
 *   hourlyRate: number,
 * }
 */

export const STORAGE_KEY = "wthb_session";

/** Returns a blank session */
export function blankSession(hourlyRate) {
  return {
    startTimestamp: null,
    accumulatedMs: 0,
    paused: true,
    hourlyRate,
  };
}

/** Total elapsed milliseconds for a session (handles paused state) */
export function elapsedMs(session) {
  if (!session.startTimestamp || session.paused) {
    return session.accumulatedMs;
  }
  return session.accumulatedMs + (Date.now() - session.startTimestamp);
}

/** Elapsed seconds (integer) */
export function elapsedSeconds(session) {
  return Math.floor(elapsedMs(session) / 1000);
}

/** Earnings in PHP given session */
export function calculateEarnings(session) {
  const seconds = elapsedSeconds(session);
  const perSecond = session.hourlyRate / 3600;
  return seconds * perSecond;
}

/** Format earnings as ₱ string */
export function formatEarnings(amount) {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format elapsed seconds as "Xh Ym Zs" or "Ym Zs" or "Zs" */
export function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Short format for motivation fragments: "Xh Ym" or "Ym" or "Xs" */
export function formatTimeShort(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

/** Load session from localStorage. Returns null if none exists. */
export function loadSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Persist session to localStorage */
export function saveSession(session) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/** Clear session from localStorage */
export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
