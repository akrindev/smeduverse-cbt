const HAS_TIMEZONE_SUFFIX = /([zZ]|[+-]\d{2}:?\d{2})$/;

const normalizeServerTimestamp = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (HAS_TIMEZONE_SUFFIX.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return `${trimmed}T00:00:00+07:00`;
  }

  const normalizedDateTime = trimmed.includes("T")
    ? trimmed
    : trimmed.replace(" ", "T");

  return `${normalizedDateTime}+07:00`;
};

export const parseServerTimeMs = (value) => {
  const normalized = normalizeServerTimestamp(value);
  if (!normalized) {
    return NaN;
  }

  return Date.parse(normalized);
};

export const resolveServerNowMs = (response) => {
  const payloadServerTime =
    response?.data?.server_time ||
    response?.data?.data?.server_time ||
    response?.data?.data?.server_now;

  const payloadMs = parseServerTimeMs(payloadServerTime);
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

  return null;
};
