import { createDatabase } from './database.js'
import { createApiServer } from './app.js'

const database = createDatabase(process.env.DATABASE_PATH || undefined)
const server = createApiServer({ database })
const port = Number(process.env.PORT || 3001)
const host = process.env.HOST || '127.0.0.1'

server.listen(port, host, () => {
  console.log(`SIRKULIT API aktif di http://${host}:${port}`)
})

function closeServer() {
  server.close(() => {
    database.close()
    process.exit(0)
  })
}

process.on('SIGINT', closeServer)
process.on('SIGTERM', closeServer)
