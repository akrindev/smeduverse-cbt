import { describe, expect, test } from "bun:test";
import {
  createExamGuardAbortError,
  createWarningGate,
  guardExamNavigation,
  installBeforeUnload,
  isExamGuardAbort,
  isExamRouteAllowed,
} from "./examSecurity";

describe("exam security policy", () => {
  test("blocks dashboard and unknown routes during an active exam", () => {
    expect(isExamRouteAllowed("/dashboard")).toBe(false);
    expect(isExamRouteAllowed("/exam/other")).toBe(false);
  });

  test("allows the exam route and only releases the result route after exit approval", () => {
    expect(isExamRouteAllowed("/exam")).toBe(true);
    expect(isExamRouteAllowed("/exam/selesai")).toBe(false);
    expect(isExamRouteAllowed("/exam/selesai", { exitAllowed: true })).toBe(true);
  });

  test("sets returnValue for native beforeunload confirmation", () => {
    const listeners = {};
    const fakeWindow = {
      addEventListener: (name, handler) => (listeners[name] = handler),
      removeEventListener: (name) => delete listeners[name],
    };
    const cleanup = installBeforeUnload(fakeWindow, { enabled: true, onAttempt: () => {} });
    const event = { preventDefault: () => {}, returnValue: undefined };
    listeners.beforeunload(event);
    expect(event.returnValue).toBe("");
    cleanup();
  });

  test("releases the result route only after allowExit sets exit approval", () => {
    let exitAllowed = false;
    const allowExit = () => {
      exitAllowed = true;
    };

    expect(isExamRouteAllowed("/exam/selesai", { exitAllowed })).toBe(false);

    allowExit();

    expect(isExamRouteAllowed("/exam/selesai", { exitAllowed })).toBe(true);
    expect(isExamRouteAllowed("/exam", { exitAllowed })).toBe(true);
    expect(isExamRouteAllowed("/dashboard", { exitAllowed })).toBe(false);
  });

  test("blocked router transitions invoke the warning gate; allowed routes never warn", () => {
    let warnings = 0;
    const isAllowed = (url) => isExamRouteAllowed(url);

    expect(
      guardExamNavigation("/dashboard", {
        isAllowed,
        onBlocked: () => {
          warnings += 1;
        },
      })
    ).toBe(true);
    expect(warnings).toBe(1);

    expect(
      guardExamNavigation("/exam", { isAllowed, onBlocked: () => {
        warnings += 1;
      } })
    ).toBe(false);
    expect(warnings).toBe(1);
  });

  test("blocked anchor/back paths with query or hash still invoke the warning gate once", () => {
    let warnings = 0;
    const onBlocked = () => {
      warnings += 1;
    };
    const isAllowed = (url) => isExamRouteAllowed(url);

    // Same-origin anchor click target resolved to a path string.
    expect(
      guardExamNavigation("/dashboard?next=/exam#top", { isAllowed, onBlocked })
    ).toBe(true);
    // beforePopState `as` value for a foreign history entry.
    expect(guardExamNavigation("/exam/other", { isAllowed, onBlocked })).toBe(
      true
    );
    expect(warnings).toBe(2);
  });

  test("a storm of blocked attempts through the warning gate warns once per dedupe window", () => {
    let now = 1_000;
    let backendWarnings = 0;
    const recordWarning = createWarningGate({
      isEnabled: true,
      getCallback: () => () => {
        backendWarnings += 1;
      },
      now: () => now,
    });
    const isAllowed = (url) => isExamRouteAllowed(url);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      guardExamNavigation("/dashboard", {
        isAllowed,
        onBlocked: recordWarning,
      });
    }
    expect(backendWarnings).toBe(1);

    now += 1_000;
    guardExamNavigation("/dashboard", { isAllowed, onBlocked: recordWarning });
    expect(backendWarnings).toBe(2);
  });

  test("the warning gate stays silent when the exam is inactive or unwired", () => {
    let calls = 0;
    const callback = () => {
      calls += 1;
    };

    expect(
      createWarningGate({ isEnabled: false, getCallback: callback })()
    ).toBeUndefined();
    expect(
      createWarningGate({ isEnabled: true, getCallback: null })()
    ).toBeUndefined();
    expect(calls).toBe(0);
  });

  test("the route-change abort token round-trips and never matches ordinary errors", () => {
    const abort = createExamGuardAbortError();

    expect(isExamGuardAbort(abort)).toBe(true);
    expect(isExamGuardAbort(new Error("routeChange aborted: exam guard is active"))).toBe(
      false
    );
    expect(isExamGuardAbort(new Error("network error"))).toBe(false);
    expect(isExamGuardAbort(undefined)).toBe(false);
    expect(isExamGuardAbort("routeChange aborted: exam guard is active")).toBe(
      false
    );
  });
});
