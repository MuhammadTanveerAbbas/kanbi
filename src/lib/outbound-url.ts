import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * Outbound URL safety for server-side fetches.
 *
 * A hostname blocklist is not sufficient. The real threats are a hostname that
 * resolves to a private address, a redirect that lands on one, and alternative
 * IP encodings that bypass string matching. This module addresses all three:
 * addresses are parsed with the platform's own IP parser, DNS is resolved
 * before the request is made, and redirects are followed manually so every hop
 * is re-validated.
 */

const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

/** Hostnames that never legitimately need to be fetched server-side. */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'metadata',
  'metadata.google.internal',
  'instance-data',
]);

/**
 * Resolves a hostname to its IP addresses.
 *
 * Injectable so the safety rules can be tested against specific DNS answers,
 * including the rebinding case, without depending on real name resolution.
 */
export type AddressResolver = (hostname: string) => Promise<string[]>;

const defaultResolver: AddressResolver = async (hostname) => {
  const results = await lookup(hostname, { all: true, verbatim: true });
  return results.map((result) => result.address);
};

export class BlockedUrlError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super(`Blocked outbound URL: ${reason}`);
    this.name = 'BlockedUrlError';
    this.reason = reason;
  }
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value;
}

function inIpv4Range(ip: string, cidr: string, prefix: number): boolean {
  const address = ipv4ToInt(ip);
  const base = ipv4ToInt(cidr);
  if (address === null || base === null) return false;
  // A 0-length mask matches everything in that family.
  if (prefix === 0) return true;
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return ((address & mask) >>> 0) === ((base & mask) >>> 0);
}

/**
 * IPv4 ranges that must never be reached from a user-supplied URL. Covers
 * loopback, RFC1918 private space, link-local (including the 169.254.169.254
 * cloud metadata endpoint), carrier-grade NAT, multicast, reserved, and
 * broadcast.
 */
const BLOCKED_IPV4_RANGES: Array<[string, number]> = [
  ['0.0.0.0', 8],       // this network
  ['10.0.0.0', 8],      // private
  ['100.64.0.0', 10],   // carrier-grade NAT
  ['127.0.0.0', 8],     // loopback
  ['169.254.0.0', 16],  // link-local, includes cloud metadata
  ['172.16.0.0', 12],   // private
  ['192.0.0.0', 24],    // IETF protocol assignments
  ['192.0.2.0', 24],    // TEST-NET-1
  ['192.88.99.0', 24],  // 6to4 relay anycast
  ['192.168.0.0', 16],  // private
  ['198.18.0.0', 15],   // benchmarking
  ['198.51.100.0', 24], // TEST-NET-2
  ['203.0.113.0', 24],  // TEST-NET-3
  ['224.0.0.0', 4],     // multicast
  ['240.0.0.0', 4],     // reserved, includes 255.255.255.255
];

/** IPv6 ranges that must never be reached. */
const BLOCKED_IPV6_PREFIXES = [
  '::',      // unspecified and loopback (::1)
  'fc',      // unique local fc00::/7
  'fd',      // unique local fd00::/8
  'fe80',    // link-local fe80::/10
  'ff',      // multicast
  '2001:db8', // documentation
];

/**
 * True when the literal address points somewhere a public fetch must not go.
 * The platform IP parser does the address parsing, so alternative encodings
 * cannot slip past.
 */
export function isBlockedAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    return BLOCKED_IPV4_RANGES.some(([cidr, prefix]) => inIpv4Range(address, cidr, prefix));
  }
  if (version === 6) {
    const normalized = address.toLowerCase().replace(/^\[|\]$/g, '');
    // An IPv4-mapped address such as ::ffff:127.0.0.1 is still loopback.
    const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isBlockedAddress(mapped[1]!);
    return BLOCKED_IPV6_PREFIXES.some(
      (prefix) => normalized === prefix || normalized.startsWith(prefix)
    );
  }
  return true;
}

/** Normalizes a host for comparison. IPv6 literals keep their brackets stripped. */
function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
}

