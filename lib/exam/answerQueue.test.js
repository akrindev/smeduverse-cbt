import { describe, expect, test } from "bun:test";
import { createAnswerQueue } from "./answerQueue";

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    values,
  };
}

function createQueue(options = {}) {
  return createAnswerQueue({
    storage: options.storage ?? createMemoryStorage(),
    send: options.send,
    scheduleRetry: options.scheduleRetry ?? ((task) => task()),
    now: options.now ?? (() => 1),
  });
}

function createDeferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("answer queue", () => {
  test("requires an explicit send function", () => {
    expect(() =>
      createAnswerQueue({ storage: createMemoryStorage() }),
    ).toThrow("send");
  });

  test("keeps the same question isolated by sheet scope", async () => {
    const sent = [];
    const queue = createQueue({
      send: async (payload) => sent.push(payload),
    });

    queue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "backend-s1",
        exam_soal_id: "q1",
        answer_chosen_id: "a",
      },
    });
    queue.enqueue({
      sheetId: "s2",
      payload: {
        exam_answer_sheet_id: "backend-s2",
        exam_soal_id: "q1",
        answer_chosen_id: "b",
      },
    });

    expect(queue.getState().entries).toHaveLength(2);
    expect(queue.getState().entries.map((entry) => entry.key)).toEqual([
      "s1:q1",
      "s2:q1",
    ]);

    await queue.flush();

    expect(sent).toEqual([
      {
        exam_answer_sheet_id: "backend-s1",
        exam_soal_id: "q1",
        answer_chosen_id: "a",
      },
      {
        exam_answer_sheet_id: "backend-s2",
        exam_soal_id: "q1",
        answer_chosen_id: "b",
      },
    ]);
  });

  test("replaces a newer answer instead of creating a duplicate entry", async () => {
    const sent = [];
    const queue = createQueue({
      send: async (payload) => sent.push(payload),
    });

    queue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "s1",
        exam_soal_id: "q1",
        answer_chosen_id: "a",
      },
    });
    queue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "s1",
        exam_soal_id: "q1",
        answer_chosen_id: "b",
      },
    });

    expect(queue.getState().entries).toHaveLength(1);
    expect(queue.getState().entries[0].payload.answer_chosen_id).toBe("b");

    await queue.flush();

    expect(queue.getState().pendingCount).toBe(0);
    expect(sent).toHaveLength(1);
    expect(sent[0].answer_chosen_id).toBe("b");
    expect(sent[0]).not.toHaveProperty("sheetId");
  });

  test("stops after three total attempts and retains the latest payload", async () => {
    let calls = 0;
    const states = [];
    const queue = createQueue({
      send: async () => {
        calls += 1;
        throw new Error("offline");
      },
    });
    queue.subscribe((state) => states.push(state));

    queue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "s1",
        exam_soal_id: "q1",
        content: "jawaban",
      },
    });
    await queue.flush();

    expect(calls).toBe(3);
    expect(queue.getState().pendingCount).toBe(1);
    expect(queue.getState().entries[0].payload.content).toBe("jawaban");
    expect(queue.getState().entries[0].status).toBe("queued");
    expect(states.at(-1).entries[0].status).toBe("queued");
  });

  test("resets attempts when a failed answer is replaced", async () => {
    let calls = 0;
    const queue = createQueue({
      send: async () => {
        calls += 1;
        throw new Error("offline");
      },
    });

    queue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "s1",
        exam_soal_id: "q1",
        answer_chosen_id: "a",
      },
    });
    await queue.flush();
    expect(queue.getState().entries[0].attempts).toBe(3);

    queue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "s1",
        exam_soal_id: "q1",
        answer_chosen_id: "b",
      },
    });

    expect(queue.getState().entries[0].attempts).toBe(0);
    expect(queue.getState().entries[0].status).toBe("saving");

    await queue.flush();

    expect(calls).toBe(6);
    expect(queue.getState().entries[0].payload.answer_chosen_id).toBe("b");
    expect(queue.getState().entries[0].attempts).toBe(3);
  });

  test("does not make a fourth automatic attempt after three failures", async () => {
    let calls = 0;
    const queue = createQueue({
      send: async () => {
        calls += 1;
        throw new Error("offline");
      },
    });

    queue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "s1",
        exam_soal_id: "q1",
        answer_chosen_id: "a",
      },
    });

    await queue.flush();
    await queue.flush();

    expect(calls).toBe(3);
    expect(queue.getState().entries[0].attempts).toBe(3);
    expect(queue.getState().entries[0].status).toBe("queued");
  });

  test("restores persisted entries when the queue is reconstructed", async () => {
    const storage = createMemoryStorage();
    const sent = [];
    const firstQueue = createQueue({
      storage,
      send: async () => {},
    });

    firstQueue.enqueue({
      sheetId: "s2",
      payload: {
        exam_answer_sheet_id: "backend-sheet",
        exam_soal_id: "q2",
        content: "tersimpan",
      },
    });

    const persisted = JSON.parse([...storage.values.values()][0]);
    expect(persisted.version).toBe(1);
    expect(persisted.entries).toHaveLength(1);

    const restoredQueue = createQueue({
      storage,
      send: async (payload) => sent.push(payload),
    });

    expect(restoredQueue.getState().pendingCount).toBe(1);
    expect(restoredQueue.getState().entries[0].sheetId).toBe("s2");
    expect(restoredQueue.getState().entries[0].payload.exam_answer_sheet_id).toBe(
      "backend-sheet",
    );

    await restoredQueue.flush();

    expect(sent).toEqual([
      {
        exam_answer_sheet_id: "backend-sheet",
        exam_soal_id: "q2",
        content: "tersimpan",
      },
    ]);
  });

  test("retains the latest terminal failed payload after reconstruction", async () => {
    const storage = createMemoryStorage();
    const firstQueue = createQueue({
      storage,
      send: async () => {
        const error = new Error("validation failed");
        error.response = { status: 422, data: { message: "validation failed" } };
        throw error;
      },
    });

    firstQueue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "backend-s1",
        exam_soal_id: "q1",
        content: "latest answer",
      },
    });
    await firstQueue.flush();

    const restoredQueue = createQueue({
      storage,
      send: async () => {},
    });

    expect(restoredQueue.getState().entries).toHaveLength(1);
    expect(restoredQueue.getState().entries[0].status).toBe("failed");
    expect(restoredQueue.getState().entries[0].attempts).toBe(1);
    expect(restoredQueue.getState().entries[0].payload.content).toBe(
      "latest answer",
    );
  });

  test("does not let a late success remove a newer entry", async () => {
    const sendStarted = createDeferred();
    const sendResponse = createDeferred();
    const sent = [];
    const queue = createQueue({
      send: async (payload) => {
        sent.push(payload);
        sendStarted.resolve();
        return sendResponse.promise;
      },
    });

    queue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "s1",
        exam_soal_id: "q1",
        answer_chosen_id: "a",
      },
    });

    const flush = queue.flush();
    await sendStarted.promise;
    queue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "s1",
        exam_soal_id: "q1",
        answer_chosen_id: "b",
      },
    });
    sendResponse.resolve();
    await flush;

    expect(sent).toHaveLength(1);
    expect(queue.getState().pendingCount).toBe(1);
    expect(queue.getState().entries[0].payload.answer_chosen_id).toBe("b");
    expect(queue.getState().entries[0].status).toBe("saving");
  });

  test("keeps HTTP 4xx validation errors failed without retrying", async () => {
    let calls = 0;
    const queue = createQueue({
      send: async () => {
        calls += 1;
        const error = new Error("Payload tidak valid");
        error.response = { status: 422, data: { message: "Payload tidak valid" } };
        throw error;
      },
    });

    queue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "s1",
        exam_soal_id: "q1",
        content: "jawaban",
      },
    });
    await queue.flush();

    expect(calls).toBe(1);
    expect(queue.getState().entries[0].status).toBe("failed");
    expect(queue.getState().entries[0].payload.content).toBe("jawaban");
    expect(queue.getState().entries[0].lastError).toContain("Payload tidak valid");
  });

  test.each([
    ["a timeout", Object.assign(new Error("timeout"), { code: "ECONNABORTED" })],
    [
      "an HTTP 5xx response",
      Object.assign(new Error("service unavailable"), { response: { status: 503 } }),
    ],
  ])("treats %s as retryable", async (_label, error) => {
    let calls = 0;
    const queue = createQueue({
      send: async () => {
        calls += 1;
        throw error;
      },
    });

    queue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "s1",
        exam_soal_id: "q1",
        answer_chosen_id: "a",
      },
    });
    await queue.flush();

    expect(calls).toBe(3);
    expect(queue.getState().entries[0].attempts).toBe(3);
    expect(queue.getState().entries[0].status).toBe("queued");
  });

  test("retries failed validation entries only through the explicit retry API", async () => {
    let calls = 0;
    const queue = createQueue({
      send: async () => {
        calls += 1;
        if (calls === 1) {
          const error = new Error("invalid answer");
          error.status = 400;
          throw error;
        }
      },
    });

    queue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "s1",
        exam_soal_id: "q1",
        answer_chosen_id: "a",
      },
    });
    await queue.flush();
    await queue.flush();

    expect(calls).toBe(1);
    expect(queue.getState().entries[0].status).toBe("failed");

    await queue.retry();

    expect(calls).toBe(2);
    expect(queue.getState().pendingCount).toBe(0);
  });

  test("clears only entries belonging to the requested sheet", () => {
    const queue = createQueue({ send: async () => {} });

    queue.enqueue({
      sheetId: "s1",
      payload: { exam_answer_sheet_id: "s1", exam_soal_id: "q1" },
    });
    queue.enqueue({
      sheetId: "s1",
      payload: { exam_answer_sheet_id: "s1", exam_soal_id: "q2" },
    });
    queue.enqueue({
      sheetId: "s2",
      payload: { exam_answer_sheet_id: "s2", exam_soal_id: "q1" },
    });

    queue.clear("s1");

    expect(queue.getState().pendingCount).toBe(1);
    expect(queue.getState().entries[0].sheetId).toBe("s2");
    expect(queue.getState().entries[0].key).toBe("s2:q1");
  });

  test("notifies subscribers and stops after unsubscribe", () => {
    const queue = createQueue({ send: async () => {} });
    const states = [];
    const unsubscribe = queue.subscribe((state) => states.push(state));

    queue.enqueue({
      sheetId: "s1",
      payload: { exam_answer_sheet_id: "s1", exam_soal_id: "q1" },
    });
    unsubscribe();
    queue.clear("s1");

    expect(states).toHaveLength(1);
    expect(states[0].pendingCount).toBe(1);
    expect(states[0].statusSummary).toEqual({
      saving: 1,
      queued: 0,
      syncing: 0,
      failed: 0,
    });
  });

  test("recovers from a transient write failure and clears an acknowledged stale record", async () => {
    const storage = createMemoryStorage();
    const originalSetItem = storage.setItem;
    const originalRemoveItem = storage.removeItem;
    const originalConsoleError = console.error;
    const errors = [];
    let failNextWrite = false;
    let failNextRemove = false;

    storage.setItem = (key, value) => {
      if (failNextWrite) {
        failNextWrite = false;
        throw new Error("temporary write failure");
      }
      return originalSetItem(key, value);
    };
    storage.removeItem = (key) => {
      if (failNextRemove) {
        failNextRemove = false;
        throw new Error("temporary remove failure");
      }
      return originalRemoveItem(key);
    };
    console.error = (...args) => errors.push(args);

    try {
      const queue = createQueue({
        storage,
        send: async () => {},
      });

      queue.enqueue({
        sheetId: "s1",
        payload: {
          exam_answer_sheet_id: "backend-s1",
          exam_soal_id: "q1",
          answer_chosen_id: "a",
        },
      });

      failNextWrite = true;
      failNextRemove = true;
      queue.enqueue({
        sheetId: "s1",
        payload: {
          exam_answer_sheet_id: "backend-s1",
          exam_soal_id: "q1",
          answer_chosen_id: "b",
        },
      });
      await queue.flush();

      expect(queue.getState().pendingCount).toBe(0);
      expect(storage.values.size).toBe(1);

      queue.clear("s1");

      expect(storage.values.size).toBe(0);
      const restoredQueue = createQueue({
        storage,
        send: async () => {},
      });
      expect(restoredQueue.getState().pendingCount).toBe(0);
      expect(errors.length).toBeGreaterThan(0);
    } finally {
      console.error = originalConsoleError;
    }
  });

  test("preserves multiple persisted entries after a transient reconstruction read failure", async () => {
    const storage = createMemoryStorage();
    const seedQueue = createQueue({
      storage,
      send: async () => {},
    });

    seedQueue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "backend-s1",
        exam_soal_id: "q1",
        answer_chosen_id: "a",
      },
    });
    seedQueue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "backend-s1",
        exam_soal_id: "q2",
        content: "existing answer",
      },
    });

    const originalGetItem = storage.getItem;
    const originalConsoleError = console.error;
    const errors = [];
    let failNextRead = true;
    storage.getItem = (key) => {
      if (failNextRead) {
        failNextRead = false;
        throw new Error("temporary reconstruction read failure");
      }
      return originalGetItem(key);
    };
    console.error = (...args) => errors.push(args);

    try {
      const recoveredQueue = createQueue({
        storage,
        send: async () => {
          const error = new Error("keep entries pending");
          error.status = 422;
          throw error;
        },
      });

      recoveredQueue.enqueue({
        sheetId: "s1",
        payload: {
          exam_answer_sheet_id: "backend-s1",
          exam_soal_id: "q3",
          content: "new answer",
        },
      });
      await recoveredQueue.flush();

      const restoredQueue = createQueue({
        storage,
        send: async () => {},
      });
      const restoredEntries = restoredQueue.getState().entries;

      expect(restoredEntries).toHaveLength(3);
      expect(restoredEntries.map((entry) => entry.key)).toEqual([
        "s1:q1",
        "s1:q2",
        "s1:q3",
      ]);
      expect(restoredEntries.map((entry) => entry.payload.content ?? entry.payload.answer_chosen_id)).toEqual([
        "a",
        "existing answer",
        "new answer",
      ]);
      expect(errors.length).toBeGreaterThan(0);
    } finally {
      console.error = originalConsoleError;
    }
  });

  test("recovers from a transient read failure and persists the latest answer", async () => {
    const storage = createMemoryStorage();
    const seedQueue = createQueue({
      storage,
      send: async () => {},
    });
    seedQueue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "backend-s1",
        exam_soal_id: "q1",
        answer_chosen_id: "a",
      },
    });

    const originalGetItem = storage.getItem;
    const originalConsoleError = console.error;
    const errors = [];
    let failNextRead = true;
    storage.getItem = (key) => {
      if (failNextRead) {
        failNextRead = false;
        throw new Error("temporary read failure");
      }
      return originalGetItem(key);
    };
    console.error = (...args) => errors.push(args);

    try {
      const recoveredQueue = createQueue({
        storage,
        send: async () => {},
      });
      recoveredQueue.enqueue({
        sheetId: "s1",
        payload: {
          exam_answer_sheet_id: "backend-s1",
          exam_soal_id: "q1",
          answer_chosen_id: "b",
        },
      });

      const restoredQueue = createQueue({
        storage,
        send: async () => {},
      });
      expect(restoredQueue.getState().entries).toHaveLength(1);
      expect(restoredQueue.getState().entries[0].payload.answer_chosen_id).toBe(
        "b",
      );
      expect(errors.length).toBeGreaterThan(0);
    } finally {
      console.error = originalConsoleError;
    }
  });

  test("keeps save and ragu operations independent for the same question", async () => {
    const sent = [];
    const queue = createQueue({
      send: async (payload, metadata) => {
        sent.push({ payload, operation: metadata?.operation });
      },
    });

    queue.enqueue({
      sheetId: "s1",
      operation: "save",
      payload: {
        exam_answer_sheet_id: "backend-s1",
        exam_soal_id: "q1",
        answer_chosen_id: "a",
      },
    });
    queue.enqueue({
      sheetId: "s1",
      operation: "ragu",
      payload: {
        exam_answer_sheet_id: "backend-s1",
        exam_soal_id: "q1",
        ragu: 1,
      },
    });

    expect(queue.getState().entries).toHaveLength(2);
    await queue.flush();

    expect(sent).toEqual([
      {
        operation: "save",
        payload: {
          exam_answer_sheet_id: "backend-s1",
          exam_soal_id: "q1",
          answer_chosen_id: "a",
        },
      },
      {
        operation: "ragu",
        payload: {
          exam_answer_sheet_id: "backend-s1",
          exam_soal_id: "q1",
          ragu: 1,
        },
      },
    ]);
  });

  test("retains a debounced payload until its ready time", async () => {
    let currentTime = 1_000;
    const sent = [];
    const queue = createQueue({
      now: () => currentTime,
      send: async (payload) => sent.push(payload),
    });

    queue.enqueue({
      sheetId: "s1",
      readyAt: 2_000,
      payload: {
        exam_answer_sheet_id: "s1",
        exam_soal_id: "q1",
        content: "latest text",
      },
    });

    await queue.flush();
    expect(sent).toHaveLength(0);
    expect(queue.getState().pendingCount).toBe(1);

    currentTime = 2_000;
    await queue.flush();

    expect(sent).toEqual([
      {
        exam_answer_sheet_id: "s1",
        exam_soal_id: "q1",
        content: "latest text",
      },
    ]);
    expect(queue.getState().pendingCount).toBe(0);
  });

  test("explicit retry starts a fresh cycle for a terminal retryable entry", async () => {
    let calls = 0;
    const queue = createQueue({
      send: async () => {
        calls += 1;
        throw new Error("offline");
      },
    });

    queue.enqueue({
      sheetId: "s1",
      payload: {
        exam_answer_sheet_id: "s1",
        exam_soal_id: "q1",
        content: "latest text",
      },
    });
    await queue.flush();

    expect(calls).toBe(3);
    expect(queue.getState().entries[0].attempts).toBe(3);

    await queue.retry();

    expect(calls).toBe(6);
    expect(queue.getState().pendingCount).toBe(1);
    expect(queue.getState().entries[0].attempts).toBe(3);
  });

  test("scopes state and flushes to the requested sheet", async () => {
    const sent = [];
    const queue = createQueue({
      send: async (payload) => sent.push(payload),
    });

    queue.enqueue({
      sheetId: "old-sheet",
      payload: {
        exam_answer_sheet_id: "old-sheet",
        exam_soal_id: "q1",
        content: "old answer",
      },
    });
    queue.enqueue({
      sheetId: "new-sheet",
      payload: {
        exam_answer_sheet_id: "new-sheet",
        exam_soal_id: "q1",
        content: "new answer",
      },
    });

    expect(queue.getState({ sheetId: "new-sheet" }).pendingCount).toBe(1);
    expect(queue.getState({ sheetId: "new-sheet" }).entries).toHaveLength(1);
    expect(queue.getState({ sheetId: null }).pendingCount).toBe(0);

    await queue.flush({ sheetId: "new-sheet" });

    expect(sent).toEqual([
      {
        exam_answer_sheet_id: "new-sheet",
        exam_soal_id: "q1",
        content: "new answer",
      },
    ]);
    expect(queue.getState({ sheetId: "new-sheet" }).pendingCount).toBe(0);
    expect(queue.getState({ sheetId: "old-sheet" }).pendingCount).toBe(1);
  });

  test("scopes explicit retry to the requested sheet", async () => {
    const sent = [];
    let oldCalls = 0;
    const queue = createQueue({
      send: async (payload) => {
        sent.push(payload);
        if (payload.exam_answer_sheet_id === "old-sheet") {
          oldCalls += 1;
          const error = new Error("old validation failure");
          error.status = 422;
          throw error;
        }
      },
    });

    queue.enqueue({
      sheetId: "old-sheet",
      payload: {
        exam_answer_sheet_id: "old-sheet",
        exam_soal_id: "q1",
        content: "old answer",
      },
    });
    queue.enqueue({
      sheetId: "new-sheet",
      payload: {
        exam_answer_sheet_id: "new-sheet",
        exam_soal_id: "q1",
        content: "new answer",
      },
    });

    await queue.flush({ sheetId: "old-sheet" });
    expect(oldCalls).toBe(1);
    expect(queue.getState({ sheetId: "old-sheet" }).entries[0].status).toBe(
      "failed"
    );

    sent.length = 0;
    await queue.retry({ sheetId: "new-sheet" });

    expect(oldCalls).toBe(1);
    expect(sent).toEqual([
      {
        exam_answer_sheet_id: "new-sheet",
        exam_soal_id: "q1",
        content: "new answer",
      },
    ]);
    expect(queue.getState({ sheetId: "old-sheet" }).entries[0].status).toBe(
      "failed"
    );
  });
});
