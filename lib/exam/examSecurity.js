const EXAM_ROUTE = "/exam";
const RESULT_ROUTE = "/exam/selesai";

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
