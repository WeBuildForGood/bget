/**
 * Handle www to non-www redirects.
 */
const APEX = 'https://buildforgood.world';

export function handleWwwRedirect(request) {
  const url = new URL(request.url);
  if (url.hostname === 'www.buildforgood.world') {
    url.hostname = 'buildforgood.world';
    url.protocol = 'https:';
    const location = url.toString();
    return new Response(null, {
      status: 301,
      headers: {
        Location: location,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }
  return null;
}