export function isBlockedHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  if (BLOCKED_HOSTNAMES.has(normalized)) return true;
  // A bare IP literal must be checked as an address, not as a name.
  if (isIP(normalized) !== 0) return isBlockedAddress(normalized);
  // Single-label hostnames resolve through search domains and can reach
  // internal names, so they are not accepted.
  if (!normalized.includes('.')) return true;
  return false;
}

/**
 * Resolves a hostname and rejects it if any resolved address is blocked.
 * Checking every returned address matters because a name can resolve to both a
 * public and a private address.
 */
async function assertResolvesToPublicAddress(
  hostname: string,
  resolve: AddressResolver
): Promise<void> {
  const normalized = normalizeHostname(hostname);

  if (isIP(normalized) !== 0) {
    if (isBlockedAddress(normalized)) {
      throw new BlockedUrlError(`address ${normalized} is in a reserved range`);
    }
    return;
  }

  let addresses: string[];
  try {
    addresses = await resolve(normalized);
  } catch {
    throw new BlockedUrlError(`could not resolve ${normalized}`);
  }

  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new BlockedUrlError(`could not resolve ${normalized}`);
  }

  for (const address of addresses) {
    if (isBlockedAddress(address)) {
      throw new BlockedUrlError(`${normalized} resolves to reserved address ${address}`);
    }
  }
}

/**
 * Validates a user-supplied URL before any request is made. Checks the scheme,
 * the hostname, and the resolved addresses.
 */
export async function assertSafeOutboundUrl(
  input: string,
  resolve: AddressResolver = defaultResolver
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new BlockedUrlError('not a valid URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BlockedUrlError(`scheme ${url.protocol} is not allowed`);
  }

  if (isBlockedHostname(url.hostname)) {
    throw new BlockedUrlError(`hostname ${url.hostname} is not allowed`);
  }

  await assertResolvesToPublicAddress(url.hostname, resolve);
  return url;
}

/**
 * Fetches a URL with outbound protections applied.
 *
 * Redirects are followed manually so each hop is re-validated. Automatic
 * following would let a public URL redirect to an internal address after the
 * initial check passed.
 */
export async function safeFetch(
  input: string,
  options: {
    userAgent?: string
    timeoutMs?: number
    maxBytes?: number
    resolve?: AddressResolver
    fetchImpl?: typeof fetch
  } = {}
): Promise<{ response: Response; finalUrl: URL }> {
  const {
    userAgent = 'Mozilla/5.0 (compatible; KanbiBot/1.0)',
    timeoutMs = FETCH_TIMEOUT_MS,
    maxBytes = MAX_RESPONSE_BYTES,
    resolve = defaultResolver,
    fetchImpl = fetch,
  } = options;

  let current = await assertSafeOutboundUrl(input, resolve);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetchImpl(current, {
      headers: { 'User-Agent': userAgent },
      signal: AbortSignal.timeout(timeoutMs),
      // Redirects are handled manually so each hop is validated.
      redirect: 'manual',
    });

    const isRedirect = response.status >= 300 && response.status < 400;
    if (!isRedirect) {
      assertResponseSize(response, maxBytes);
      return { response, finalUrl: current };
    }

    const location = response.headers.get('location');
    if (!location) {
      throw new BlockedUrlError('redirect response without a location header');
    }
    if (hop === MAX_REDIRECTS) {
      throw new BlockedUrlError('too many redirects');
    }

    // Resolve relative redirects against the current URL, then re-validate.
    current = await assertSafeOutboundUrl(new URL(location, current).toString(), resolve);
  }

  throw new BlockedUrlError('too many redirects');
}

/** Rejects an oversized body before it is read into memory. */
export function assertResponseSize(response: Response, maxBytes = MAX_RESPONSE_BYTES): void {
  const declared = response.headers.get('content-length');
  if (declared) {
    const size = Number.parseInt(declared, 10);
    if (Number.isFinite(size) && size > maxBytes) {
      throw new BlockedUrlError('response too large');
    }
  }
}

/** Reads a response body with a hard byte ceiling applied after reading. */
export async function readBoundedText(
  response: Response,
  maxBytes = MAX_RESPONSE_BYTES
): Promise<string> {
  const text = await response.text();
  if (text.length > maxBytes) {
    throw new BlockedUrlError('response too large');
  }
  return text;
}
