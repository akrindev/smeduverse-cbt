import { describe, expect, mock, test } from "bun:test";

const getResult = mock(async () => ({ ok: true }));
mock.module("./getResult", () => ({ getResult }));

const { submitExam } = await import("./submitExam");

describe("submitExam", () => {
  test("fails closed when flushAnswers is missing", async () => {
    getResult.mockClear();

    const result = await submitExam({
      sheetId: "sheet-1",
      allowExit: () => {},
    });

    expect(result).toMatchObject({ submitted: false, reason: "error" });
    expect(getResult).not.toHaveBeenCalled();
  });

  test("fails closed when the navigation release callback is missing", async () => {
    getResult.mockClear();

    const result = await submitExam({
      sheetId: "sheet-1",
      flushAnswers: async () => ({ pendingCount: 0 }),
    });

    expect(result).toMatchObject({ submitted: false, reason: "error" });
    expect(getResult).not.toHaveBeenCalled();
  });

  test("holds finalization through the result response and clears after success", async () => {
    getResult.mockClear();
    const events = [];
    getResult.mockImplementationOnce(async (_sheetId, { onBeforeNavigate }) => {
      events.push("result");
      onBeforeNavigate();
      return { ok: true };
    });

    const result = await submitExam({
      sheetId: "sheet-1",
      flushAnswers: async () => {
        events.push("flush");
        return { pendingCount: 0 };
      },
      allowExit: () => events.push("allow"),
      onStart: () => {
        events.push("start");
        return true;
      },
      onFinish: () => events.push("finish"),
      clearAnswers: async () => events.push("clear"),
    });

    expect(result).toEqual({ submitted: true, reason: "submitted" });
    expect(events).toEqual(["start", "flush", "result", "allow", "clear", "finish"]);
  });

  test("does not submit when finalization is already locked", async () => {
    getResult.mockClear();
    let flushCalls = 0;

    const result = await submitExam({
      sheetId: "sheet-1",
      flushAnswers: async () => {
        flushCalls += 1;
        return { pendingCount: 0 };
      },
      allowExit: () => {},
      onStart: () => false,
    });

    expect(result).toMatchObject({ submitted: false, reason: "error" });
    expect(flushCalls).toBe(0);
    expect(getResult).not.toHaveBeenCalled();
  });
});
