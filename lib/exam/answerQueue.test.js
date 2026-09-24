import { describe, expect, test } from "bun:test";
import { createAnswerQueue } from "./answerQueue";

const STORAGE_KEY = "smeduverse-exam-answer-queue-v1";

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
    send: options.send ?? (async () => {}),
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

  test("restores persisted entries when the queue is reconstructed", async () => {
    const storage = createMemoryStorage();
    const sent = [];
    const firstQueue = createQueue({ storage });

    firstQueue.enqueue({
      sheetId: "s2",
      payload: {
        exam_answer_sheet_id: "backend-sheet",
        exam_soal_id: "q2",
        content: "tersimpan",
      },
    });

    const persisted = JSON.parse(storage.values.get(STORAGE_KEY));
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
    const queue = createQueue();

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
    const queue = createQueue();
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

  test("reports a storage write failure without removing the last valid record", async () => {
    const persisted = JSON.stringify({
      version: 1,
      entries: [
        {
          sheetId: "s1",
          key: "s1:q1",
          payload: {
            exam_answer_sheet_id: "s1",
            exam_soal_id: "q1",
            answer_chosen_id: "a",
          },
          attempts: 0,
          status: "saving",
          lastError: null,
          updatedAt: 1,
        },
      ],
    });
    let removeCalls = 0;
    const storage = {
      getItem: () => persisted,
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => {
        removeCalls += 1;
      },
    };
    const errors = [];
    const originalConsoleError = console.error;
    console.error = (...args) => errors.push(args);
    const queue = createQueue({
      storage,
      send: async () => {},
    });

    try {
      await queue.flush();
    } finally {
      console.error = originalConsoleError;
    }

    expect(removeCalls).toBe(0);
    expect(errors.length).toBeGreaterThan(0);
    expect(storage.getItem()).toBe(persisted);
  });
});
