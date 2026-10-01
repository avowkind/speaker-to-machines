/**
 * The storage adapter: the only code that touches localStorage. It holds one
 * logbook per browser, when it was last exported, and whether it has changed
 * since. Nothing here is ever sent anywhere (ADR 0002).
 */

const KEY = 'speaker-to-machines/logbook';

/**
 * @typedef {{ logbook: import('../core/logbook.js').Logbook | null, lastExported: string | null, unexported: boolean }} Stored
 */

/** @returns {Stored} */
export function load() {
  const empty = { logbook: null, lastExported: null, unexported: false };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const data = JSON.parse(raw);
    return {
      logbook: data.logbook ?? null,
      lastExported: data.lastExported ?? null,
      unexported: Boolean(data.unexported),
    };
  } catch {
    return empty;
  }
}

/** @param {Stored} stored */
function write(stored) {
  localStorage.setItem(KEY, JSON.stringify(stored));
}

/**
 * Save the logbook after a change, marking it as not yet exported.
 * @param {import('../core/logbook.js').Logbook} logbook
 * @returns {Stored}
 */
export function saveLogbook(logbook) {
  const stored = { ...load(), logbook, unexported: true };
  write(stored);
  return stored;
}

/**
 * Save a logbook that matches a file the person holds: just imported or exported.
 * @param {import('../core/logbook.js').Logbook} logbook
 * @param {string} when an ISO timestamp
 * @returns {Stored}
 */
export function saveExported(logbook, when) {
  const stored = { logbook, lastExported: when, unexported: false };
  write(stored);
  return stored;
}

export function clear() {
  localStorage.removeItem(KEY);
}
