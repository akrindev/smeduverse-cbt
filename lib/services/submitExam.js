import { canSubmitExam } from "../exam/submissionPolicy";
import { getResult } from "./getResult";

const emptyQueueState = () => ({ pendingCount: 0, entries: [] });

export async function submitExam({
  sheetId,
  flushAnswers,
  allowExit,
  onBlocked,
} = {}) {
  try {
    const flush =
      typeof flushAnswers === "function" ? flushAnswers : emptyQueueState;
    const result = await flush();
    if (!canSubmitExam(result?.pendingCount)) {
      onBlocked?.();
      return { submitted: false, reason: "queued" };
    }

    await getResult(sheetId, { onBeforeNavigate: allowExit });
    return { submitted: true, reason: "submitted" };
  } catch (error) {
    return { submitted: false, reason: "error", error };
  }
}
