/** TLD-like suffixes that are almost always filenames, not hostnames. */
const FILE_LIKE_TLDS = new Set([
  "json",
  "html",
  "htm",
  "css",
  "js",
  "mjs",
  "ts",
  "tsx",
  "jsx",
  "md",
  "txt",
  "xml",
  "yaml",
  "yml",
  "zip",
  "gz",
  "tar",
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "ico",
  "woff",
  "woff2",
  "ttf",
  "map",
  "wasm",
  "exe",
  "dll",
  "bin",
  "log",
  "csv",
]);

/** Common real TLDs seen in OSINT notes (not exhaustive). */
const KNOWN_TLDS = new Set([
  "com",
  "org",
  "net",
  "io",
  "co",
  "me",
  "sh",
  "dev",
  "app",
  "info",
  "biz",
  "us",
  "uk",
  "de",
  "fr",
  "eu",
  "ai",
  "tv",
  "cc",
  "xyz",
  "online",
  "site",
  "tech",
  "cloud",
  "pro",
  "edu",
  "gov",
  "int",
  "mil",
]);

const IPV4_RE =
  /^(?:\d{1,3}\.){3}\d{1,3}$/;

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const TRAILING_JUNK_RE = /[).,;:!?\]]+$/;

export function normalizeHostname(raw: string): string {
  return raw.trim().toLowerCase().replace(TRAILING_JUNK_RE, "");
}

export function normalizeUrl(raw: string): string {
  return raw.trim().replace(TRAILING_JUNK_RE, "");
}

export function isIpv4Address(value: string): boolean {
  const v = value.trim();
  if (!IPV4_RE.test(v)) return false;
  return v.split(".").every((octet) => {
    const n = Number(octet);
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
}

function hostnameLabels(hostname: string): string[] {
  return hostname.split(".").filter(Boolean);
}

export function isPlausibleHostname(hostname: string): boolean {
  const host = normalizeHostname(hostname);
  if (!host || host.length < 4 || !host.includes(".")) return false;
  if (host.includes(" ") || host.includes("@")) return false;

  const labels = hostnameLabels(host);
  if (labels.length < 2) return false;

  const tld = labels[labels.length - 1];
  if (tld.length < 2 || tld.length > 63) return false;
  if (!/^[a-z0-9-]+$/i.test(tld)) return false;
  if (FILE_LIKE_TLDS.has(tld)) return false;

  for (const label of labels) {
    if (!label.length || label.length > 63) return false;
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label)) return false;
  }

  if (KNOWN_TLDS.has(tld)) return true;

  // Allow longer gTLDs only when there are 3+ labels (e.g. app.northline.io).
  if (labels.length >= 3 && tld.length >= 2 && tld.length <= 24) {
    return true;
  }

  // Two-label hostnames need a recognized TLD (filters elena.vasquez-style noise).
  return false;
}

export function isUuidFragment(value: string): boolean {
  return UUID_RE.test(value);
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function isPlausiblePhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes(" ")) return false;
  if (isIpv4Address(trimmed)) return false;
  if (isUuidFragment(trimmed)) return false;

  const digits = digitsOnly(trimmed);
  if (digits.length < 8 || digits.length > 15) return false;

  // Long hyphenated IDs (entity UUIDs, ticket numbers).
  if (/[a-f]/i.test(trimmed.replace(/[+\s().-]/g, "")) && trimmed.includes("-")) {
    return false;
  }

  if (/^0+$/.test(digits)) return false;
  if (/^0{6,}/.test(digits)) return false;

  const hasPhoneFormatting =
    trimmed.startsWith("+") ||
    /[().\s-]/.test(trimmed) ||
    (digits.length >= 10 && digits.length <= 11);

  return hasPhoneFormatting;
}

/** Lenient check for values stored in dedicated phone fields. */
export function isStructuredPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (isIpv4Address(trimmed)) return false;
  if (isUuidFragment(trimmed)) return false;
  const digits = digitsOnly(trimmed);
  return digits.length >= 8 && digits.length <= 15;
}
