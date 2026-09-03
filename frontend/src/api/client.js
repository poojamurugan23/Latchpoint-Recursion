const TOKEN_KEY = 'latchpoint_token'

// Regenerated per tab load, kept only in memory — never localStorage (spec §7).
export const sessionId = crypto.randomUUID()

function getDeviceFingerprint() {
  const parts = [
    navigator.userAgent,
    screen.width,
    screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join('|')

  let hash = 0
  for (let i = 0; i < parts.length; i++) {
    hash = (hash << 5) - hash + parts.charCodeAt(i)
    hash |= 0
  }
  return `fp-${Math.abs(hash)}`
}

export const deviceFingerprint = getDeviceFingerprint()

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken()
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': sessionId,
      'X-Device-Fingerprint': deviceFingerprint,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204 || res.status === 202) return null

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    const message = data?.detail || res.statusText || 'Request failed'
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }

  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
}

/**
 * Reads an SSE stream via fetch (not the native EventSource, which can't
 * carry the Authorization/X-Session-Id/X-Device-Fingerprint headers this API
 * requires). Calls onEvent({ event, data }) for each frame as it arrives.
 */
export async function streamGet(path, onEvent) {
  const token = getToken()
  const res = await fetch(`/api${path}`, {
    headers: {
      'X-Session-Id': sessionId,
      'X-Device-Fingerprint': deviceFingerprint,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok || !res.body) {
    throw new Error(`Stream request failed: ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let boundary
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)

      let event = 'message'
      let data = ''
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim()
        else if (line.startsWith('data:')) data += line.slice(5).trim()
      }
      if (data) {
        try {
          onEvent({ event, data: JSON.parse(data) })
        } catch {
          // ignore malformed frame
        }
      }
    }
  }
}
