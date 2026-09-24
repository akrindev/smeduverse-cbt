import { describe, expect, test } from "bun:test";
import { canSubmitExam } from "./submissionPolicy";

describe("submission policy", () => {
  test("blocks submission while any answer is queued", () => {
    expect(canSubmitExam(1)).toBe(false);
  });

  test("allows submission only when the queue is empty", () => {
    expect(canSubmitExam(0)).toBe(true);
  });
});
