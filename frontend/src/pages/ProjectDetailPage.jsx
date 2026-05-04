import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchProject } from '../api/projectApi'

const formatDate = (date) => {
  if (!date) {
    return '진행 중'
  }

  return String(date).split('T')[0]
}

const hasText = (value) => Boolean(value?.trim())

const splitLines = (value) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const splitTechStack = (value) =>
  value
    .split(',')
    .map((tech) => tech.trim())
    .filter(Boolean)

const splitImageUrls = (value) =>
  value
    .split('\n')
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 5)

const splitCaptions = (value) => value.split('\n').slice(0, 5)

const getPrimaryProjectLink = (project) => {
  if (hasText(project.projectUrl)) {
    return project.projectUrl
  }

  if (hasText(project.deployUrl)) {
    return project.deployUrl
  }

  if (hasText(project.githubUrl)) {
    return project.githubUrl
  }

  return ''
}

/* ── SVG Icons ── */
const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const GithubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
)

const LinkIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)

const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

/* ── Intersection Observer hook for scroll animations ── */
function useReveal() {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, isVisible]
}

/* ── Section component ── */
function DetailSection({ number, label, title, children, wide }) {
  const [ref, isVisible] = useReveal()

  return (
    <section
      ref={ref}
      className={`pd-section ${wide ? 'pd-section--wide' : ''} ${isVisible ? 'pd-reveal' : ''}`}
    >
      <div className="pd-section__header">
        <span className="pd-section__number">{number}</span>
        <div>
          <span className="pd-section__label">{label}</span>
          <h2 className="pd-section__title">{title}</h2>
        </div>
      </div>
      <div className="pd-section__body">{children}</div>
    </section>
  )
}

