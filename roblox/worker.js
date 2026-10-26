// Cloudflare Worker — Roblox API proxy for LZVE.ly
// Deploy: https://dash.cloudflare.com → Workers & Pages → Create → paste this code
// Then update PROXY_URL in roblox/roblox.js to your worker URL.
//
// This worker forwards requests to Roblox's public API and adds CORS headers
// so the browser can read the response from lzve.living-the.life.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');

    if (!target) {
      return new Response(JSON.stringify({ error: 'Missing ?url= parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Only allow Roblox API domains
    const allowed = [
      'users.roblox.com',
      'thumbnails.roblox.com',
      'games.roblox.com',
      'groups.roblox.com'
    ];
    let targetUrl;
    try { targetUrl = new URL(target); } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    if (!allowed.includes(targetUrl.hostname)) {
      return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    const resp = await fetch(target, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const body = await resp.text();
    return new Response(body, {
      status: resp.status,
      headers: {
        'Content-Type': resp.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      }
    });
  }
};
