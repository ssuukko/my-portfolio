import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProjectFormModal from '../components/ProjectFormModal'
import {
  createProject,
  clearAdminAuth,
  deleteProject,
  fetchProjects,
  fetchVisits,
  getAdminAuth,
  setAdminCredentials,
  updateProjectOrder,
  updateProject,
} from '../api/projectApi'

const formatDate = (date) => {
  if (!date) {
    return '-'
  }

  return String(date).split('T')[0]
}

const truncateSummary = (summary) => {
  if (!summary) {
    return '-'
  }

  if (summary.length <= 40) {
    return summary
  }

  return `${summary.slice(0, 40)}...`
}

const formatDateTime = (date) => {
  if (!date) {
    return '-'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(date))
}

const formatReferrer = (referrer) => {
  if (!referrer || referrer === 'direct') {
    return '직접 방문'
  }

  return referrer
}

const getIpAddress = (visit) => visit.ipAddress || 'IP 없음'

const groupVisitsByIp = (visitList) =>
  visitList.reduce((groups, visit) => {
    const ipAddress = getIpAddress(visit)
    const existingGroup = groups.get(ipAddress)

    if (existingGroup) {
      existingGroup.visits.push(visit)
      return groups
    }

    groups.set(ipAddress, {
      ipAddress,
      visits: [visit],
    })

    return groups
  }, new Map())

const getProjectPayload = (project, useYn = project.useYn ?? 'Y') => ({
  title: project.title,
  summary: project.summary,
  description: project.description,
  thumbnailUrl: project.thumbnailUrl,
  featureImageUrls: project.featureImageUrls,
  featureImageCaptions: project.featureImageCaptions,
  projectUrl: project.projectUrl,
  techStack: project.techStack,
  myRole: project.myRole,
  troubleShooting: project.troubleShooting,
  githubUrl: project.githubUrl,
  deployUrl: project.deployUrl,
  result: project.result,
  displayOrder: project.displayOrder,
  startDate: project.startDate ? String(project.startDate).split('T')[0] : null,
  endDate: project.endDate ? String(project.endDate).split('T')[0] : null,
  useYn,
})

const markAdminSession = () => {
  window.sessionStorage.setItem('portfolioAdminSession', 'true')
}

