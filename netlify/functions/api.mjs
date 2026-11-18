import { createApiHandler } from '../../server/app.js'
import { createPostgresDatabase } from '../../server/postgres-database.js'
import { invokeApiHandler } from '../../server/netlify-adapter.js'
import { seedMalangLocations } from '../../server/malang-locations.js'

let apiHandlerPromise

async function getApiHandler() {
  if (!apiHandlerPromise) {
    apiHandlerPromise = (async () => {
      const database = await createPostgresDatabase(process.env.DATABASE_URL)
      try {
        await seedMalangLocations(database)
        return createApiHandler({ database })
      } catch (error) {
        await database.close()
        throw error
      }
    })().catch((error) => {
      apiHandlerPromise = undefined
      throw error
    })
  }
  return apiHandlerPromise
}

export async function handler(event) {
  try {
    return await invokeApiHandler(await getApiHandler(), event)
  } catch (error) {
    console.error(
      'Netlify API request failed:',
      error instanceof Error ? error.name : 'Unknown error',
    )
    return {
      statusCode: 503,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
      body: JSON.stringify({ error: 'Layanan penyimpanan belum tersedia. Silakan coba kembali.' }),
    }
  }
}
