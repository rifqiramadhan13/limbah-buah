import { resolve } from 'node:path'
import { createDatabase } from './database.js'
import { createPostgresDatabase } from './postgres-database.js'
import { createApiServer } from './app.js'
import { seedMalangLocations, verifyMalangSeedLocations } from './malang-locations.js'

const database = process.env.DATABASE_URL
  ? await createPostgresDatabase()
  : createDatabase(process.env.DATABASE_PATH || undefined)
await seedMalangLocations(database)
const staticDirectory = process.env.STATIC_DIRECTORY
  || (process.env.NODE_ENV === 'production' ? resolve('dist') : '')
const server = createApiServer({ database, staticDirectory })
const port = Number(process.env.PORT || 3001)
const host = process.env.HOST || '127.0.0.1'

server.listen(port, host, () => {
  console.log(`SIRKULIT API aktif di http://${host}:${port}`)
})

if (process.env.GOOGLE_GEOCODING_API_KEY) {
  verifyMalangSeedLocations(database).then(({ verified, pending }) => {
    console.log(`Verifikasi lokasi awal Malang selesai: ${verified} terverifikasi, ${pending} belum terverifikasi.`)
  }).catch((error) => {
    console.error(
      'Verifikasi lokasi awal Malang gagal:',
      error instanceof Error ? error.message : 'Kesalahan tidak diketahui',
    )
  })
} else {
  console.warn('Lokasi awal Malang tersimpan tanpa koordinat; atur GOOGLE_GEOCODING_API_KEY untuk verifikasi geocoding.')
}

function closeServer() {
  server.close(() => {
    Promise.resolve(database.close()).finally(() => process.exit(0))
  })
}

process.on('SIGINT', closeServer)
process.on('SIGTERM', closeServer)
