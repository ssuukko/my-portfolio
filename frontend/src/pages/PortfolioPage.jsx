import { memo, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  buildApiUrl,
  fetchProjectSummaries,
  fetchStaticProjectSummaries,
  logVisit,
} from '../api/projectApi'

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

const mergeProjects = (snapshotProjects, liveProjects) => {
  const snapshotById = new Map(
    snapshotProjects
      .filter((project) => project.id)
      .map((project) => [project.id, project]),
  )
  const liveIds = new Set(liveProjects.map((project) => project.id).filter(Boolean))
  const mergedProjects = liveProjects
    .filter(isProjectEnabled)
    .map((project) => {
      const snapshotProject = snapshotById.get(project.id)

      return {
        ...snapshotProject,
        ...project,
        thumbnailUrl: project.thumbnailUrl || snapshotProject?.thumbnailUrl || '',
      }
    })

  snapshotProjects.forEach((project) => {
    if (project.id && !liveIds.has(project.id) && isProjectEnabled(project)) {
      mergedProjects.push(project)
    }
  })

  return mergedProjects
}

const getProjectThumbnailUrl = (project) => (
  project.thumbnailUrl || (
    project.id
      ? buildApiUrl(
          `/api/projects/${project.id}/thumbnail?v=${encodeURIComponent(project.updatedAt ?? '')}`,
          { cached: true },
        )
      : ''
  )
)

const isAdminVisit = () => {
  const searchParams = new URLSearchParams(window.location.search)
  const refParam = searchParams.get('ref')?.trim() ?? ''

  return (
    refParam === 'admin' ||
    window.sessionStorage.getItem('portfolioAdminSession') === 'true'
  )
}

/* ── SVG Icons ── */
const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
)

function ProjectThumbnail({ alt, initial, src }) {
  const [retryCount, setRetryCount] = useState(0)
  const [status, setStatus] = useState(src ? 'loading' : 'empty')

  const retrySrc = useMemo(() => {
    if (!src || retryCount === 0) {
      return src
    }

    const separator = src.includes('?') ? '&' : '?'
    return `${src}${separator}retry=${retryCount}`
  }, [retryCount, src])

  if (!src || status === 'error') {
    return (
      <div className="pd-hero__placeholder">
        <span>{initial}</span>
      </div>
    )
  }

  return (
    <>
      {status === 'loading' && <div className="pf-card__skeleton" aria-hidden="true" />}
      <img
        className={`pf-card__img${status === 'loaded' ? ' is-loaded' : ''}`}
        src={retrySrc}
        alt={alt}
        width="1280"
        height="800"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        onLoad={() => setStatus('loaded')}
        onError={() => {
          if (retryCount < 2) {
            window.setTimeout(() => setRetryCount((count) => count + 1), 350 * (retryCount + 1))
            return
          }

          setStatus('error')
        }}
      />
    </>
  )
}

const ProjectCard = memo(function ProjectCard({ onOpen, project }) {
  const thumbnailUrl = getProjectThumbnailUrl(project)

  return (
    <article
      className="pf-card"
      key={project.id ?? project.title}
      onClick={onOpen}
    >
      <div className="pf-card__media">
        <ProjectThumbnail
          alt={`${project.title} 썸네일`}
          initial={getProjectInitial(project.title)}
          key={thumbnailUrl || project.id || project.title}
          src={thumbnailUrl}
        />
        <div className="pf-card__overlay">
          <span className="pf-card__view-btn">View Case Study</span>
        </div>
      </div>

      <div className="pf-card__content">
        <div className="pf-card__meta">
          <span className="pd-badge pd-badge--muted">
            {formatDate(project.startDate)} — {formatDate(project.endDate)}
          </span>
          {(project.hasPortfolio || project.hasAttachment) && (
            <span className="pd-badge pd-badge--attachment">
              포트폴리오
            </span>
          )}
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
  )
})

function PortfolioPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const isAdminSession = isAdminVisit()

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const refParam = searchParams.get('ref')?.trim() ?? ''
    const shouldSkipVisitLog = isAdminVisit()

    if (!shouldSkipVisitLog) {
      const referrer = refParam || document.referrer || 'direct'

      logVisit({
        pageUrl: window.location.href,
        referrer,
        refParam: refParam || null,
      }).catch((error) => {
        console.error('Failed to log visit:', error)
      })
    }

    const fetchDashboardData = async () => {
      const [snapshotResult, liveResult] = await Promise.allSettled([
        fetchStaticProjectSummaries(),
        fetchProjectSummaries(),
      ])

      const snapshotProjects = snapshotResult.status === 'fulfilled'
        ? snapshotResult.value.filter(isProjectEnabled)
        : []

      if (snapshotResult.status === 'rejected') {
        console.warn('Failed to load static project snapshot:', snapshotResult.reason)
      }

      if (liveResult.status === 'fulfilled') {
        setProjects(mergeProjects(snapshotProjects, liveResult.value))
        setErrorMessage('')
        setIsLoading(false)
        return
      }

      console.error('Failed to connect to server:', liveResult.reason)

      if (snapshotProjects.length > 0) {
        setProjects(snapshotProjects)
        setErrorMessage('')
      } else {
        setErrorMessage(liveResult.reason?.message || '서버에 연결할 수 없습니다.')
      }

      setIsLoading(false)
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
            {projects.map((project) => (
              <ProjectCard
                key={project.id ?? project.title}
                onOpen={() =>
                    navigate(
                      `/projects/${project.id}${
                        isAdminSession ? '?ref=admin' : ''
                      }`,
                    )
                  }
                project={project}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  )
}

export default PortfolioPage
