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
      return corsResponse(new Response(null, { status: 204 }), env.ALLOWED_ORIGIN)
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    const origin = request.headers.get('Origin') ?? ''
    const isLocalDev = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')
    if (origin !== env.ALLOWED_ORIGIN && !isLocalDev) {
      return new Response('Forbidden', { status: 403 })
    }

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
      return corsResponse(response, env.ALLOWED_ORIGIN)
    }

    if (action === 'get') {
      const ref = url.searchParams.get('q')
      if (!ref) {
        return new Response('Missing q parameter', { status: 400 })
      }
      const ibkrUrl = `${IBKR_GET_STATEMENT}?q=${encodeURIComponent(ref)}&v=3`
      const response = await proxyFetch(ibkrUrl)
      return corsResponse(response, env.ALLOWED_ORIGIN)
    }

    return new Response('Invalid action. Use action=send or action=get', { status: 400 })
  },
}

async function proxyFetch(targetUrl: string): Promise<Response> {
  const parsed = new URL(targetUrl)

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return new Response('Target host not allowed', { status: 403 })
  }

  if (PRIVATE_IP_RE.test(parsed.hostname)) {
    return new Response('Target host not allowed', { status: 403 })
  }

  return fetch(targetUrl, { redirect: 'manual' })
}

function corsResponse(response: Response, allowedOrigin: string): Response {
  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', allowedOrigin)
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
