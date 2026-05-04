import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProjectFormModal from '../components/ProjectFormModal'
import {
  createProject,
  deleteProject,
  fetchProjects,
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
  startDate: project.startDate ? String(project.startDate).split('T')[0] : null,
  endDate: project.endDate ? String(project.endDate).split('T')[0] : null,
  useYn,
})

function AdminPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
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

  useEffect(() => {
    const loadInitialProjects = async () => {
      try {
        const projectList = await fetchProjects()
        setProjects(projectList)
      } catch (error) {
        console.error('Failed to load projects:', error)
        setErrorMessage(error.message || '프로젝트 목록을 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialProjects()
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
            onClick={() => navigate('/')}
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
            <h2 id="admin-heading">프로젝트 목록</h2>
          </div>
          <span className="project-count">{projects.length}개</span>
        </section>

        {isLoading && (
          <div className="empty-state">데이터를 불러오는 중입니다...</div>
        )}
        {!isLoading && errorMessage && (
          <div className="empty-state error-message">{errorMessage}</div>
        )}
        {!isLoading && !errorMessage && (
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
                  <th>수정</th>
                  <th>삭제</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 && (
                  <tr>
                    <td className="table-empty" colSpan="8">
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
