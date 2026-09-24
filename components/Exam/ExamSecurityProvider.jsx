import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import { ExamSecurityContext } from "../../lib/hooks/useExamSecurity";
import {
  createExamGuardAbortError,
  createWarningGate,
  guardExamNavigation,
  installBeforeUnload,
  isExamRouteAllowed,
  isExamGuardAbort,
} from "../../lib/exam/examSecurity";

export function ExamSecurityProvider({
  enabled,
  sheetId,
  onWarning,
  onWarn,
  children,
}) {
  const router = useRouter();
  const exitAllowedRef = useRef(false);
  const enabledRef = useRef(enabled);
  const warningRef = useRef(onWarning ?? onWarn);
  const sheetIdRef = useRef(sheetId);
  const warningGateRef = useRef(null);
  useEffect(() => {
    warningGateRef.current ??= createWarningGate({
      isEnabled: () => enabledRef.current,
      getCallback: () => warningRef.current,
    });
  }, []);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    warningRef.current = onWarning ?? onWarn;
  });

  // A new exam starts with a locked guard.
  useEffect(() => {
    if (sheetIdRef.current !== sheetId) {
      exitAllowedRef.current = false;
      warningGateRef.current?.reset();
      sheetIdRef.current = sheetId;
    }
  }, [sheetId]);

  // Release the ref state when the provider unmounts.
  useEffect(() => {
    return () => {
      exitAllowedRef.current = false;
    };
  }, []);

  const allowExit = useCallback(() => {
    exitAllowedRef.current = true;
  }, []);

  const recordWarning = useCallback(() => {
    return warningGateRef.current?.();
  }, []);

  // Native reload/close confirmation, installed only while guarded.
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    return installBeforeUnload(window, {
      enabled,
      onAttempt: () => {
        recordWarning();
      },
    });
  }, [enabled, recordWarning]);

  // Router guards, same-origin anchor capture, and warning listeners.
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    if (!enabled) {
      return undefined;
    }

    const isAllowed = (url) =>
      isExamRouteAllowed(url, { exitAllowed: exitAllowedRef.current });

    let handleRouteChangeStart;
    let handleRouteChangeError;
    if (router?.events) {
      // Blocked programmatic navigation records one deduplicated warning,
      // redirects back to /exam, and aborts via the coded guard token (never
      // a bare Error); the routeChangeError handler below swallows it.
      handleRouteChangeStart = (url) => {
        if (
          !guardExamNavigation(url, { isAllowed, onBlocked: recordWarning })
        ) {
          return;
        }
        void router.replace("/exam");
        throw createExamGuardAbortError();
      };
      handleRouteChangeError = (error) => {
        if (isExamGuardAbort(error) || error?.cancelled) {
          return;
        }
        console.error("[exam] Route change failed", error);
      };
      router.events.on("routeChangeStart", handleRouteChangeStart);
      router.events.on("routeChangeError", handleRouteChangeError);
    }

    if (router && typeof router.beforePopState === "function") {
      // Blocked browser back/forward records one deduplicated warning.
      router.beforePopState(({ as } = {}) => {
        return !guardExamNavigation(as, {
          isAllowed,
          onBlocked: recordWarning,
        });
      });
    }

    const handleAnchorClick = (event) => {
      if (!event || event.defaultPrevented) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      if (event.button !== undefined && event.button !== 0) {
        return;
      }
      const anchor = event.target?.closest?.("a[href]");
      if (!anchor) {
        return;
      }
      if (anchor.target === "_blank" || anchor.hasAttribute?.("download")) {
        return;
      }
      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }
      let url;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) {
        return;
      }
      // Blocked same-origin exit links record one deduplicated warning.
      if (
        guardExamNavigation(`${url.pathname}${url.search}${url.hash}`, {
          isAllowed,
          onBlocked: recordWarning,
        })
      ) {
        event.preventDefault();
      }
    };
    document.addEventListener("click", handleAnchorClick, true);

    const handleBlur = () => {
      recordWarning();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" || document.hidden) {
        recordWarning();
      }
    };
    const handlePageHide = () => {
      recordWarning();
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      if (handleRouteChangeStart && router?.events) {
        router.events.off("routeChangeStart", handleRouteChangeStart);
      }
      if (handleRouteChangeError && router?.events) {
        router.events.off("routeChangeError", handleRouteChangeError);
      }
      if (router && typeof router.beforePopState === "function") {
        router.beforePopState(() => true);
      }
      document.removeEventListener("click", handleAnchorClick, true);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [enabled, recordWarning, router]);

  const value = useMemo(
    () => ({ allowExit, recordWarning }),
    [allowExit, recordWarning]
  );

  return (
    <ExamSecurityContext.Provider value={value}>
      {children}
    </ExamSecurityContext.Provider>
  );
}

export default ExamSecurityProvider;
