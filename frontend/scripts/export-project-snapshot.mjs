import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const apiUrl = (
  process.env.RENDER_API_URL ||
  process.env.VITE_API_URL ||
  'https://my-portfolio-yol2.onrender.com'
).replace(/\/$/, '')

const rootDir = process.cwd()
const publicDir = path.join(rootDir, 'public')
const thumbnailDir = path.join(publicDir, 'project-thumbnails')
const snapshotPath = path.join(publicDir, 'projects-summary.json')
const timeoutMs = 180000

const contentTypes = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

const toTimestamp = (value) => {
  const time = Date.parse(value)
  return Number.isNaN(time) ? '0' : String(time)
}

const parseDataUrl = (value) => {
  if (!value?.startsWith('data:')) {
    return null
  }

  const [metadata, content] = value.split(',', 2)

  if (!metadata || !content || !metadata.includes(';base64')) {
    return null
  }

  const contentType = metadata.slice(5, metadata.indexOf(';'))
  const extension = contentTypes[contentType.toLowerCase()]

  if (!extension) {
    return null
  }

  return {
    contentType,
    extension,
    buffer: Buffer.from(content, 'base64'),
  }
}

const fetchProjects = async () => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${apiUrl}/api/projects`, {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Snapshot source responded with ${response.status}`)
    }

    const data = await response.json()

    if (data?.success === false || !Array.isArray(data?.data)) {
      throw new Error(data?.message || 'Snapshot source returned invalid project data')
    }

    return data.data
  } finally {
    clearTimeout(timeout)
  }
}

const exportSnapshot = async () => {
  const projects = await fetchProjects()

  await mkdir(publicDir, { recursive: true })
  await rm(thumbnailDir, { recursive: true, force: true })
  await mkdir(thumbnailDir, { recursive: true })

  const summaries = await Promise.all(projects.map(async (project) => {
    const thumbnail = parseDataUrl(project.thumbnailUrl)
    let thumbnailUrl = project.thumbnailUrl

    if (thumbnail) {
      const version = toTimestamp(project.updatedAt)
      const filename = `${project.id}-${version}.${thumbnail.extension}`
      await writeFile(path.join(thumbnailDir, filename), thumbnail.buffer)
      thumbnailUrl = `/project-thumbnails/${filename}`
    }

    return {
      id: project.id,
      title: project.title,
      summary: project.summary,
      thumbnailUrl,
      projectUrl: project.projectUrl,
      startDate: project.startDate,
      endDate: project.endDate,
      useYn: project.useYn,
      githubUrl: project.githubUrl,
      deployUrl: project.deployUrl,
      displayOrder: project.displayOrder,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }
  }))

  await writeFile(
    snapshotPath,
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      data: summaries,
    }, null, 2)}\n`,
  )

  console.log(`Exported ${summaries.length} project summaries to ${snapshotPath}`)
}

exportSnapshot().catch(async (error) => {
  console.warn(`Project snapshot export skipped: ${error.message}`)
})
