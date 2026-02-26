const HAS_TIMEZONE_SUFFIX = /([zZ]|[+-]\d{2}:?\d{2})$/;
const NUMERIC_TIMESTAMP = /^\d+(\.\d+)?$/;

const normalizeTimestampNumber = (value) => {
  if (!Number.isFinite(value)) {
    return NaN;
  }

  return value < 1_000_000_000_000 ? value * 1000 : value;
};

const normalizeServerTimestamp = (value) => {
  if (typeof value === "number") {
    return normalizeTimestampNumber(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (NUMERIC_TIMESTAMP.test(trimmed)) {
    return normalizeTimestampNumber(Number(trimmed));
  }

  const withoutMicros = trimmed.replace(/\.(\d{3})\d+/, ".$1");

  if (HAS_TIMEZONE_SUFFIX.test(withoutMicros)) {
    return withoutMicros;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(withoutMicros)) {
    return `${withoutMicros}T00:00:00+07:00`;
  }

  const normalizedDateTime = withoutMicros.includes("T")
    ? withoutMicros
    : withoutMicros.replace(" ", "T");

  return `${normalizedDateTime}+07:00`;
};

export const parseServerTimeMs = (value) => {
  const normalized = normalizeServerTimestamp(value);
  if (typeof normalized === "number") {
    return normalized;
  }

  if (!normalized || typeof normalized !== "string") {
    return NaN;
  }

  return Date.parse(normalized);
};

export const resolveServerNowMs = (response) => {
  const payloadServerTime =
    response?.data?.now_ms ||
    response?.data?.server_now_ms ||
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

  if (Number.isFinite(serverNowMs)) {
    return serverNowMs;
  }

  return null;
};
