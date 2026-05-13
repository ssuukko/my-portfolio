const baseURL = (
  import.meta.env.VITE_API_URL || 'https://my-portfolio-yol2.onrender.com'
).replace(/\/$/, '')
const cachedBaseURL = import.meta.env.PROD ? '' : baseURL
const DEFAULT_TIMEOUT_MS = 12000
const ADMIN_AUTH_STORAGE_KEY = 'portfolioAdminAuth'

class ApiRequestError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

export const buildApiUrl = (path, { cached = false } = {}) => `${cached ? cachedBaseURL : baseURL}${path}`

export const getAdminAuth = () =>
  window.sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY) ?? ''

export const setAdminCredentials = (username, password) => {
  window.sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, window.btoa(`${username}:${password}`))
}

export const clearAdminAuth = () => {
  window.sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
}

const getAdminHeaders = () => ({
  Authorization: `Basic ${getAdminAuth()}`,
})

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') ?? ''
  const text = await response.text()

  if (!text) {
    return null
  }

  if (contentType.includes('application/json')) {
    return JSON.parse(text)
  }

  throw new Error(
    text.includes('<!doctype html') || text.includes('<html')
      ? 'API 서버 대신 프론트엔드 페이지가 응답했습니다. VITE_API_URL 배포 환경 변수를 확인해 주세요.'
      : text || 'API 서버가 JSON 응답을 반환하지 않았습니다.',
  )
}

const request = async (path, options = {}) => {
  const {
    baseUrl = baseURL,
    signal,
    timeout = DEFAULT_TIMEOUT_MS,
    ...fetchOptions
  } = options
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeout)

  let response
  let data

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...fetchOptions,
      signal: signal ?? controller.signal,
    })
    data = await parseResponse(response)
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('API 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.')
    }

    if (response && !response.ok) {
      throw new ApiRequestError(
        response.status === 401
          ? '관리자 인증이 필요합니다.'
          : error.message || 'API 요청 처리 중 오류가 발생했습니다.',
        response.status,
      )
    }

    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }

  if (!response.ok || data?.success === false) {
    const message =
      typeof data === 'string'
        ? data
        : data?.message ?? 'API 요청 처리 중 오류가 발생했습니다.'
    throw new ApiRequestError(message, response.status)
  }

  return data
}

export const isAdminAuthError = (error) => error?.status === 401 || error?.status === 403

export const fetchProjects = async () => {
  const data = await request('/api/projects', {
    headers: getAdminHeaders(),
  })
  return data.data ?? []
}

export const fetchProjectSummaries = async () => {
  const data = await request('/api/projects/summary', { baseUrl: cachedBaseURL })
  return data.data ?? []
}

export const fetchStaticProjectSummaries = async () => {
  const response = await fetch('/projects-summary.json', {
    cache: 'force-cache',
  })

  if (!response.ok) {
    throw new Error('정적 프로젝트 스냅샷을 불러오지 못했습니다.')
  }

  const data = await response.json()
  return data.data ?? []
}

export const fetchHealth = async () => {
  const data = await request('/api/health')
  return data.message ?? data.data ?? '서버 응답 정상'
}

export const fetchProject = async (id) => {
  const data = await request(`/api/projects/${id}`, { baseUrl: cachedBaseURL })
  return data.data
}

export const logVisit = async (body) => {
  const data = await request('/api/visits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return data.data
}

export const fetchVisits = async () => {
  const data = await request('/api/visits', {
    headers: getAdminHeaders(),
  })
  return data.data ?? []
}

export const getProjectAttachmentDownloadUrl = (id) =>
  buildApiUrl(`/api/projects/${id}/attachment`)

export const uploadProjectAttachment = async (id, file) => {
  const formData = new FormData()
  formData.append('file', file)

  const data = await request(`/api/projects/${id}/attachment`, {
    method: 'POST',
    headers: getAdminHeaders(),
    body: formData,
    timeout: 60000,
  })

  return data.data
}

export const deleteProjectAttachment = async (id) => {
  const data = await request(`/api/projects/${id}/attachment`, {
    method: 'DELETE',
    headers: getAdminHeaders(),
  })

  return data.data
}

export const createProject = async (body) => {
  const data = await request('/api/projects', {
    method: 'POST',
    headers: {
      ...getAdminHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return data.data
}

export const updateProject = async (id, body) => {
  const data = await request(`/api/projects/${id}`, {
    method: 'PUT',
    headers: {
      ...getAdminHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return data.data
}

export const updateProjectOrder = async (projectIds) => {
  const data = await request('/api/projects/order', {
    method: 'PUT',
    headers: {
      ...getAdminHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectIds }),
  })

  return data.data
}

export const deleteProject = async (id) => {
  const data = await request(`/api/projects/${id}`, {
    method: 'DELETE',
    headers: getAdminHeaders(),
  })

  return data.data
}
