import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProjectFormModal from '../components/ProjectFormModal'
import {
  createProject,
  deleteProject,
  fetchProjects,
  fetchVisits,
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
  const [projects, setProjects] = useState([])
  const [visits, setVisits] = useState([])
  const [activeTab, setActiveTab] = useState('projects')
  const [isLoading, setIsLoading] = useState(true)
  const [isVisitsLoading, setIsVisitsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [visitErrorMessage, setVisitErrorMessage] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
      } finally {
        setIsLoading(false)
        setIsVisitsLoading(false)
      }
    }

    loadInitialData()
  }, [])

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
            {activeTab === 'projects' ? projects.length : visits.length}개
          </span>
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
                  <th>방문 시각</th>
                  <th>페이지 URL</th>
                  <th>레퍼러</th>
                  <th>ref 파라미터</th>
                  <th>접속 IP</th>
                  <th>User-Agent</th>
                </tr>
              </thead>
              <tbody>
                {visits.length === 0 && (
                  <tr>
                    <td className="table-empty" colSpan="6">
                      저장된 방문 로그가 없습니다.
                    </td>
                  </tr>
                )}
                {visits.map((visit) => (
                  <tr key={visit.id}>
                    <td className="visit-date-cell">{formatDateTime(visit.visitedAt)}</td>
                    <td className="visit-url-cell">{visit.pageUrl || '-'}</td>
                    <td className="visit-url-cell">{formatReferrer(visit.referrer)}</td>
                    <td>
                      {visit.refParam ? (
                        <span className="ref-badge">{visit.refParam}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{visit.ipAddress || '-'}</td>
                    <td className="user-agent-cell">{visit.userAgent || '-'}</td>
                  </tr>
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
