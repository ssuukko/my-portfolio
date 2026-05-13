const RENDER_API_URL = (
  process.env.RENDER_API_URL ||
  process.env.VITE_API_URL ||
  'https://my-portfolio-yol2.onrender.com'
).replace(/\/$/, '')

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ success: false, message: 'Method Not Allowed' })
    return
  }

  try {
    const upstream = await fetch(`${RENDER_API_URL}/api/projects/summary`, {
      headers: {
        Accept: 'application/json',
      },
    })
    const body = await upstream.text()

    response.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=604800')
    response.status(upstream.status).send(body)
  } catch (error) {
    response.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300')
    response.status(502).json({
      success: false,
      message: '프로젝트 목록 원본 서버 응답이 지연되고 있습니다.',
    })
  }
}
