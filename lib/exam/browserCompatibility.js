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
