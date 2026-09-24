// Audit-only feature detection for the 2020-era browser target (see README).
// These helpers are intentionally not wired into runtime guards: the answer
// queue must keep recoverable entries whenever storage is available, and the
// security provider degrades via native browser behavior instead of skipping
// listeners. They exist for documentation/testing of the support boundary.
const STORAGE_PROBE_KEY = "smeduverse-exam-storage-probe";

export function supportsBeforeUnload(windowLike) {
  try {
    if (windowLike === null || windowLike === undefined) {
      return false;
    }
    return typeof windowLike.addEventListener === "function";
  } catch {
    return false;
  }
}

export function supportsOnlineEvents(windowLike) {
  try {
    if (windowLike === null || windowLike === undefined) {
      return false;
    }
    return typeof windowLike.addEventListener === "function";
  } catch {
    return false;
  }
}

export function supportsLocalStorage(storage) {
  try {
    if (storage === null || storage === undefined) {
      return false;
    }
    if (
      typeof storage.getItem !== "function" ||
      typeof storage.setItem !== "function" ||
      typeof storage.removeItem !== "function"
    ) {
      return false;
    }
    storage.setItem(STORAGE_PROBE_KEY, "1");
    storage.removeItem(STORAGE_PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function supportsSendBeacon(navigatorLike) {
  try {
    if (navigatorLike === null || navigatorLike === undefined) {
      return false;
    }
    return typeof navigatorLike.sendBeacon === "function";
  } catch {
    return false;
  }
}
