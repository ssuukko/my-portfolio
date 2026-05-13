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
      cache: 'no-store',
    })
    const body = Buffer.from(await upstream.arrayBuffer())

    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream')
    response.setHeader('Cache-Control', 'no-store, max-age=0')
    response.status(upstream.status).send(body)
  } catch (error) {
    response.setHeader('Cache-Control', 'no-store, max-age=0')
    response.status(502).send('Thumbnail origin is unavailable')
  }
}
