const STORAGE_KEY = "smeduverse-exam-answer-queue-v1";
const STORAGE_VERSION = 1;
const MAX_ATTEMPTS = 3;
const VALID_STATUSES = new Set(["saving", "queued", "syncing", "failed"]);
const TIMEOUT_CODES = new Set([
  "ABORT_ERR",
  "ECONNABORTED",
  "ERR_CANCELED",
  "ETIMEDOUT",
  "TimeoutError",
]);

function copyPayload(payload) {
  return { ...payload };
}

function copyEntry(entry) {
  return {
    ...entry,
    payload: copyPayload(entry.payload),
  };
}

function getCurrentTimestamp(now) {
  const timestamp = now();
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

function getErrorMessage(error) {
  if (typeof error === "string" && error) {
    return error;
  }

  if (!error || typeof error !== "object") {
    return "Unknown synchronization error";
  }

  const data = error.response?.data ?? error.data;
  if (typeof data === "string" && data) {
    return data;
  }
  if (typeof data?.message === "string" && data.message) {
    return data.message;
  }
  if (typeof error.message === "string" && error.message) {
    return error.message;
  }

  return "Unknown synchronization error";
}

function getHttpStatus(value) {
  const candidates = [
    value?.status,
    value?.statusCode,
    value?.response?.status,
    value?.response?.statusCode,
    value?.data?.status,
  ];

  for (const candidate of candidates) {
    if (Number.isInteger(candidate)) {
      return candidate;
    }
  }

  return null;
}

function isTimeoutError(error) {
  if (TIMEOUT_CODES.has(error?.code) || TIMEOUT_CODES.has(error?.name)) {
    return true;
  }

  const message = getErrorMessage(error);
  return /network request failed|network error|timed?\s*out|timeout/i.test(message);
}

function isRetryableError(error) {
  if (isTimeoutError(error)) {
    return true;
  }

  const status = getHttpStatus(error);
  return status === null || status < 400 || status >= 500;
}

function responseToError(response) {
  const status = getHttpStatus(response);
  const error = new Error(
    response?.statusText ||
      response?.data?.message ||
      (status ? `HTTP ${status}` : "Synchronization failed"),
  );
  error.response = response;
  return error;
}

function interpretSendResult(result) {
  if (result === null || result === undefined || typeof result !== "object") {
    return null;
  }

  const status = getHttpStatus(result);
  if (status !== null && status >= 200 && status < 300) {
    return null;
  }

  if (result.ok === true) {
    return null;
  }

  return responseToError(result);
}

function normalizeStoredEntry(value) {
  if (!value || typeof value !== "object" || !value.payload) {
    return null;
  }

  const { sheetId, payload } = value;
  if (sheetId === null || sheetId === undefined) {
    return null;
  }
  if (
    payload.exam_soal_id === null ||
    payload.exam_soal_id === undefined
  ) {
    return null;
  }

  const status = VALID_STATUSES.has(value.status) ? value.status : "queued";
  const attempts = Number.isInteger(value.attempts) && value.attempts >= 0
    ? value.attempts
    : 0;
  const updatedAt = Number.isFinite(value.updatedAt) ? value.updatedAt : 0;

  return {
    sheetId,
    key: `${sheetId}:${payload.exam_soal_id}`,
    payload: copyPayload(payload),
    attempts,
    status: status === "syncing" ? "queued" : status,
    lastError: value.lastError ?? null,
    updatedAt,
  };
}

function resolveStorage(storage, reportError) {
  if (storage !== undefined) {
    return storage;
  }
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    reportError(error, "access");
    return null;
  }
}

