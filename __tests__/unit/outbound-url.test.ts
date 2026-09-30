import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isBlockedAddress,
  isBlockedHostname,
  assertSafeOutboundUrl,
  safeFetch,
  BlockedUrlError,
  type AddressResolver,
} from '@/lib/outbound-url';

// The resolver is injected rather than mocked, so these tests state the exact
// DNS answer they are exercising.
const publicResolver: AddressResolver = async () => ['93.184.216.34'];
const resolvingTo =
  (...addresses: string[]): AddressResolver =>
  async () =>
    addresses;
const failingResolver: AddressResolver = async () => {
  throw new Error('ENOTFOUND');
};

describe('isBlockedAddress', () => {
  it.each([
    '127.0.0.1',
    '127.1.2.3',
    '10.0.0.1',
    '10.255.255.255',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254', // cloud metadata
    '100.64.0.1', // carrier-grade NAT
    '0.0.0.0',
    '224.0.0.1',
    '255.255.255.255',
  ])('blocks reserved IPv4 address %s', (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each(['8.8.8.8', '1.1.1.1', '93.184.216.34', '172.32.0.1', '192.169.0.1', '11.0.0.1'])(
    'allows public IPv4 address %s',
    (address) => {
      expect(isBlockedAddress(address)).toBe(false);
    }
  );

  it('blocks IPv6 loopback and unspecified', () => {
    expect(isBlockedAddress('::1')).toBe(true);
    expect(isBlockedAddress('::')).toBe(true);
  });

  it('blocks IPv6 unique local and link-local', () => {
    expect(isBlockedAddress('fd00::1')).toBe(true);
    expect(isBlockedAddress('fe80::1')).toBe(true);
  });

  it('blocks an IPv4-mapped loopback address', () => {
    // ::ffff:127.0.0.1 reaches loopback and must not be treated as public IPv6.
    expect(isBlockedAddress('::ffff:127.0.0.1')).toBe(true);
  });

  it('allows public IPv6', () => {
    expect(isBlockedAddress('2606:4700:4700::1111')).toBe(false);
  });

  it('treats a non-address string as blocked', () => {
    expect(isBlockedAddress('example.com')).toBe(true);
  });
});

describe('isBlockedHostname', () => {
  it('blocks localhost and cloud metadata names', () => {
    expect(isBlockedHostname('localhost')).toBe(true);
    expect(isBlockedHostname('metadata.google.internal')).toBe(true);
    expect(isBlockedHostname('instance-data')).toBe(true);
  });

  it('blocks an IP literal that points at a private address', () => {
    expect(isBlockedHostname('169.254.169.254')).toBe(true);
    expect(isBlockedHostname('10.0.0.5')).toBe(true);
  });

  it('blocks a single-label hostname that would use a search domain', () => {
    expect(isBlockedHostname('intranet')).toBe(true);
  });

  it('blocks a public IP literal used as a hostname only via address rules', () => {
    expect(isBlockedHostname('8.8.8.8')).toBe(false);
  });

  it('allows a normal public hostname', () => {
    expect(isBlockedHostname('example.com')).toBe(false);
  });

  it('is case insensitive and tolerates a trailing dot', () => {
    expect(isBlockedHostname('LocalHost')).toBe(true);
    expect(isBlockedHostname('example.com.')).toBe(false);
  });
});

describe('assertSafeOutboundUrl', () => {
  it('rejects a non-http scheme', async () => {
    await expect(
      assertSafeOutboundUrl('file:///etc/passwd', publicResolver)
    ).rejects.toBeInstanceOf(BlockedUrlError);
  });

  it('rejects a malformed URL', async () => {
    await expect(assertSafeOutboundUrl('not a url', publicResolver)).rejects.toBeInstanceOf(
      BlockedUrlError
    );
  });

  it('rejects localhost without performing a lookup', async () => {
    const resolve = vi.fn(publicResolver);
    await expect(
      assertSafeOutboundUrl('http://localhost:3000/admin', resolve)
    ).rejects.toBeInstanceOf(BlockedUrlError);
    expect(resolve).not.toHaveBeenCalled();
  });

  it('rejects a private IP literal', async () => {
    await expect(assertSafeOutboundUrl('http://10.0.0.1/', publicResolver)).rejects.toBeInstanceOf(
      BlockedUrlError
    );
  });

  it('rejects the cloud metadata endpoint', async () => {
    await expect(
      assertSafeOutboundUrl('http://169.254.169.254/latest/meta-data/', publicResolver)
    ).rejects.toBeInstanceOf(BlockedUrlError);
  });

  it('rejects a hostname that resolves to a private address', async () => {
    // This is the rebinding case that a hostname blocklist cannot catch.
    await expect(
      assertSafeOutboundUrl('http://sneaky.example.com/', resolvingTo('169.254.169.254'))
    ).rejects.toBeInstanceOf(BlockedUrlError);
  });

  it('rejects when any resolved address is private', async () => {
    // A name resolving to both a public and a private address is still unsafe.
    await expect(
      assertSafeOutboundUrl('http://mixed.example.com/', resolvingTo('93.184.216.34', '127.0.0.1'))
    ).rejects.toBeInstanceOf(BlockedUrlError);
  });

  it('rejects a hostname that does not resolve', async () => {
    await expect(
      assertSafeOutboundUrl('http://nope.invalid/', failingResolver)
    ).rejects.toBeInstanceOf(BlockedUrlError);
  });

  it('rejects a hostname that resolves to an empty list', async () => {
    await expect(
      assertSafeOutboundUrl('http://empty.example.com/', resolvingTo())
    ).rejects.toBeInstanceOf(BlockedUrlError);
  });

  it('accepts a public URL', async () => {
    await expect(
      assertSafeOutboundUrl('https://example.com/page', publicResolver)
    ).resolves.toMatchObject({ hostname: 'example.com' });
  });
});

describe('safeFetch', () => {
  const fetchImpl = vi.fn();

  beforeEach(() => {
    fetchImpl.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('follows a redirect to another public URL and re-validates it', async () => {
    const resolve = vi.fn(publicResolver);
    fetchImpl
      .mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: 'https://other.example.com/' } })
      )
      .mockResolvedValueOnce(new Response('<html>ok</html>', { status: 200 }));

    const { response, finalUrl } = await safeFetch('https://example.com/', {
      resolve,
      fetchImpl,
    });

    expect(response.status).toBe(200);
    expect(finalUrl.hostname).toBe('other.example.com');
    // Each hop is validated, so both hostnames were resolved.
    expect(resolve).toHaveBeenCalledTimes(2);
  });

  it('refuses a redirect to an internal address', async () => {
    // Automatic redirect following would reach the internal service here.
    fetchImpl.mockResolvedValueOnce(
      new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/' } })
    );

    await expect(
      safeFetch('https://example.com/', { resolve: publicResolver, fetchImpl })
    ).rejects.toBeInstanceOf(BlockedUrlError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('refuses a redirect to a host that rebinds to a private address', async () => {
    const resolve = vi.fn(async (hostname: string) =>
      hostname === 'other.example.com' ? ['10.0.0.9'] : ['93.184.216.34']
    );
    fetchImpl.mockResolvedValueOnce(
      new Response(null, { status: 302, headers: { location: 'https://other.example.com/' } })
    );

    await expect(safeFetch('https://example.com/', { resolve, fetchImpl })).rejects.toBeInstanceOf(
      BlockedUrlError
    );
  });

  it('resolves a relative redirect against the current URL', async () => {
    fetchImpl
      .mockResolvedValueOnce(
        new Response(null, { status: 301, headers: { location: '/moved' } })
      )
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const { finalUrl } = await safeFetch('https://example.com/a/b', {
      resolve: publicResolver,
      fetchImpl,
    });

    expect(finalUrl.toString()).toBe('https://example.com/moved');
  });

  it('refuses a redirect chain that exceeds the hop limit', async () => {
    let n = 0;
    fetchImpl.mockImplementation(() => {
      n += 1;
      return Promise.resolve(
        new Response(null, {
          status: 302,
          headers: { location: `https://example.com/hop${n}` },
        })
      );
    });

    await expect(
      safeFetch('https://example.com/', { resolve: publicResolver, fetchImpl })
    ).rejects.toBeInstanceOf(BlockedUrlError);
  });

  it('rejects an oversized declared content length before reading the body', async () => {
    fetchImpl.mockResolvedValue(
      new Response('small', { status: 200, headers: { 'content-length': String(50 * 1024 * 1024) } })
    );

    await expect(
      safeFetch('https://example.com/', { resolve: publicResolver, fetchImpl })
    ).rejects.toBeInstanceOf(BlockedUrlError);
  });

  it('requests manual redirect handling and sends no credentials', async () => {
    fetchImpl.mockResolvedValue(new Response('ok', { status: 200 }));

    await safeFetch('https://example.com/', { resolve: publicResolver, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ redirect: 'manual' })
    );
  });
});
