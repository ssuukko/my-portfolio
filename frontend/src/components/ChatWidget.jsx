import { useEffect, useRef, useState } from 'react'
import { buildApiUrl } from '../api/projectApi'

const initialMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    text: '안녕하세요. 포트폴리오의 프로젝트 경험과 기술 역량에 대해 궁금한 점을 물어봐주세요.',
  },
]

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedMessage = message.trim()
    if (!trimmedMessage || isLoading) {
      return
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmedMessage,
    }

    setMessages((currentMessages) => [...currentMessages, userMessage])
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(buildApiUrl('/api/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmedMessage }),
      })

      const data = await response.json()

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message ?? '챗봇 응답을 가져오지 못했습니다.')
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: data?.data ?? '답변할 수 있는 내용이 없습니다.',
        },
      ])
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: error.message || '챗봇 서버와 통신하지 못했습니다.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-widget" aria-live="polite">
      {isOpen && (
        <section className="chat-panel" aria-label="포트폴리오 챗봇">
          <header className="chat-panel-header">
            <div>
              <strong>Portfolio AI</strong>
              <span>프로젝트 기반 답변</span>
            </div>
            <button
              className="chat-close-button"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="채팅창 닫기"
            >
              x
            </button>
          </header>

          <div className="chat-messages">
            {messages.map((chatMessage) => (
              <div
                className={`chat-message ${chatMessage.role}`}
                key={chatMessage.id}
              >
                {chatMessage.text}
              </div>
            ))}
            {isLoading && (
              <div className="chat-message assistant loading">
                답변을 생성하는 중입니다...
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form className="chat-form" onSubmit={handleSubmit}>
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="프로젝트에 대해 질문하기"
              aria-label="챗봇 질문"
              disabled={isLoading}
            />
            <button type="submit" disabled={!message.trim() || isLoading}>
              전송
            </button>
          </form>
        </section>
      )}

      <button
        className="chat-toggle-button"
        type="button"
        onClick={() => setIsOpen((currentIsOpen) => !currentIsOpen)}
        aria-label={isOpen ? '채팅창 닫기' : '채팅창 열기'}
        aria-expanded={isOpen}
      >
        {isOpen ? 'x' : 'AI'}
      </button>

      <style>{`
        .chat-widget {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 50;
          font-family: var(--sans);
        }

        .chat-toggle-button,
        .chat-close-button,
        .chat-form button {
          font: inherit;
          cursor: pointer;
        }

        .chat-toggle-button {
          width: 58px;
          height: 58px;
          border: 0;
          border-radius: 999px;
          color: #ffffff;
          background: var(--accent);
          box-shadow: var(--shadow);
          font-size: 17px;
          font-weight: 850;
          line-height: 1;
          transition:
            transform 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        .chat-toggle-button:hover {
          background: var(--accent-dark);
          transform: translateY(-1px);
        }

        .chat-panel {
          position: absolute;
          right: 0;
          bottom: 74px;
          display: grid;
          grid-template-rows: auto 1fr auto;
          width: min(360px, calc(100vw - 32px));
          height: min(520px, calc(100svh - 120px));
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: var(--card);
          box-shadow: var(--shadow);
        }

        .chat-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 18px;
          border-bottom: 1px solid var(--line);
          background: #ffffff;
        }

        .chat-panel-header div {
          display: grid;
          gap: 3px;
        }

        .chat-panel-header strong {
          color: var(--ink);
          font-size: 15px;
          font-weight: 850;
        }

        .chat-panel-header span {
          color: var(--muted);
          font-size: 12px;
          font-weight: 700;
        }

        .chat-close-button {
          width: 30px;
          height: 30px;
          border: 1px solid var(--line);
          border-radius: 999px;
          color: var(--muted);
          background: var(--paper);
          font-weight: 850;
          line-height: 1;
        }

        .chat-messages {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 0;
          padding: 16px;
          overflow-y: auto;
          background: var(--paper);
        }

        .chat-message {
          max-width: 84%;
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: 8px;
          color: var(--ink);
          background: #ffffff;
          font-size: 14px;
          line-height: 1.55;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .chat-message.user {
          align-self: flex-end;
          border-color: var(--accent);
          color: #ffffff;
          background: var(--accent);
        }

        .chat-message.assistant {
          align-self: flex-start;
        }

        .chat-message.loading {
          color: var(--muted);
          font-size: 13px;
        }

        .chat-form {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          padding: 12px;
          border-top: 1px solid var(--line);
          background: #ffffff;
        }

        .chat-form input {
          min-width: 0;
          height: 42px;
          padding: 0 13px;
          border: 1px solid var(--line-dark);
          border-radius: 999px;
          color: var(--ink);
          background: #ffffff;
          outline: none;
        }

        .chat-form input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }

        .chat-form button {
          min-width: 58px;
          height: 42px;
          border: 0;
          border-radius: 999px;
          color: #ffffff;
          background: var(--accent);
          font-size: 14px;
          font-weight: 850;
        }

        .chat-form button:disabled,
        .chat-form input:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        @media (max-width: 640px) {
          .chat-widget {
            right: max(14px, env(safe-area-inset-right));
            bottom: max(14px, env(safe-area-inset-bottom));
          }

          .chat-panel {
            position: fixed;
            left: 12px;
            right: 12px;
            bottom: calc(78px + env(safe-area-inset-bottom));
            width: auto;
            height: min(560px, calc(100svh - 104px - env(safe-area-inset-bottom)));
            max-height: calc(100svh - 104px - env(safe-area-inset-bottom));
          }

          .chat-panel-header {
            padding: 14px 14px;
          }

          .chat-messages {
            padding: 12px;
          }

          .chat-message {
            max-width: 90%;
            font-size: 13px;
          }

          .chat-form {
            grid-template-columns: minmax(0, 1fr) auto;
            padding: 10px;
          }

          .chat-form input {
            height: 40px;
          }

          .chat-form button {
            min-width: 52px;
            height: 40px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  )
}

export default ChatWidget
