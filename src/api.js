export async function requestJson(url, options = {}) {
  const response = await fetch(url, options)
  const responseText = await response.text()

  if (!responseText.trim()) {
    throw new Error(
      `Server tidak mengirim respons (HTTP ${response.status}). Periksa apakah API SIRKULIT sedang berjalan.`,
    )
  }

  let result
  try {
    result = JSON.parse(responseText)
  } catch {
    throw new Error(`Respons server tidak valid (HTTP ${response.status}). Silakan coba kembali.`)
  }

  if (!result || typeof result !== 'object' || Array.isArray(result)) {
    throw new Error(`Format respons server tidak sesuai (HTTP ${response.status}). Silakan coba kembali.`)
  }

  if (!response.ok) {
    throw new Error(result.details?.join(' ') || result.error || 'Permintaan belum dapat diproses.')
  }

  return result
}

export function getJson(url, options = {}) {
  return requestJson(url, { ...options, headers: { Accept: 'application/json', ...options.headers } })
}

export function postJson(url, payload) {
  return requestJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
