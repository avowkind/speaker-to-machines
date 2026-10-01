/**
 * Logbook dates are "YYYY-MM" or "YYYY-MM-DD" strings. A year-month compares
 * as the first of that month.
 */

const DATE = /^(\d{4})-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/;

/**
 * @param {unknown} s
 * @returns {s is string}
 */
export function isDate(s) {
  if (typeof s !== 'string') return false;
  const m = DATE.exec(s);
  if (!m) return false;
  if (!m[3]) return true;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCDate() === Number(m[3]);
}

/**
 * Days since the epoch, for comparisons.
 * @param {string} s a logbook date
 */
export function dayNumber(s) {
  const [y, m, d = '01'] = s.split('-');
  return Date.UTC(Number(y), Number(m) - 1, Number(d)) / 86_400_000;
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number} negative if a is earlier than b, 0 if the same day, positive if later
 */
export function compareDates(a, b) {
  return dayNumber(a) - dayNumber(b);
}

/**
 * The date a number of calendar months later (or earlier, if negative), as
 * YYYY-MM-DD, clamped to the end of a shorter month.
 * @param {string} s
 * @param {number} months
 */
export function addMonths(s, months) {
  const [y, m, d = '01'] = s.split('-').map(Number);
  const total = y * 12 + (m - 1) + months;
  const year = Math.floor(total / 12);
  const month = total - year * 12;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return toIsoDate(new Date(Date.UTC(year, month, Math.min(Number(d), last))));
}

/**
 * @param {Date} date
 * @returns {string} YYYY-MM-DD in UTC
 */
function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Today's date where the person is, as YYYY-MM-DD.
 * @param {Date} [now]
 */
export function localToday(now = new Date()) {
  const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