function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const loadProject = async () => {
      try {
        const projectData = await fetchProject(id)
        setProject(projectData)
      } catch (error) {
        console.error('Failed to load project detail:', error)
        setErrorMessage(error.message || '프로젝트 상세 정보를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()
  }, [id])

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div className="pd-page">
        <div className="pd-loader">
          <div className="pd-loader__spinner" />
          <p>프로젝트를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  /* ── Error state ── */
  if (errorMessage) {
    return (
      <div className="pd-page">
        <div className="pd-error">
          <span className="pd-error__icon">!</span>
          <h2>오류가 발생했습니다</h2>
          <p>{errorMessage}</p>
          <button className="pd-btn pd-btn--secondary" type="button" onClick={() => navigate('/')}>
            <ArrowLeftIcon /> 목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  /* ── Not found state ── */
  if (!project) {
    return (
      <div className="pd-page">
        <div className="pd-error">
          <span className="pd-error__icon">?</span>
          <h2>프로젝트를 찾을 수 없습니다</h2>
          <button className="pd-btn pd-btn--secondary" type="button" onClick={() => navigate('/')}>
            <ArrowLeftIcon /> 목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const primaryProjectLink = getPrimaryProjectLink(project)
  const featureImageUrls = hasText(project.featureImageUrls)
    ? splitImageUrls(project.featureImageUrls)
    : []
  const featureImageCaptions = hasText(project.featureImageCaptions)
    ? splitCaptions(project.featureImageCaptions)
    : []
  const hasTextDetailContent =
    hasText(project.description) ||
    hasText(project.techStack) ||
    hasText(project.myRole) ||
    hasText(project.troubleShooting) ||
    hasText(project.result)
  const hasDetailContent = hasTextDetailContent || featureImageUrls.length > 0

  const detailSectionKeys = [
    hasText(project.techStack) && 'techStack',
    hasText(project.description) && 'description',
    hasText(project.myRole) && 'myRole',
    hasText(project.troubleShooting) && 'troubleShooting',
    hasText(project.result) && 'result',
  ].filter(Boolean)

  const getSectionNumber = (key) =>
    String(detailSectionKeys.indexOf(key) + 1).padStart(2, '0')

  return (
    <div className="pd-page">
      {/* ── Floating back navigation ── */}
      <nav className="pd-topbar" aria-label="상세 페이지 이동">
        <button className="pd-back-btn" type="button" onClick={() => navigate('/')}>
          <ArrowLeftIcon />
          <span>돌아가기</span>
        </button>
      </nav>

      {/* ── Hero section ── */}
      <header className="pd-hero">
        <div className="pd-hero__media">
          {hasText(project.thumbnailUrl) && hasText(primaryProjectLink) && (
            <a
              className="pd-hero__thumb-link"
              href={primaryProjectLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.title} 프로젝트 링크 열기`}
            >
              <img
                className="pd-hero__thumb"
                src={project.thumbnailUrl}
                alt={`${project.title} 썸네일`}
              />
              <div className="pd-hero__thumb-overlay">
                <ExternalLinkIcon /> 프로젝트 보기
              </div>
            </a>
          )}
          {hasText(project.thumbnailUrl) && !hasText(primaryProjectLink) && (
            <img
              className="pd-hero__thumb"
              src={project.thumbnailUrl}
              alt={`${project.title} 썸네일`}
            />
          )}
          {!hasText(project.thumbnailUrl) && (
            <div className="pd-hero__placeholder">
              <span>{project.title?.trim()?.slice(0, 1) || 'P'}</span>
            </div>
          )}
        </div>

        <div className="pd-hero__content">
          <div className="pd-hero__meta">
            <span className="pd-badge pd-badge--accent">Case Study</span>
            <span className="pd-badge pd-badge--muted">
              <CalendarIcon />
              {formatDate(project.startDate)} — {formatDate(project.endDate)}
            </span>
          </div>

          <h1 className="pd-hero__title">{project.title}</h1>

          {hasText(project.summary) && (
            <p className="pd-hero__summary">{project.summary}</p>
          )}

          <div className="pd-hero__actions">
            {hasText(project.githubUrl) && (
              <a
                className="pd-btn pd-btn--dark"
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon /> GitHub
              </a>
            )}
            {hasText(project.projectUrl) && (
              <a
                className="pd-btn pd-btn--primary"
                href={project.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkIcon /> 프로젝트 링크
              </a>
            )}
            {hasText(project.deployUrl) && (
              <a
                className="pd-btn pd-btn--outline"
                href={project.deployUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLinkIcon /> 배포 링크
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── Quick facts strip ── */}
      <div className="pd-facts">
        <div className="pd-facts__item">
          <span className="pd-facts__label">프로젝트 기간</span>
          <span className="pd-facts__value">
            {formatDate(project.startDate)} — {formatDate(project.endDate)}
          </span>
        </div>
        <div className="pd-facts__divider" />
        <div className="pd-facts__item">
          <span className="pd-facts__label">상태</span>
          <span className="pd-facts__value">
            <span className="pd-facts__dot" />
            {project.endDate ? '완료' : '진행 중'}
          </span>
        </div>
        <div className="pd-facts__divider" />
        <div className="pd-facts__item">
          <span className="pd-facts__label">링크</span>
          <span className="pd-facts__value">
            {hasText(primaryProjectLink) ? '외부 링크 연결됨' : '링크 없음'}
          </span>
        </div>
      </div>

      {featureImageUrls.length > 0 && (
        <section className="pd-feature-gallery" aria-labelledby="feature-gallery-title">
          <div className="pd-feature-gallery__header">
            <span className="pd-overline">Screens</span>
            <h2 id="feature-gallery-title">기능 화면</h2>
            <p>프로젝트의 주요 기능과 실제 화면을 이미지로 확인할 수 있습니다.</p>
          </div>
          <div className="pd-feature-gallery__grid">
            {featureImageUrls.map((imageUrl, index) => (
              <figure className="pd-feature-shot" key={`${imageUrl}-${index}`}>
                <img src={imageUrl} alt={`${project.title} 기능 화면 ${index + 1}`} />
                <figcaption>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {featureImageCaptions[index]?.trim() && (
                    <strong>{featureImageCaptions[index].trim()}</strong>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ── Content sections ── */}
      {hasTextDetailContent && (
        <div className="pd-content">
          <div className="pd-content__intro">
            <span className="pd-overline">Deep Dive</span>
            <h2 className="pd-content__heading">프로젝트를 어떻게 만들었는지</h2>
            <p className="pd-content__subtext">
              사용 기술, 구현 내용, 문제 해결 과정, 결과를 순서대로 정리했습니다.
            </p>
          </div>

          <div className="pd-sections">
            {hasText(project.techStack) && (
              <DetailSection
                number={getSectionNumber('techStack')}
                label="사용 기술"
                title="기술 스택"
              >
                <div className="pd-techs">
                  {splitTechStack(project.techStack).map((tech) => (
                    <span className="pd-tech" key={tech}>
                      {tech}
                    </span>
                  ))}
                </div>
              </DetailSection>
            )}

            {hasText(project.description) && (
              <DetailSection
                number={getSectionNumber('description')}
                label="개요"
                title="프로젝트 설명"
                wide
              >
                <div className="pd-prose">
                  {splitLines(project.description).map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </DetailSection>
            )}

            {hasText(project.myRole) && (
              <DetailSection
                number={getSectionNumber('myRole')}
                label="내 작업"
                title="담당 역할"
              >
                <ul className="pd-checklist">
                  {splitLines(project.myRole).map((line) => (
                    <li key={line}>
                      <CheckCircleIcon />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </DetailSection>
            )}

            {hasText(project.troubleShooting) && (
              <DetailSection
                number={getSectionNumber('troubleShooting')}
                label="문제 해결"
                title="트러블슈팅"
                wide
              >
                <div className="pd-prose">
                  {splitLines(project.troubleShooting).map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </DetailSection>
            )}

            {hasText(project.result) && (
              <DetailSection
                number={getSectionNumber('result')}
                label="결과"
                title="성과 및 결과"
              >
                <ul className="pd-checklist pd-checklist--result">
                  {splitLines(project.result).map((line) => (
                    <li key={line}>
                      <CheckCircleIcon />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </DetailSection>
            )}
          </div>
        </div>
      )}

      {!hasDetailContent && (
        <div className="pd-empty-content">
          <span className="pd-overline">Overview</span>
          <h2>상세 내용 준비 중</h2>
          <p>
            관리자 페이지에서 설명, 기술 스택, 담당 역할, 성과를 입력하면 이
            페이지에 자동으로 표시됩니다.
          </p>
        </div>
      )}

      {/* ── Footer CTA ── */}
      <footer className="pd-footer">
        <div className="pd-footer__inner">
          <div className="pd-footer__text">
            <span className="pd-overline">More Work</span>
            <h2>다른 프로젝트도 확인해 보세요</h2>
          </div>
          <div className="pd-footer__actions">
            {hasText(primaryProjectLink) && (
              <a
                className="pd-btn pd-btn--primary"
                href={primaryProjectLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLinkIcon /> 프로젝트 열기
              </a>
            )}
            <button
              className="pd-btn pd-btn--secondary"
              type="button"
              onClick={() => navigate('/')}
            >
              <ArrowLeftIcon /> 목록으로 돌아가기
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default ProjectDetailPage
