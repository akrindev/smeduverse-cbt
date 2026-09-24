import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import { ExamSecurityContext } from "../../lib/hooks/useExamSecurity";
import {
  installBeforeUnload,
  isExamRouteAllowed,
} from "../../lib/exam/examSecurity";

const WARNING_DEDUPE_MS = 1000;

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
  const lastWarningAtRef = useRef(0);

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
      lastWarningAtRef.current = 0;
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
    if (!enabledRef.current) {
      return undefined;
    }
    const callback = warningRef.current;
    if (typeof callback !== "function") {
      return undefined;
    }
    const now = Date.now();
    if (now - lastWarningAtRef.current < WARNING_DEDUPE_MS) {
      return undefined;
    }
    lastWarningAtRef.current = now;
    return callback();
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
    if (router?.events) {
      handleRouteChangeStart = (url) => {
        if (isAllowed(url)) {
          return;
        }
        void router.replace("/exam");
        throw new Error("routeChange aborted: exam guard is active");
      };
      router.events.on("routeChangeStart", handleRouteChangeStart);
    }

    if (router && typeof router.beforePopState === "function") {
      router.beforePopState(({ as } = {}) => {
        if (isAllowed(as)) {
          return true;
        }
        return false;
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
      if (isAllowed(`${url.pathname}${url.search}${url.hash}`)) {
        return;
      }
      event.preventDefault();
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
