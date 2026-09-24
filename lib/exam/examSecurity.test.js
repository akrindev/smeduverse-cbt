import { describe, expect, test } from "bun:test";
import {
  installBeforeUnload,
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
});
