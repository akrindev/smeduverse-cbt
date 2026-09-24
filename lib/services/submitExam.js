import { canSubmitExam } from "../exam/submissionPolicy";
import { getResult } from "./getResult";

function createSubmitError(message) {
  return {
    submitted: false,
    reason: "error",
    error: new Error(message),
  };
}

export async function submitExam({
  sheetId,
  flushAnswers,
  allowExit,
  onBlocked,
  onStart,
  onFinish,
  clearAnswers,
} = {}) {
  if (typeof flushAnswers !== "function") {
    return createSubmitError("flushAnswers is required");
  }
  if (typeof allowExit !== "function") {
    return createSubmitError("allowExit is required");
  }

  let lockAcquired = false;
  try {
    if (onStart) {
      lockAcquired = onStart() !== false;
      if (!lockAcquired) {
        return createSubmitError("submission is already in progress");
      }
    }

    const result = await flushAnswers();
    if (!canSubmitExam(result?.pendingCount)) {
      onBlocked?.();
      return { submitted: false, reason: "queued" };
    }

    await getResult(sheetId, { onBeforeNavigate: allowExit });
    if (typeof clearAnswers === "function") {
      await clearAnswers();
    }

    return { submitted: true, reason: "submitted" };
  } catch (error) {
    return { submitted: false, reason: "error", error };
  } finally {
    if (lockAcquired && onFinish) {
      onFinish();
    }
  }
}