function AdminPage() {
  const navigate = useNavigate()
  const hasInitialAuth = Boolean(getAdminAuth())
  const [isAuthenticated, setIsAuthenticated] = useState(hasInitialAuth)
  const [adminUsernameInput, setAdminUsernameInput] = useState('')
  const [adminPasswordInput, setAdminPasswordInput] = useState('')
  const [loginErrorMessage, setLoginErrorMessage] = useState('')
  const [projects, setProjects] = useState([])
  const [visits, setVisits] = useState([])
  const [activeTab, setActiveTab] = useState('projects')
  const [isLoading, setIsLoading] = useState(hasInitialAuth)
  const [isVisitsLoading, setIsVisitsLoading] = useState(hasInitialAuth)
  const [errorMessage, setErrorMessage] = useState('')
  const [visitErrorMessage, setVisitErrorMessage] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedVisitGroups, setExpandedVisitGroups] = useState({})

  const visitGroups = useMemo(
    () =>
      Array.from(groupVisitsByIp(visits).values())
        .map((group) => {
          const sortedVisits = [...group.visits].sort(
            (firstVisit, secondVisit) =>
              new Date(secondVisit.visitedAt).getTime() -
                new Date(firstVisit.visitedAt).getTime() ||
              (secondVisit.id ?? 0) - (firstVisit.id ?? 0),
          )

          return {
            ...group,
            visits: sortedVisits,
            firstVisitedAt: sortedVisits[sortedVisits.length - 1]?.visitedAt,
            lastVisitedAt: sortedVisits[0]?.visitedAt,
          }
        })
        .sort(
          (firstGroup, secondGroup) =>
            (secondGroup.visits[0]?.id ?? 0) - (firstGroup.visits[0]?.id ?? 0),
        ),
    [visits],
  )

  const loadProjects = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      setErrorMessage('')

      const projectList = await fetchProjects()
      setProjects(projectList)
    } catch (error) {
      console.error('Failed to load projects:', error)
      setErrorMessage(error.message || '프로젝트 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadVisits = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsVisitsLoading(true)
      }
      setVisitErrorMessage('')

      const visitList = await fetchVisits()
      setVisits(visitList)
    } catch (error) {
      console.error('Failed to load visits:', error)
      setVisitErrorMessage(error.message || '방문 로그를 불러오지 못했습니다.')
    } finally {
      setIsVisitsLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    markAdminSession()

    const loadInitialData = async () => {
      try {
        const [projectList, visitList] = await Promise.all([
          fetchProjects(),
          fetchVisits(),
        ])
        setProjects(projectList)
        setVisits(visitList)
      } catch (error) {
        console.error('Failed to load admin data:', error)
        setErrorMessage(error.message || '관리자 데이터를 불러오지 못했습니다.')
        setVisitErrorMessage(error.message || '관리자 데이터를 불러오지 못했습니다.')
        clearAdminAuth()
        setIsAuthenticated(false)
        setLoginErrorMessage('관리자 인증에 실패했습니다.')
      } finally {
        setIsLoading(false)
        setIsVisitsLoading(false)
      }
    }

    loadInitialData()
  }, [isAuthenticated])

  const handleLoginSubmit = async (event) => {
    event.preventDefault()

    const username = adminUsernameInput.trim()
    const password = adminPasswordInput

    if (!username || !password) {
      setLoginErrorMessage('아이디와 비밀번호를 입력해 주세요.')
      return
    }

    setAdminCredentials(username, password)
    setLoginErrorMessage('')
    setIsLoading(true)
    setIsVisitsLoading(true)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    clearAdminAuth()
    window.sessionStorage.removeItem('portfolioAdminSession')
    setIsAuthenticated(false)
    setAdminUsernameInput('')
    setAdminPasswordInput('')
    setProjects([])
    setVisits([])
  }

  const handleCreateClick = () => {
    setSelectedProject(null)
    setIsModalOpen(true)
  }

  const handleEditClick = (project) => {
    setSelectedProject(project)
    setIsModalOpen(true)
  }

  const handleDeleteClick = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return
    }

    try {
      await deleteProject(id)
      await loadProjects(false)
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert(error.message || '프로젝트 삭제에 실패했습니다.')
    }
  }

  const handleToggleUseYn = async (project) => {
    const nextUseYn = project.useYn === 'N' ? 'Y' : 'N'

    try {
      await updateProject(project.id, getProjectPayload(project, nextUseYn))
      await loadProjects(false)
    } catch (error) {
      console.error('Failed to update project useYn:', error)
      alert(error.message || '프로젝트 사용 여부 변경에 실패했습니다.')
    }
  }

  const handleMoveProject = async (projectIndex, direction) => {
    const targetIndex = projectIndex + direction

    if (targetIndex < 0 || targetIndex >= projects.length) {
      return
    }

    const nextProjects = [...projects]
    const [movedProject] = nextProjects.splice(projectIndex, 1)
    nextProjects.splice(targetIndex, 0, movedProject)

    setProjects(nextProjects)

    try {
      await updateProjectOrder(nextProjects.map((project) => project.id))
      await loadProjects(false)
    } catch (error) {
      console.error('Failed to update project order:', error)
      setProjects(projects)
      alert(error.message || '프로젝트 순서 변경에 실패했습니다.')
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedProject(null)
  }

  const handleModalSubmit = async (formData) => {
    if (selectedProject) {
      await updateProject(selectedProject.id, formData)
    } else {
      await createProject(formData)
    }

    handleModalClose()
    await loadProjects(false)
  }

  const handleToggleVisitGroup = (ipAddress) => {
    setExpandedVisitGroups((currentGroups) => ({
      ...currentGroups,
      [ipAddress]: !currentGroups[ipAddress],
    }))
  }

  const handleRefreshVisits = () => {
    loadVisits(true)
  }

  if (!isAuthenticated) {
    return (
      <div className="dashboard admin-dashboard">
        <main className="dashboard-main">
          <section className="section-heading" aria-labelledby="admin-login-heading">
            <div>
              <p className="eyebrow">Admin</p>
              <h1 id="admin-login-heading">관리자 로그인</h1>
            </div>
          </section>

          <form className="project-form" onSubmit={handleLoginSubmit}>
            <label>
              <span>아이디</span>
              <input
                type="text"
                value={adminUsernameInput}
                onChange={(event) => setAdminUsernameInput(event.target.value)}
                autoComplete="username"
              />
            </label>
            <label>
              <span>비밀번호</span>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(event) => setAdminPasswordInput(event.target.value)}
                autoComplete="current-password"
              />
            </label>
            {loginErrorMessage && (
              <div className="empty-state error-message">{loginErrorMessage}</div>
            )}
            <button className="primary-button" type="submit">
              로그인
            </button>
          </form>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard admin-dashboard">
      <header className="dashboard-header">
        <div className="brand-block">
          <p className="eyebrow">Admin</p>
          <h1>프로젝트 관리</h1>
          <p className="header-copy">
            포트폴리오에 표시할 프로젝트 정보를 등록하고 정리합니다.
          </p>
        </div>
        <div className="header-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              markAdminSession()
              navigate('/?ref=admin')
            }}
          >
            ← 포트폴리오
          </button>
          <button className="secondary-button" type="button" onClick={handleLogout}>
            로그아웃
          </button>
          <button className="primary-button" type="button" onClick={handleCreateClick}>
            + 새 프로젝트
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="section-heading" aria-labelledby="admin-heading">
          <div>
            <p className="eyebrow">Records</p>
            <h2 id="admin-heading">
              {activeTab === 'projects' ? '프로젝트 목록' : '방문 로그'}
            </h2>
          </div>
          <span className="project-count">
            {activeTab === 'projects'
              ? `${projects.length}개`
              : `${visitGroups.length}개 IP / ${visits.length}회`}
          </span>
          {activeTab === 'visits' && (
            <button
              className="secondary-button"
              type="button"
              onClick={handleRefreshVisits}
              disabled={isVisitsLoading}
            >
              {isVisitsLoading ? '새로고침 중...' : '새로고침'}
            </button>
          )}
        </section>

        <div className="admin-tabs" role="tablist" aria-label="관리자 메뉴">
          <button
            className={activeTab === 'projects' ? 'admin-tab active' : 'admin-tab'}
            type="button"
            role="tab"
            aria-selected={activeTab === 'projects'}
            onClick={() => setActiveTab('projects')}
          >
            프로젝트
          </button>
          <button
            className={activeTab === 'visits' ? 'admin-tab active' : 'admin-tab'}
            type="button"
            role="tab"
            aria-selected={activeTab === 'visits'}
            onClick={() => {
              setActiveTab('visits')
              loadVisits(false)
            }}
          >
            방문 로그
          </button>
        </div>

        {activeTab === 'projects' && isLoading && (
          <div className="empty-state">데이터를 불러오는 중입니다...</div>
        )}
        {activeTab === 'projects' && !isLoading && errorMessage && (
          <div className="empty-state error-message">{errorMessage}</div>
        )}
        {activeTab === 'projects' && !isLoading && !errorMessage && (
          <div className="table-shell">
            <table className="project-table">
              <thead>
                <tr>
                  <th>번호</th>
                  <th>제목</th>
                  <th>요약</th>
                  <th>시작일</th>
                  <th>종료일</th>
                  <th>사용여부</th>
                  <th>순서</th>
                  <th>수정</th>
                  <th>삭제</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 && (
                  <tr>
                    <td className="table-empty" colSpan="9">
                      등록된 프로젝트가 없습니다.
                    </td>
                  </tr>
                )}
                {projects.map((project, index) => (
                  <tr key={project.id ?? project.title}>
                    <td>{index + 1}</td>
                    <td className="project-title-cell">{project.title}</td>
                    <td>{truncateSummary(project.summary)}</td>
                    <td>{formatDate(project.startDate)}</td>
                    <td>{formatDate(project.endDate)}</td>
                    <td>
                      <button
                        className={
                          project.useYn === 'N' ? 'use-toggle off' : 'use-toggle'
                        }
                        type="button"
                        onClick={() => handleToggleUseYn(project)}
                      >
                        {project.useYn === 'N' ? 'N 미사용' : 'Y 사용'}
                      </button>
                    </td>
                    <td>
                      <div className="order-controls">
                        <button
                          className="order-button"
                          type="button"
                          onClick={() => handleMoveProject(index, -1)}
                          disabled={index === 0}
                          aria-label={`${project.title} 위로 이동`}
                        >
                          ↑
                        </button>
                        <button
                          className="order-button"
                          type="button"
                          onClick={() => handleMoveProject(index, 1)}
                          disabled={index === projects.length - 1}
                          aria-label={`${project.title} 아래로 이동`}
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        className="table-button"
                        type="button"
                        onClick={() => handleEditClick(project)}
                      >
                        수정
                      </button>
                    </td>
                    <td>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => handleDeleteClick(project.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'visits' && isVisitsLoading && (
          <div className="empty-state">방문 로그를 불러오는 중입니다...</div>
        )}
        {activeTab === 'visits' && !isVisitsLoading && visitErrorMessage && (
          <div className="empty-state error-message">{visitErrorMessage}</div>
        )}
        {activeTab === 'visits' && !isVisitsLoading && !visitErrorMessage && (
          <div className="table-shell">
            <table className="project-table visit-table">
              <thead>
                <tr>
                  <th>접속 IP</th>
                  <th>방문 횟수</th>
                  <th>최근 방문</th>
                  <th>첫 방문</th>
                  <th>최근 페이지</th>
                  <th>상세</th>
                </tr>
              </thead>
              <tbody>
                {visitGroups.length === 0 && (
                  <tr>
                    <td className="table-empty" colSpan="6">
                      저장된 방문 로그가 없습니다.
                    </td>
                  </tr>
                )}
                {visitGroups.map((group) => (
                  <Fragment key={group.ipAddress}>
                    <tr className="visit-group-row">
                      <td className="visit-ip-cell">{group.ipAddress}</td>
                      <td>{group.visits.length}회</td>
                      <td className="visit-date-cell">
                        {formatDateTime(group.lastVisitedAt)}
                      </td>
                      <td className="visit-date-cell">
                        {formatDateTime(group.firstVisitedAt)}
                      </td>
                      <td className="visit-url-cell">{group.visits[0]?.pageUrl || '-'}</td>
                      <td>
                        <button
                          className="table-button visit-drop-button"
                          type="button"
                          onClick={() => handleToggleVisitGroup(group.ipAddress)}
                          aria-expanded={!!expandedVisitGroups[group.ipAddress]}
                        >
                          {expandedVisitGroups[group.ipAddress] ? '닫기' : '드롭'}
                        </button>
                      </td>
                    </tr>
                    {expandedVisitGroups[group.ipAddress] && (
                      <tr className="visit-detail-row">
                        <td colSpan="6">
                          <div className="visit-detail-panel">
                            <table className="visit-detail-table">
                              <thead>
                                <tr>
                                  <th>방문 시각</th>
                                  <th>페이지 URL</th>
                                  <th>레퍼러</th>
                                  <th>ref 파라미터</th>
                                  <th>User-Agent</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.visits.map((visit) => (
                                  <tr key={visit.id}>
                                    <td className="visit-date-cell">
                                      {formatDateTime(visit.visitedAt)}
                                    </td>
                                    <td className="visit-url-cell">
                                      {visit.pageUrl || '-'}
                                    </td>
                                    <td className="visit-url-cell">
                                      {formatReferrer(visit.referrer)}
                                    </td>
                                    <td>
                                      {visit.refParam ? (
                                        <span className="ref-badge">
                                          {visit.refParam}
                                        </span>
                                      ) : (
                                        '-'
                                      )}
                                    </td>
                                    <td className="user-agent-cell">
                                      {visit.userAgent || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {isModalOpen && (
        <ProjectFormModal
          key={selectedProject?.id ?? 'new-project'}
          project={selectedProject}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  )
}

export default AdminPage
