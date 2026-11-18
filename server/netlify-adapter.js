import { Readable } from 'node:stream'

function getApiPath(event) {
  const eventPath = event.path || new URL(event.rawUrl, 'https://netlify.local').pathname
  if (eventPath.startsWith('/api/')) return eventPath

  const functionPrefix = '/.netlify/functions/api'
  if (eventPath === functionPrefix || eventPath.startsWith(`${functionPrefix}/`)) {
    const suffix = eventPath.slice(functionPrefix.length)
    return `/api${suffix || ''}`
  }
  return new URL(event.rawUrl || event.path, 'https://netlify.local').pathname
}

export async function invokeApiHandler(apiHandler, event) {
  const headers = Object.fromEntries(
    Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value]),
  )
  const rawBody = event.body || ''
  const body = event.isBase64Encoded
    ? Buffer.from(rawBody, 'base64')
    : Buffer.from(rawBody)
  const request = Readable.from(body.length ? [body] : [])
  request.method = event.httpMethod || event.requestContext?.http?.method || 'GET'
  request.url = `${getApiPath(event)}${event.rawQuery ? `?${event.rawQuery.replace(/^\?/, '')}` : ''}`
  request.headers = headers
  request.socket = {
    remoteAddress: headers['x-nf-client-connection-ip'] || 'netlify',
  }

  let statusCode = 200
  let responseHeaders = {}
  let responseBody = ''
  let headersSent = false
  const response = {
    get headersSent() {
      return headersSent
    },
    writeHead(status, values) {
      statusCode = status
      responseHeaders = values
      headersSent = true
      return this
    },
    end(value = '') {
      responseBody = Buffer.isBuffer(value) ? value.toString('utf8') : String(value)
    },
    destroy() {
      responseBody = ''
    },
  }

  await apiHandler(request, response)
  return { statusCode, headers: responseHeaders, body: responseBody }
}
