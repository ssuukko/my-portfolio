const baseURL = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

const request = async (path, options = {}) => {
  const response = await fetch(`${baseURL}${path}`, options)
  const data = await parseResponse(response)

  if (!response.ok || data?.success === false) {
    const message =
      typeof data === 'string'
        ? data
        : data?.message ?? 'API 요청 처리 중 오류가 발생했습니다.'
    throw new Error(message)
  }

  return data
}

export const fetchProjects = async () => {
  const data = await request('/api/projects')
  return data.data ?? []
}

export const fetchHealth = async () => {
  const data = await request('/api/health')
  return data.message ?? data.data ?? '서버 응답 정상'
}

export const fetchProject = async (id) => {
  const data = await request(`/api/projects/${id}`)
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
  const data = await request('/api/visits')
  return data.data ?? []
}

export const createProject = async (body) => {
  const data = await request('/api/projects', {
    method: 'POST',
    headers: {
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
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return data.data
}

export const deleteProject = async (id) => {
  const data = await request(`/api/projects/${id}`, {
    method: 'DELETE',
  })

  return data.data
}
