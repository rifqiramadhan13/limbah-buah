import { createServer } from 'node:http'
import { mapApiResponse } from '../../server/map-api.js'

export const config = { path: ['/api/ecosystem/map', '/api/partners'] }

export default createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost')
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  if (!config.path.includes(url.pathname)) {
    response.writeHead(404)
    response.end(JSON.stringify({ error: 'Resource tidak ditemukan.' }))
    return
  }
  if (request.method !== 'GET') {
    response.writeHead(405, { Allow: 'GET' })
    response.end(JSON.stringify({ error: 'Gunakan metode GET.' }))
    return
  }
  const { status, body } = mapApiResponse(url)
  response.writeHead(status, { 'Cache-Control': 'public, max-age=300' })
  response.end(JSON.stringify(body))
})
