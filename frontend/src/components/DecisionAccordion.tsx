import { useState } from 'react'

interface Option {
  id: string
  number: string
  title: string
  subtitle: string
  description: string
  pros: string[]
  cons: string[]
  chosen?: boolean
  chosenReason?: string
}

interface Props {
  eyebrow: string
  title: string
  problem: string
  options: Option[]
}

type IconProps = {
  className?: string
}

const ChevronRight = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Plus = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const Minus = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const Quote = ({ className }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2H5c-1.25 0-2 .75-2 2v4c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-3 2v6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-3c-1.25 0-2 .75-2 2v4c0 1.25.75 2 2 2h.75c0 3-1.25 4-2.75 4v6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const emphasizeReason = (value: string) => {
  const [first, ...rest] = value.split('. ')

  if (rest.length === 0) {
    return <strong>{value}</strong>
  }

  return (
    <>
      <strong>{first}.</strong> {rest.join('. ')}
    </>
  )
}

function DecisionAccordion({ eyebrow, title, problem, options }: Props) {
  const [openIds, setOpenIds] = useState(() =>
    new Set(options.filter((option) => option.chosen).map((option) => option.id)),
  )

  const toggleOption = (id: string) => {
    setOpenIds((currentOpenIds) => {
      const nextOpenIds = new Set(currentOpenIds)

      if (nextOpenIds.has(id)) {
        nextOpenIds.delete(id)
      } else {
        nextOpenIds.add(id)
      }

      return nextOpenIds
    })
  }

  return (
    <section className="tda-shell" aria-labelledby="decision-accordion-title">
      <style>{decisionAccordionCss}</style>

      <header className="tda-header">
        <p>{eyebrow}</p>
        <h2 id="decision-accordion-title">{title}</h2>
      </header>

      <div className="tda-problem">
        <div>
          <strong>문제 정의</strong>
          <p>{problem}</p>
        </div>
      </div>

      <div className="tda-list">
        {options.map((option) => {
          const isOpen = openIds.has(option.id)

          return (
            <article
              className={`tda-card ${option.chosen ? 'is-chosen' : ''}`}
              key={option.id}
            >
              <button
                className="tda-trigger"
                type="button"
                onClick={() => toggleOption(option.id)}
                aria-expanded={isOpen}
                aria-controls={`decision-panel-${option.id}`}
              >
                <span className="tda-number">{option.number}</span>
                <span className="tda-title-block">
                  <span className="tda-option-title">{option.title}</span>
                  <span className="tda-subtitle">{option.subtitle}</span>
                </span>
                <span className="tda-actions">
                  {option.chosen && (
                    <span className="tda-badge">
                      <span />
                      채택
                    </span>
                  )}
                  <ChevronRight className={`tda-chevron ${isOpen ? 'is-open' : ''}`} />
                </span>
              </button>

              <div
                className={`tda-panel ${isOpen ? 'is-open' : ''}`}
                id={`decision-panel-${option.id}`}
              >
                <div>
                  <div className="tda-body">
                    <p className="tda-description">{option.description}</p>

                    <div className="tda-grid">
                      <div className="tda-column tda-column--pros">
                        <h3>
                          <Plus className="tda-small-icon" />
                          장점
                        </h3>
                        <ul>
                          {option.pros.length > 0 ? (
                            option.pros.map((item) => (
                              <li key={item}>
                                <span />
                                {item}
                              </li>
                            ))
                          ) : (
                            <li className="tda-empty">입력된 장점이 없습니다.</li>
                          )}
                        </ul>
                      </div>

                      <div className="tda-column tda-column--cons">
                        <h3>
                          <Minus className="tda-small-icon" />
                          단점
                        </h3>
                        <ul>
                          {option.cons.length > 0 ? (
                            option.cons.map((item) => (
                              <li key={item}>
                                <span />
                                {item}
                              </li>
                            ))
                          ) : (
                            <li className="tda-empty">입력된 단점이 없습니다.</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {option.chosen && option.chosenReason && (
                      <div className="tda-reason">
                        <Quote className="tda-quote" />
                        <p>{emphasizeReason(option.chosenReason)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

const decisionAccordionCss = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');

.tda-shell,
.tda-shell * {
  box-sizing: border-box;
}

.tda-shell {
  --tda-bg: var(--card, Canvas);
  --tda-surface: var(--paper, color-mix(in srgb, CanvasText 4%, Canvas));
  --tda-surface-strong: var(--paper-deep, color-mix(in srgb, CanvasText 8%, Canvas));
  --tda-text: var(--ink, CanvasText);
  --tda-muted: var(--muted, color-mix(in srgb, CanvasText 58%, Canvas));
  --tda-line: var(--line, color-mix(in srgb, CanvasText 14%, Canvas));
  --tda-line-strong: var(--line-dark, color-mix(in srgb, CanvasText 24%, Canvas));
  --tda-info: var(--accent, Highlight);
  --tda-info-strong: var(--accent-dark, Highlight);
  --tda-info-soft: var(--accent-soft, color-mix(in srgb, Highlight 10%, Canvas));
  --tda-success: var(--green, color-mix(in srgb, CanvasText 70%, Canvas));
  --tda-success-soft: var(--green-soft, color-mix(in srgb, CanvasText 5%, Canvas));
  --tda-danger: var(--rose, color-mix(in srgb, CanvasText 70%, Canvas));
  --tda-danger-soft: var(--rose-soft, color-mix(in srgb, CanvasText 5%, Canvas));
  display: grid;
  gap: 1.15rem;
  color: var(--tda-text);
}

@media (prefers-color-scheme: dark) {
  .tda-shell {
    --tda-bg: var(--card, Canvas);
    --tda-surface: color-mix(in srgb, CanvasText 8%, Canvas);
    --tda-surface-strong: color-mix(in srgb, CanvasText 12%, Canvas);
    --tda-line: color-mix(in srgb, CanvasText 18%, Canvas);
    --tda-line-strong: color-mix(in srgb, CanvasText 28%, Canvas);
    --tda-info-soft: color-mix(in srgb, Highlight 18%, Canvas);
    --tda-success-soft: color-mix(in srgb, var(--tda-success) 14%, Canvas);
    --tda-danger-soft: color-mix(in srgb, var(--tda-danger) 14%, Canvas);
  }
}

.tda-header {
  display: grid;
  gap: 0.25rem;
}

.tda-header p {
  margin: 0;
  color: var(--tda-muted);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.tda-header h2 {
  margin: 0;
  color: var(--tda-text);
  font-size: clamp(1.15rem, 2vw, 1.55rem);
  line-height: 1.25;
  font-weight: 850;
}

.tda-problem {
  position: relative;
  border-left: 0.18rem solid var(--tda-info);
  padding: 0.2rem 0 0.2rem 1rem;
}

.tda-problem p {
  margin: 0.45rem 0 0;
  color: var(--tda-muted);
  font-size: 1.02rem;
  line-height: 1.8;
}

.tda-problem strong {
  display: inline-flex;
  color: var(--tda-text);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.tda-list {
  display: grid;
  border-top: 1px solid var(--tda-line);
}

.tda-card {
  position: relative;
  display: grid;
  overflow: hidden;
  border-bottom: 1px solid var(--tda-line);
  background: transparent;
}

.tda-card::before {
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 0;
  background: transparent;
  content: '';
}

.tda-card.is-chosen {
  border-bottom-color: color-mix(in srgb, var(--tda-info) 34%, var(--tda-line));
  background: linear-gradient(90deg, var(--tda-info-soft), transparent 38%);
}

.tda-card.is-chosen::before {
  inset: 0 auto 0 0;
  width: 0.18rem;
  height: 100%;
  background: var(--tda-info);
}

.tda-trigger {
  display: grid;
  width: 100%;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.9rem;
  align-items: center;
  border: 0;
  padding: 1.1rem 0.25rem 1.1rem 0;
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.tda-number {
  display: grid;
  width: 2.35rem;
  aspect-ratio: 1;
  place-items: center;
  border: 0;
  border-radius: 999rem;
  color: var(--tda-muted);
  background: transparent;
  font-family: 'DM Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  font-weight: 500;
}

.tda-card.is-chosen .tda-number {
  color: var(--tda-info-strong);
  background: var(--tda-info-soft);
}

.tda-title-block {
  display: grid;
  min-width: 0;
  gap: 0.3rem;
}

.tda-option-title {
  color: var(--tda-text);
  font-size: 1.02rem;
  line-height: 1.35;
  font-weight: 850;
}

.tda-subtitle {
  overflow: hidden;
  color: var(--tda-muted);
  font-family: 'DM Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tda-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
}

.tda-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid color-mix(in srgb, var(--tda-info) 42%, transparent);
  border-radius: 999rem;
  padding: 0.35rem 0.65rem;
  color: var(--tda-info-strong);
  background: var(--tda-info-soft);
  font-size: 0.75rem;
  font-weight: 850;
  white-space: nowrap;
}

.tda-badge span {
  width: 0.45rem;
  aspect-ratio: 1;
  border-radius: 999rem;
  background: var(--tda-info);
  animation: tda-pulse 1.7s ease-in-out infinite;
}

.tda-chevron {
  width: 1.15rem;
  height: 1.15rem;
  color: var(--tda-muted);
  transition: transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.tda-chevron.is-open {
  transform: rotate(90deg);
}

.tda-panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 320ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.tda-panel.is-open {
  grid-template-rows: 1fr;
}

.tda-panel > div {
  overflow: hidden;
}

.tda-body {
  display: grid;
  gap: 1rem;
  padding: 0 0.25rem 1.25rem 3.25rem;
}

.tda-description {
  margin: 0;
  color: var(--tda-muted);
  line-height: 1.75;
}

.tda-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.tda-column {
  display: grid;
  gap: 0.75rem;
  border: 0;
  border-radius: 0;
  padding: 0;
  background: transparent;
}

.tda-column h3 {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.tda-column--pros h3 {
  color: var(--tda-success);
}

.tda-column--cons h3 {
  color: var(--tda-danger);
}

.tda-small-icon {
  width: 0.9rem;
  height: 0.9rem;
}

.tda-column ul {
  display: grid;
  gap: 0.6rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tda-column li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.55rem;
  color: var(--tda-muted);
  line-height: 1.65;
}

.tda-column li span {
  width: 0.45rem;
  aspect-ratio: 1;
  border-radius: 999rem;
  margin-top: 0.55em;
}

.tda-column li.tda-empty {
  display: block;
  color: var(--tda-muted);
  font-style: italic;
}

.tda-column--pros li span {
  background: var(--tda-success);
}

.tda-column--cons li span {
  background: var(--tda-danger);
}

.tda-reason {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.8rem;
  border-left: 0.18rem solid var(--tda-info);
  padding: 0.9rem 1rem;
  background: var(--tda-info-soft);
}

.tda-quote {
  width: 1.1rem;
  height: 1.1rem;
  margin-top: 0.25rem;
  color: var(--tda-info-strong);
}

.tda-reason p {
  margin: 0;
  color: var(--tda-muted);
  line-height: 1.75;
}

.tda-reason strong {
  color: var(--tda-info-strong);
  font-weight: 900;
}

/* Project detail tuned composition */
.tda-shell {
  gap: 1.1rem;
}

.tda-header {
  gap: 0.35rem;
}

.tda-header h2 {
  font-size: clamp(1.25rem, 2.2vw, 1.65rem);
}

.tda-problem {
  border: 1px solid var(--tda-line);
  border-left: 0.28rem solid var(--tda-info);
  border-radius: 0.85rem;
  padding: 1.05rem 1.15rem;
  background: linear-gradient(180deg, var(--tda-bg) 0%, var(--tda-info-soft) 100%);
  box-shadow: 0 0.75rem 1.8rem color-mix(in srgb, CanvasText 5%, transparent);
}

.tda-problem strong {
  color: var(--tda-info-strong);
}

.tda-problem p {
  color: var(--tda-text);
  font-size: 1rem;
}

.tda-list {
  display: grid;
  gap: 0.8rem;
  border-top: 0;
}

.tda-card {
  border: 1px solid var(--tda-line);
  border-radius: 0.8rem;
  background: var(--tda-bg);
  box-shadow: 0 0.55rem 1.4rem color-mix(in srgb, CanvasText 4%, transparent);
}

.tda-card::before {
  inset: 0 auto 0 0;
  width: 0.2rem;
  height: 100%;
  background: var(--tda-line-strong);
  opacity: 0.35;
}

.tda-card.is-chosen {
  border: 2px solid color-mix(in srgb, var(--tda-info) 58%, var(--tda-line));
  background: linear-gradient(180deg, var(--tda-info-soft), var(--tda-bg) 72%);
}

.tda-card.is-chosen::before {
  width: 0.3rem;
  background: var(--tda-info);
  opacity: 1;
}

.tda-trigger {
  padding: 1rem 1rem 1rem 1.15rem;
}

.tda-number {
  border: 1px solid var(--tda-line);
  border-radius: 999rem;
  background: var(--tda-surface);
}

.tda-body {
  border-top: 1px solid var(--tda-line);
  padding: 1rem 1rem 1rem 4.65rem;
}

.tda-description {
  padding-top: 0;
}

.tda-column {
  border: 1px solid var(--tda-line);
  border-radius: 0.75rem;
  padding: 0.9rem;
  background: var(--tda-surface);
}

.tda-reason {
  border: 1px solid color-mix(in srgb, var(--tda-info) 28%, transparent);
  border-left: 0.28rem solid var(--tda-info);
  border-radius: 0.75rem;
  background: var(--tda-info-soft);
}

@keyframes tda-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--tda-info) 36%, transparent);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 0.35rem transparent;
    transform: scale(0.92);
  }
}

  @media (max-width: 42rem) {
  .tda-trigger {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .tda-actions {
    grid-column: 2;
    justify-content: space-between;
  }

  .tda-body {
    padding-left: 1rem;
  }

  .tda-grid {
    grid-template-columns: 1fr;
  }
}
`

const demoOptions: Option[] = [
  {
    id: 'static-snapshot',
    number: '01',
    title: '정적 스냅샷 우선 로드',
    subtitle: 'STATIC_SNAPSHOT_FIRST',
    description:
      '포트폴리오 목록을 Vercel CDN의 정적 JSON으로 먼저 렌더링하고, 백그라운드에서 API 응답을 병합하는 방식입니다.',
    pros: ['초기 렌더링이 빠르다', '백엔드 콜드 스타트 영향을 줄인다', 'API 실패 시에도 기본 목록을 유지한다'],
    cons: ['정적 데이터와 라이브 데이터 병합 로직이 필요하다', '스냅샷 생성용 인증 정보 관리가 필요하다'],
    chosen: true,
    chosenReason:
      '첫 화면 속도와 데이터 최신성을 동시에 만족할 수 있는 방식입니다. 정적 스냅샷으로 즉시 보여주고, API로 최신 데이터를 보정해 사용자 경험과 운영 편의성을 모두 확보했습니다.',
  },
  {
    id: 'api-only',
    number: '02',
    title: 'API 단일 조회',
    subtitle: 'API_ONLY',
    description:
      '모든 프로젝트 목록을 백엔드 API에서만 조회해 항상 최신 데이터를 사용하는 방식입니다.',
    pros: ['데이터가 항상 최신이다', '스냅샷 생성과 배포 훅이 필요 없다'],
    cons: ['백엔드 지연이 첫 화면에 직접 반영된다', '콜드 스타트 시 로딩 시간이 길어진다'],
  },
  {
    id: 'static-only',
    number: '03',
    title: '정적 파일 단독 사용',
    subtitle: 'STATIC_ONLY',
    description:
      '빌드 시 생성한 정적 JSON만 사용해 백엔드 호출 없이 목록 화면을 구성하는 방식입니다.',
    pros: ['구조가 단순하고 빠르다', '백엔드 장애와 무관하게 목록을 보여줄 수 있다'],
    cons: ['재배포 전까지 수정 사항이 반영되지 않는다', '상세 데이터와 목록 데이터가 어긋날 수 있다'],
  },
]

const demoProps: Props = {
  eyebrow: '기술 의사결정',
  title: '포트폴리오 목록 로딩 전략',
  problem:
    'Render 백엔드의 콜드 스타트로 인해 첫 화면 로딩이 느려질 수 있었고, 동시에 관리자 수정 사항은 최신 상태로 반영되어야 했습니다. 즉, 초기 속도와 데이터 최신성을 함께 만족해야 했습니다.',
  options: demoOptions,
}

export default function DecisionAccordionDemo() {
  return <DecisionAccordion {...demoProps} />
}

export { DecisionAccordion }
export type { Option as DecisionAccordionOption, Props as DecisionAccordionProps }
