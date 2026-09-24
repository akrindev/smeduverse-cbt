import { describe, expect, test } from "bun:test";
import {
  supportsBeforeUnload,
  supportsLocalStorage,
  supportsOnlineEvents,
  supportsSendBeacon,
} from "./browserCompatibility";

function createSupportedWindow() {
  return {
    addEventListener: () => {},
    removeEventListener: () => {},
    onbeforeunload: null,
  };
}

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

describe("browser compatibility", () => {
  test("supported browser reports all transports available", () => {
    const windowLike = createSupportedWindow();
    const storage = createMemoryStorage();
    const navigatorLike = { sendBeacon: () => true };

    expect(supportsBeforeUnload(windowLike)).toBe(true);
    expect(supportsOnlineEvents(windowLike)).toBe(true);
    expect(supportsLocalStorage(storage)).toBe(true);
    expect(supportsSendBeacon(navigatorLike)).toBe(true);
  });

  test("missing sendBeacon is reported without throwing", () => {
    expect(supportsSendBeacon({})).toBe(false);
    expect(supportsSendBeacon(null)).toBe(false);
    expect(supportsSendBeacon(undefined)).toBe(false);
  });

  test("blocked local storage is reported without throwing", () => {
    const blockedStorage = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };

    expect(supportsLocalStorage(blockedStorage)).toBe(false);
    expect(supportsLocalStorage({})).toBe(false);
    expect(supportsLocalStorage(null)).toBe(false);
    expect(supportsLocalStorage(undefined)).toBe(false);
  });

  test("absent window globals never throw", () => {
    expect(supportsBeforeUnload(undefined)).toBe(false);
    expect(supportsBeforeUnload(null)).toBe(false);
    expect(supportsBeforeUnload({})).toBe(false);
    expect(supportsOnlineEvents(undefined)).toBe(false);
    expect(supportsOnlineEvents(null)).toBe(false);
    expect(supportsOnlineEvents({})).toBe(false);
  });
});
