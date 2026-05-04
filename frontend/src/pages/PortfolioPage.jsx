import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProjects } from '../api/projectApi'

const formatDate = (date) => {
  if (!date) {
    return '진행 중'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

const isProjectEnabled = (project) => project.useYn !== 'N'

const getProjectInitial = (title) => title?.trim()?.slice(0, 1) || 'P'

/* ── SVG Icons ── */
const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

function PortfolioPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const projectList = await fetchProjects()
        setProjects(projectList.filter(isProjectEnabled))
      } catch (error) {
        console.error('Failed to connect to server:', error)
        setErrorMessage('서버에 연결할 수 없습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="pd-page">
      {/* ── Floating Header ── */}
      <header className="pd-topbar pf-header">
        <div className="pf-brand">
          <span className="pf-brand__logo">M</span>
          <span className="pf-brand__name">My Portfolio</span>
        </div>
      </header>

      <main className="pf-main">
        {/* ── Hero Section ── */}
        <section className="pf-hero pd-reveal" aria-labelledby="portfolio-heading">
          <span className="pd-overline">Selected Works</span>
          <h1 id="portfolio-heading" className="pf-hero__title">
            Projects that show<br/>how I build.
          </h1>
          <p className="pf-hero__desc">
            구현 과정, 문제 해결, 결과까지 한눈에 볼 수 있도록 정리한
            포트폴리오 프로젝트입니다.
          </p>
        </section>

        {/* ── Status Messages ── */}
        {isLoading && (
          <div className="pd-loader">
            <div className="pd-loader__spinner" />
            <p>프로젝트를 불러오는 중...</p>
          </div>
        )}
        {!isLoading && errorMessage && (
          <div className="pd-error">
            <span className="pd-error__icon">!</span>
            <p>{errorMessage}</p>
          </div>
        )}
        {!isLoading && !errorMessage && projects.length === 0 && (
          <div className="pd-error">
             <span className="pd-error__icon">?</span>
            <p>등록된 프로젝트가 없습니다.</p>
          </div>
        )}

        {/* ── Project Grid ── */}
        {!isLoading && !errorMessage && projects.length > 0 && (
          <section className="pf-gallery" aria-label="프로젝트 목록">
            {projects.map((project, index) => (
              <article
                className="pf-card pd-reveal"
                style={{ animationDelay: `${index * 0.1}s` }}
                key={project.id ?? project.title}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="pf-card__media">
                  {project.thumbnailUrl ? (
                    <img className="pf-card__img" src={project.thumbnailUrl} alt={`${project.title} 썸네일`} />
                  ) : (
                    <div className="pd-hero__placeholder">
                      <span>{getProjectInitial(project.title)}</span>
                    </div>
                  )}
                  <div className="pf-card__overlay">
                    <span className="pf-card__view-btn">View Case Study</span>
                  </div>
                </div>
                
                <div className="pf-card__content">
                  <div className="pf-card__meta">
                    <span className="pd-badge pd-badge--muted">
                      {formatDate(project.startDate)} — {formatDate(project.endDate)}
                    </span>
                  </div>
                  
                  <h2 className="pf-card__title">{project.title}</h2>
                  <p className="pf-card__summary">{project.summary || '프로젝트 상세 내용을 확인해 보세요.'}</p>
                  
                  <div className="pf-card__footer">
                    <span className="pf-link-text">
                      자세히 보기 <ArrowRightIcon />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}

export default PortfolioPage
