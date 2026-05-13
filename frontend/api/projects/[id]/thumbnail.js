/* global Buffer, process */

const RENDER_API_URL = (
  process.env.RENDER_API_URL ||
  process.env.VITE_API_URL ||
  'https://my-portfolio-yol2.onrender.com'
).replace(/\/$/, '')

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).send('Method Not Allowed')
    return
  }

  const { id } = request.query

  try {
    const upstream = await fetch(`${RENDER_API_URL}/api/projects/${encodeURIComponent(id)}/thumbnail`, {
      headers: {
        Accept: 'image/*',
      },
    })
    const body = Buffer.from(await upstream.arrayBuffer())

    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream')
    response.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
    response.status(upstream.status).send(body)
  } catch {
    response.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300')
    response.status(502).send('Thumbnail origin is unavailable')
  }
}
