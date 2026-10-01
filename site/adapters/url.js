/**
 * The URL adapter: the only code that reads or writes the location hash. The
 * encoding itself belongs to the logbook core (core/url.js).
 */
import { decodeHash, encodeSnapshot, encodeTarget } from '../core/url.js';

/** @param {import('../core/framework.js').Framework} fw */
export function readLink(fw) {
  return decodeHash(location.hash, fw);
}

/**
 * Replace the hash with a snapshot, without adding a history entry.
 * @param {import('../core/url.js').Snapshot} snapshot
 */
export function writeSnapshotLink(snapshot) {
  history.replaceState(null, '', `#${encodeSnapshot(snapshot)}`);
}

/**
 * Replace the hash with a target, without adding a history entry.
 * @param {import('../core/logbook.js').Target} target
 */
export function writeTargetLink(target) {
  history.replaceState(null, '', `#${encodeTarget(target)}`);
}

/**
 * The address of a link to a target, without navigating to it.
 * @param {import('../core/logbook.js').Target} target
 */
export function targetLink(target) {
  return `${location.origin}${location.pathname}#${encodeTarget(target)}`;
}

export function clearLink() {
  history.replaceState(null, '', location.pathname + location.search);
}

/**
 * The address of a link to a snapshot, without navigating to it.
 * @param {import('../core/url.js').Snapshot} snapshot
 */
export function snapshotLink(snapshot) {
  return `${location.origin}${location.pathname}#${encodeSnapshot(snapshot)}`;
}

/** Whether the page was opened with a link in its hash. */
export function hasLink() {
  return location.hash.length > 1;
}

/** @param {() => void} callback */
export function onLinkChange(callback) {
  addEventListener('hashchange', callback);
}
