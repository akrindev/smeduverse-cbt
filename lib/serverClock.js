export const resolveServerNowMs = (response) => {
  const payloadServerTime =
    response?.data?.server_time ||
    response?.data?.data?.server_time ||
    response?.data?.data?.server_now;

  const payloadMs = payloadServerTime ? Date.parse(payloadServerTime) : NaN;
  if (Number.isFinite(payloadMs)) {
    return payloadMs;
  }

  const headerDate = response?.headers?.date;
  const headerMs = headerDate ? Date.parse(headerDate) : NaN;

  return Number.isFinite(headerMs) ? headerMs : null;
};

export const getTrustedNowMs = ({ serverNowMs, syncPerfNow }) => {
  if (
    Number.isFinite(serverNowMs) &&
    Number.isFinite(syncPerfNow) &&
    typeof performance !== "undefined"
  ) {
    const elapsedMs = Math.max(0, performance.now() - syncPerfNow);
    return serverNowMs + elapsedMs;
  }

  return Date.now();
};
