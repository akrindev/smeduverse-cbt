const STORAGE_KEY = "smeduverse-exam-answer-queue-v1";
const STORAGE_VERSION = 1;
const MAX_ATTEMPTS = 3;
const DEFAULT_OPERATION = "save";
const VALID_OPERATIONS = new Set([DEFAULT_OPERATION, "ragu"]);
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

function normalizeOperation(operation) {
  return VALID_OPERATIONS.has(operation) ? operation : DEFAULT_OPERATION;
}

function getEntryKey(sheetId, operation, questionId) {
  return operation === DEFAULT_OPERATION
    ? `${sheetId}:${questionId}`
    : `${sheetId}:${operation}:${questionId}`;
}

function normalizeReadyAt(readyAt) {
  return Number.isFinite(readyAt) && readyAt >= 0 ? readyAt : 0;
}

function isInSheetScope(entry, scope) {
  if (scope === undefined || scope === null) {
    return true;
  }

  if (typeof scope === "object") {
    if (!Object.prototype.hasOwnProperty.call(scope, "sheetId")) {
      return true;
    }
    return entry.sheetId === scope.sheetId;
  }

  return entry.sheetId === scope;
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
  const operation = normalizeOperation(value.operation);
  const attempts = Number.isInteger(value.attempts) && value.attempts >= 0
    ? value.attempts
    : 0;
  const readyAt = normalizeReadyAt(value.readyAt);
  const updatedAt = Number.isFinite(value.updatedAt) ? value.updatedAt : 0;

  return {
    sheetId,
    operation,
    key: getEntryKey(sheetId, operation, payload.exam_soal_id),
    payload: copyPayload(payload),
    attempts,
    readyAt,
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
  send,
  scheduleRetry = (task) => task(),
  now = () => Date.now(),
} = {}) {
  if (typeof send !== "function") {
    throw new TypeError("createAnswerQueue requires a send function");
  }

  let entries = [];
  let persistenceDirty = false;
  let pendingRestore = false;
  const removedKeys = new Set();
  let revision = 0;
  const revisions = new WeakMap();
  const subscribers = new Set();
  let operationTail = Promise.resolve();

  const reportError = (error, operation) => {
    console.error(`[answerQueue] Storage ${operation} failed`, error);
  };

  const storage = resolveStorage(suppliedStorage, reportError);

  const persist = () => {
    if (!storage) {
      return;
    }

    if (pendingRestore) {
      persistenceDirty = true;
      return;
    }

    try {
      if (entries.length === 0) {
        storage.removeItem(STORAGE_KEY);
      } else {
        const record = {
          version: STORAGE_VERSION,
          entries: entries.map(copyEntry),
        };
        storage.setItem(STORAGE_KEY, JSON.stringify(record));
      }
      persistenceDirty = false;
      removedKeys.clear();
    } catch (error) {
      persistenceDirty = true;
      reportError(error, entries.length === 0 ? "remove" : "write");
    }
  };

  const mergeRestoredEntries = (restoredEntries) => {
    const merged = new Map();

    for (const entry of restoredEntries) {
      if (!removedKeys.has(entry.key)) {
        merged.set(entry.key, entry);
      }
    }
    for (const entry of entries) {
      merged.set(entry.key, entry);
    }

    return [...merged.values()];
  };

  const restore = () => {
    if (!storage) {
      pendingRestore = false;
      return true;
    }

    try {
      const storedValue = storage.getItem(STORAGE_KEY);
      if (storedValue === null || storedValue === undefined) {
        pendingRestore = false;
        if (removedKeys.size > 0) {
          persistenceDirty = true;
        }
        return true;
      }

      const record = JSON.parse(storedValue);
      if (record?.version !== STORAGE_VERSION || !Array.isArray(record.entries)) {
        throw new Error("Unsupported answer queue record");
      }

      const restored = [];
      for (const value of record.entries) {
        const entry = normalizeStoredEntry(value);
        if (entry) {
          restored.push(entry);
        }
      }
      entries = mergeRestoredEntries(restored);
      pendingRestore = false;
      if (removedKeys.size > 0) {
        persistenceDirty = true;
      }
      return true;
    } catch (error) {
      pendingRestore = true;
      reportError(error, "read");
      return false;
    }
  };

  const ensureRestored = () => !pendingRestore || restore();

  const getState = (scope) => {
    const scopedEntries = entries.filter((entry) =>
      isInSheetScope(entry, scope)
    );
    const statusSummary = {
      saving: 0,
      queued: 0,
      syncing: 0,
      failed: 0,
    };

    for (const entry of scopedEntries) {
      statusSummary[entry.status] += 1;
    }

    return {
      entries: scopedEntries.map(copyEntry),
      pendingCount: scopedEntries.length,
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

  const enqueue = ({
    sheetId,
    payload,
    operation = DEFAULT_OPERATION,
    readyAt = 0,
  }) => {
    ensureRestored();

    const normalizedOperation = normalizeOperation(operation);
    const normalizedReadyAt = normalizeReadyAt(readyAt);
    const currentTime = getCurrentTimestamp(now);
    const nextEntry = {
      sheetId,
      operation: normalizedOperation,
      key: getEntryKey(sheetId, normalizedOperation, payload.exam_soal_id),
      payload: copyPayload(payload),
      attempts: 0,
      readyAt: normalizedReadyAt,
      status: normalizedReadyAt > currentTime ? "queued" : "saving",
      lastError: null,
      updatedAt: currentTime,
    };
    const existingIndex = entries.findIndex((entry) => entry.key === nextEntry.key);

    if (existingIndex === -1) {
      entries.push(nextEntry);
    } else {
      entries[existingIndex] = nextEntry;
    }
    removedKeys.delete(nextEntry.key);

    getRevision(nextEntry);
    persist();
    notify();
    return getState();
  };

  const clear = (sheetId) => {
    if (!ensureRestored()) {
      return getState();
    }

    const removedEntries = entries.filter((entry) => entry.sheetId === sheetId);
    const remainingEntries = entries.filter((entry) => entry.sheetId !== sheetId);
    const changed = remainingEntries.length !== entries.length;
    entries = remainingEntries;
    for (const entry of removedEntries) {
      removedKeys.add(entry.key);
    }

    if (changed) {
      persist();
      notify();
      return getState();
    }

    if (persistenceDirty) {
      persist();
    }

    return getState();
  };

  const isEligible = (entry) =>
    (entry.status === "saving" || entry.status === "queued") &&
    entry.attempts < MAX_ATTEMPTS &&
    normalizeReadyAt(entry.readyAt) <= getCurrentTimestamp(now);

  const removeCurrentEntry = (entry) => {
    const entryIndex = entries.indexOf(entry);
    if (entryIndex !== -1) {
      removedKeys.add(entries[entryIndex].key);
      entries.splice(entryIndex, 1);
      persist();
      notify();
    }
  };

  const scheduleFlush = (scope) =>
    new Promise((resolve) => {
      let taskStarted = false;
      const task = () => {
        taskStarted = true;
        return runFlush(scope).then(resolve);
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
      result = await send(copyPayload(entry.payload), {
        operation: entry.operation,
      });
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

  async function runFlush(scope) {
    if (!ensureRestored()) {
      return getState(scope);
    }
    if (persistenceDirty) {
      persist();
    }

    const snapshot = entries.filter((entry) => isInSheetScope(entry, scope));
    for (const entry of snapshot) {
      const outcome = await attemptSend(entry);
      if (outcome === "retry") {
        await scheduleFlush(scope);
        return getState(scope);
      }
    }

    return getState(scope);
  }

  const runSerialized = (operation) => {
    const result = operationTail.then(operation);
    operationTail = result.catch(() => {});
    return result;
  };

  const flush = (scope) => runSerialized(() => runFlush(scope));

  const retry = (scope) =>
    runSerialized(async () => {
      if (!ensureRestored()) {
        return getState(scope);
      }

      let changed = false;
      for (const entry of entries) {
        if (!isInSheetScope(entry, scope)) {
          continue;
        }

        const isTerminalFailure = entry.status === "failed";
        const isExhaustedRetryable =
          entry.status === "queued" && entry.attempts >= MAX_ATTEMPTS;
        if (!isTerminalFailure && !isExhaustedRetryable) {
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

      return runFlush(scope);
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
