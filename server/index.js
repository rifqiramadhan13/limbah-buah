import { createDatabase } from './database.js'
import { createApiServer } from './app.js'
import { seedMalangLocations, verifyMalangSeedLocations } from './malang-locations.js'

const database = createDatabase(process.env.DATABASE_PATH || undefined)
seedMalangLocations(database)
const server = createApiServer({ database })
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
    database.close()
    process.exit(0)
  })
}

process.on('SIGINT', closeServer)
process.on('SIGTERM', closeServer)