export function createAnswerQueue({
  storage: suppliedStorage,
  send = async () => {},
  scheduleRetry = (task) => task(),
  now = () => Date.now(),
} = {}) {
  let entries = [];
  let persistenceAvailable = true;
  let revision = 0;
  const revisions = new Map();
  const subscribers = new Set();
  let operationTail = Promise.resolve();

  const reportError = (error, operation) => {
    console.error(`[answerQueue] Storage ${operation} failed`, error);
  };

  const storage = resolveStorage(suppliedStorage, reportError);

  const persist = () => {
    if (!storage || !persistenceAvailable) {
      return;
    }

    try {
      if (entries.length === 0) {
        storage.removeItem(STORAGE_KEY);
        return;
      }

      const record = {
        version: STORAGE_VERSION,
        entries: entries.map(copyEntry),
      };
      storage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch (error) {
      persistenceAvailable = false;
      reportError(error, entries.length === 0 ? "remove" : "write");
    }
  };

  const restore = () => {
    if (!storage) {
      return;
    }

    try {
      const storedValue = storage.getItem(STORAGE_KEY);
      if (storedValue === null || storedValue === undefined) {
        return;
      }

      const record = JSON.parse(storedValue);
      if (record?.version !== STORAGE_VERSION || !Array.isArray(record.entries)) {
        throw new Error("Unsupported answer queue record");
      }

      const restored = new Map();
      for (const value of record.entries) {
        const entry = normalizeStoredEntry(value);
        if (!entry) {
          continue;
        }
        restored.set(entry.key, entry);
      }
      entries = [...restored.values()];
    } catch (error) {
      persistenceAvailable = false;
      reportError(error, "read");
    }
  };

  const getState = () => {
    const statusSummary = {
      saving: 0,
      queued: 0,
      syncing: 0,
      failed: 0,
    };

    for (const entry of entries) {
      statusSummary[entry.status] += 1;
    }

    return {
      entries: entries.map(copyEntry),
      pendingCount: entries.length,
      statusSummary,
    };
  };

  const notify = () => {
    if (subscribers.size === 0) {
      return;
    }

    const state = getState();
    for (const listener of [...subscribers]) {
      try {
        listener(state);
      } catch (error) {
        console.error("[answerQueue] Subscriber failed", error);
      }
    }
  };

  const getRevision = (entry) => {
    if (!revisions.has(entry)) {
      revision += 1;
      revisions.set(entry, revision);
    }
    return revisions.get(entry);
  };

  const isCurrentEntry = (entry, entryRevision) =>
    entries.includes(entry) && getRevision(entry) === entryRevision;

  const enqueue = ({ sheetId, payload }) => {
    const nextEntry = {
      sheetId,
      key: `${sheetId}:${payload.exam_soal_id}`,
      payload: copyPayload(payload),
      attempts: 0,
      status: "saving",
      lastError: null,
      updatedAt: getCurrentTimestamp(now),
    };
    const existingIndex = entries.findIndex((entry) => entry.key === nextEntry.key);

    if (existingIndex === -1) {
      entries.push(nextEntry);
    } else {
      entries[existingIndex] = nextEntry;
    }

    getRevision(nextEntry);
    persist();
    notify();
    return getState();
  };

  const clear = (sheetId) => {
    const remainingEntries = entries.filter((entry) => entry.sheetId !== sheetId);
    if (remainingEntries.length === entries.length) {
      return;
    }

    entries = remainingEntries;
    persist();
    notify();
  };

  const isEligible = (entry) =>
    (entry.status === "saving" || entry.status === "queued") &&
    entry.attempts < MAX_ATTEMPTS;

  const removeCurrentEntry = (entry) => {
    const entryIndex = entries.indexOf(entry);
    if (entryIndex !== -1) {
      entries.splice(entryIndex, 1);
      persist();
      notify();
    }
  };

  const scheduleFlush = () =>
    new Promise((resolve) => {
      let taskStarted = false;
      const task = () => {
        taskStarted = true;
        return runFlush().then(resolve);
      };

      try {
        const scheduled = scheduleRetry(task);
        if (scheduled && typeof scheduled.catch === "function") {
          scheduled.catch((error) => {
            console.error("[answerQueue] Retry scheduling failed", error);
            if (!taskStarted) {
              resolve();
            }
          });
        }
      } catch (error) {
        console.error("[answerQueue] Retry scheduling failed", error);
        resolve();
      }
    });

  const attemptSend = async (entry) => {
    if (!isEligible(entry)) {
      return "idle";
    }

    const entryRevision = getRevision(entry);
    entry.attempts += 1;
    entry.status = "syncing";
    entry.updatedAt = getCurrentTimestamp(now);
    persist();
    notify();

    let result;
    try {
      result = await send(copyPayload(entry.payload));
    } catch (error) {
      if (!isCurrentEntry(entry, entryRevision)) {
        return "stale";
      }

      entry.lastError = getErrorMessage(error);
      entry.updatedAt = getCurrentTimestamp(now);

      if (!isRetryableError(error)) {
        entry.status = "failed";
        persist();
        notify();
        return "failed";
      }

      entry.status = "queued";
      persist();
      notify();

      return entry.attempts < MAX_ATTEMPTS ? "retry" : "queued";
    }

    if (!isCurrentEntry(entry, entryRevision)) {
      return "stale";
    }

    const responseError = interpretSendResult(result);
    if (responseError) {
      if (!isCurrentEntry(entry, entryRevision)) {
        return "stale";
      }

      entry.lastError = getErrorMessage(responseError);
      entry.updatedAt = getCurrentTimestamp(now);

      if (!isRetryableError(responseError)) {
        entry.status = "failed";
        persist();
        notify();
        return "failed";
      }

      entry.status = "queued";
      persist();
      notify();
      return entry.attempts < MAX_ATTEMPTS ? "retry" : "queued";
    }

    removeCurrentEntry(entry);
    return "sent";
  };

  async function runFlush() {
    const snapshot = [...entries];
    for (const entry of snapshot) {
      const outcome = await attemptSend(entry);
      if (outcome === "retry") {
        await scheduleFlush();
        return getState();
      }
    }

    return getState();
  }

  const runSerialized = (operation) => {
    const result = operationTail.then(operation);
    operationTail = result.catch(() => {});
    return result;
  };

  const flush = () => runSerialized(runFlush);

  const retry = () =>
    runSerialized(async () => {
      let changed = false;
      for (const entry of entries) {
        if (entry.status !== "failed") {
          continue;
        }

        entry.status = "queued";
        entry.attempts = 0;
        entry.lastError = null;
        entry.updatedAt = getCurrentTimestamp(now);
        changed = true;
      }

      if (changed) {
        persist();
        notify();
      }

      return runFlush();
    });

  restore();

  return {
    enqueue,
    flush,
    getState,
    subscribe(listener) {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
    clear,
    retry,
  };
}
