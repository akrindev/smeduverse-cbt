const EXAM_ROUTE = "/exam";
const RESULT_ROUTE = "/exam/selesai";

export const WARNING_DEDUPE_MS = 1000;
export const EXAM_GUARD_ABORT_CODE = "EXAM_GUARD_ABORT";
export const EXAM_GUARD_ABORT_MESSAGE =
  "routeChange aborted: exam guard is active";

export function normalizeExamRoute(path) {
  if (typeof path !== "string") return "";
  const withoutQuery = path.split("?")[0].split("#")[0];
  if (withoutQuery.length > 1) return withoutQuery.replace(/\/+$/, "");
  return withoutQuery;
}

export function isExamRouteAllowed(path, { exitAllowed = false } = {}) {
  const normalized = normalizeExamRoute(path);
  if (normalized === EXAM_ROUTE) return true;
  if (normalized === RESULT_ROUTE) return exitAllowed === true;
  return false;
}

export function installBeforeUnload(windowLike, { enabled, onAttempt } = {}) {
  const noop = () => {};
  if (!enabled || !windowLike) return noop;
  if (typeof windowLike.addEventListener !== "function") return noop;
  if (typeof windowLike.removeEventListener !== "function") return noop;

  const handleBeforeUnload = (event) => {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    if (event) {
      event.returnValue = "";
    }
    if (typeof onAttempt === "function") {
      onAttempt();
    }
  };

  windowLike.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    windowLike.removeEventListener("beforeunload", handleBeforeUnload);
  };
}

// Deduplicated warning gate shared by every exit-attempt path (blur,
// visibilitychange, pagehide, blocked router transitions, blocked anchor
// clicks). One exit attempt produces one backend warning call; rapid repeat
// attempts inside the dedupe window are dropped.
export function createWarningGate({
  isEnabled,
  getCallback,
  now = () => Date.now(),
  dedupeMs = WARNING_DEDUPE_MS,
} = {}) {
  let lastWarningAt = 0;

  const recordWarning = () => {
    const enabled =
      typeof isEnabled === "function" ? isEnabled() : isEnabled;
    if (!enabled) {
      return undefined;
    }
    const callback =
      typeof getCallback === "function" ? getCallback() : getCallback;
    if (typeof callback !== "function") {
      return undefined;
    }
    const timestamp = now();
    if (timestamp - lastWarningAt < dedupeMs) {
      return undefined;
    }
    lastWarningAt = timestamp;
    return callback();
  };

  recordWarning.reset = () => {
    lastWarningAt = 0;
  };

  return recordWarning;
}

// Returns true when `url` is blocked and invokes `onBlocked` exactly once per
// call. Callers combine this with `createWarningGate` so storms of blocked
// router/anchor attempts still produce one warning per dedupe window.
export function guardExamNavigation(url, { isAllowed, onBlocked } = {}) {
  const allowed =
    typeof isAllowed === "function"
      ? isAllowed(url)
      : isExamRouteAllowed(url, { exitAllowed: false });
  if (allowed) {
    return false;
  }
  if (typeof onBlocked === "function") {
    onBlocked();
  }
  return true;
}

// Coded abort for blocked programmatic navigation. Next.js Pages Router has
// no cancellable routeChangeStart, so the guard redirects back to /exam and
// throws to abort the in-flight transition; the provider swallows this exact
// token in routeChangeError so it never surfaces as an unhandled exception.
export function createExamGuardAbortError() {
  const error = new Error(EXAM_GUARD_ABORT_MESSAGE);
  error.code = EXAM_GUARD_ABORT_CODE;
  error.cancelled = true;
  return error;
}

export function isExamGuardAbort(error) {
  if (!error || typeof error !== "object") {
    return false;
  }
  return error.code === EXAM_GUARD_ABORT_CODE;
}
