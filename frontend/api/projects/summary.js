/* global process */

const RENDER_API_URL = (
  process.env.RENDER_API_URL ||
  process.env.VITE_API_URL ||
  'https://my-portfolio-yol2.onrender.com'
).replace(/\/$/, '')
const SUMMARY_CACHE_CONTROL = 's-maxage=300, stale-while-revalidate=86400'

const toCardSummary = (project) => ({
  id: project.id,
  title: project.title,
  summary: project.summary,
  thumbnailUrl: project.thumbnailUrl,
  projectUrl: project.projectUrl,
  startDate: project.startDate,
  endDate: project.endDate,
  useYn: project.useYn,
  githubUrl: project.githubUrl,
  deployUrl: project.deployUrl,
  hasAttachment: Boolean(project.hasAttachment || project.hasPortfolio || project.attachmentFilename),
  hasPortfolio: Boolean(project.hasPortfolio || project.hasAttachment || project.attachmentFilename),
  displayOrder: project.displayOrder,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
})

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
    const contentType = upstream.headers.get('content-type') || 'application/json'

    if (!upstream.ok || !contentType.includes('application/json')) {
      response.setHeader('Content-Type', contentType)
      response.setHeader('Cache-Control', 'no-store, max-age=0')
      response.status(upstream.status).send(body)
      return
    }

    const data = JSON.parse(body)
    const summaries = Array.isArray(data?.data)
      ? data.data.map(toCardSummary)
      : []

    response.setHeader('Content-Type', 'application/json')
    response.setHeader('Cache-Control', SUMMARY_CACHE_CONTROL)
    response.status(upstream.status).json({
      ...data,
      data: summaries,
    })
  } catch {
    response.setHeader('Cache-Control', 'no-store, max-age=0')
    response.status(502).json({
      success: false,
      message: '프로젝트 목록 원본 서버 응답이 지연되고 있습니다.',
    })
  }
}
