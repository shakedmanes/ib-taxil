/// <reference types="@cloudflare/workers-types" />

const IBKR_SEND_REQUEST = 'https://ndcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.SendRequest'
const IBKR_GET_STATEMENT = 'https://ndcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService.GetStatement'

const ALLOWED_HOSTS = new Set([
  'ndcdyn.interactivebrokers.com',
  'gdcdyn.interactivebrokers.com',
])

const PRIVATE_IP_RE = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/

interface Env {
  ALLOWED_ORIGIN: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      const preflightOrigin = request.headers.get('Origin') ?? ''
      const isLocalPreflight = preflightOrigin.startsWith('http://localhost') || preflightOrigin.startsWith('http://127.0.0.1')
      const allowedOrigin = isLocalPreflight ? preflightOrigin : env.ALLOWED_ORIGIN
      return corsResponse(new Response(null, { status: 204 }), allowedOrigin)
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    const origin = request.headers.get('Origin') ?? ''
    const isLocalDev = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')
    if (origin !== env.ALLOWED_ORIGIN && !isLocalDev) {
      return new Response('Forbidden', { status: 403 })
    }

    // Echo back the actual request origin so the browser accepts the response,
    // whether it comes from production or localhost.
    const responseOrigin = isLocalDev ? origin : env.ALLOWED_ORIGIN

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (action === 'send') {
      const token   = url.searchParams.get('t')
      const queryId = url.searchParams.get('q')
      if (!token || !queryId) {
        return new Response('Missing t or q parameters', { status: 400 })
      }
      const ibkrUrl = `${IBKR_SEND_REQUEST}?t=${encodeURIComponent(token)}&q=${encodeURIComponent(queryId)}&v=3`
      const response = await proxyFetch(ibkrUrl)
      return corsResponse(response, responseOrigin)
    }

    if (action === 'get') {
      const token = url.searchParams.get('t')
      const ref   = url.searchParams.get('q')
      if (!token || !ref) {
        return new Response('Missing t or q parameters', { status: 400 })
      }
      const ibkrUrl = `${IBKR_GET_STATEMENT}?t=${encodeURIComponent(token)}&q=${encodeURIComponent(ref)}&v=3`
      const response = await proxyFetch(ibkrUrl)
      return corsResponse(response, responseOrigin)
    }

    return new Response('Invalid action. Use action=send or action=get', { status: 400 })
  },
}

// Headers that only apply to the original TCP connection and must not be
// forwarded to the browser — doing so causes encoding mismatches and resets.
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

async function proxyFetch(targetUrl: string): Promise<Response> {
  const parsed = new URL(targetUrl)

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return new Response('Target host not allowed', { status: 403 })
  }

  if (PRIVATE_IP_RE.test(parsed.hostname)) {
    return new Response('Target host not allowed', { status: 403 })
  }

  // Follow redirects so that IBKR endpoint redirects are handled transparently.
  // redirect:'manual' returns an opaque null-body response that cannot be forwarded.
  return fetch(targetUrl, { redirect: 'follow' })
}

function corsResponse(response: Response, allowedOrigin: string): Response {
  const headers = new Headers()

  // Copy only safe, end-to-end headers from the upstream response.
  response.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value)
    }
  })

  headers.set('Access-Control-Allow-Origin', allowedOrigin)
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
