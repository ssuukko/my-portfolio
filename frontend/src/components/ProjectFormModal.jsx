import { useState } from 'react'

const getDateValue = (date) => {
  if (!date) {
    return ''
  }

  return String(date).split('T')[0]
}

const createInitialFormData = (project) => ({
  title: project?.title ?? '',
  summary: project?.summary ?? '',
  description: project?.description ?? '',
  thumbnailUrl: project?.thumbnailUrl ?? '',
  featureImageUrls: project?.featureImageUrls ?? '',
  featureImageCaptions: project?.featureImageCaptions ?? '',
  projectUrl: project?.projectUrl ?? '',
  techStack: project?.techStack ?? '',
  githubUrl: project?.githubUrl ?? '',
  deployUrl: project?.deployUrl ?? '',
  myRole: project?.myRole ?? '',
  troubleShooting: project?.troubleShooting ?? '',
  result: project?.result ?? '',
  startDate: getDateValue(project?.startDate),
  endDate: getDateValue(project?.endDate),
  useYn: project?.useYn ?? 'Y',
})

const toNullableText = (value) => {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

const maxThumbnailFileSize = 1024 * 1024
const maxFeatureImageFileSize = 1024 * 1024
const maxFeatureImageCount = 5

const parseImageUrls = (value) =>
  value
    .split('\n')
    .map((url) => url.trim())
    .filter(Boolean)

const parseUrlInput = (value) =>
  value
    .split(/[\n,]+/)
    .map((url) => url.trim())
    .filter(Boolean)

const parseCaptionLines = (value) => value.split('\n')

const syncCaptionsWithImageCount = (captions, imageCount) => {
  const nextCaptions = parseCaptionLines(captions).slice(0, imageCount)

  while (nextCaptions.length < imageCount) {
    nextCaptions.push('')
  }

  return nextCaptions.join('\n')
}

function ProjectFormModal({ project, onClose, onSubmit }) {
  const [formData, setFormData] = useState(() => createInitialFormData(project))
  const [featureImageUrlInput, setFeatureImageUrlInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }))
  }

  const handleThumbnailFileChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 선택할 수 있습니다.')
      event.target.value = ''
      return
    }

    if (file.size > maxThumbnailFileSize) {
      alert('썸네일 이미지는 1MB 이하만 선택할 수 있습니다.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setFormData((currentFormData) => ({
        ...currentFormData,
        thumbnailUrl: String(reader.result),
      }))
    }

    reader.readAsDataURL(file)
  }

  const handleFeatureImageFileChange = (event) => {
    const files = Array.from(event.target.files ?? [])

    if (files.length === 0) {
      return
    }

    const currentUrlCount = parseImageUrls(formData.featureImageUrls).length

    if (currentUrlCount + files.length > maxFeatureImageCount) {
      alert('기능 이미지는 최대 5장까지 등록할 수 있습니다.')
      event.target.value = ''
      return
    }

    const invalidFile = files.find((file) => !file.type.startsWith('image/'))

    if (invalidFile) {
      alert('기능 이미지는 이미지 파일만 선택할 수 있습니다.')
      event.target.value = ''
      return
    }

    const oversizedFile = files.find((file) => file.size > maxFeatureImageFileSize)

    if (oversizedFile) {
      alert('기능 이미지는 각 파일당 1MB 이하만 선택할 수 있습니다.')
      event.target.value = ''
      return
    }

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.readAsDataURL(file)
          }),
      ),
    ).then((imageUrls) => {
      setFormData((currentFormData) => {
        const currentUrls = parseImageUrls(currentFormData.featureImageUrls)

        return {
          ...currentFormData,
          featureImageUrls: [...currentUrls, ...imageUrls].join('\n'),
          featureImageCaptions: syncCaptionsWithImageCount(
            currentFormData.featureImageCaptions,
            currentUrls.length + imageUrls.length,
          ),
        }
      })
    })
  }

  const handleAddFeatureImageUrls = () => {
    const nextInputUrls = parseUrlInput(featureImageUrlInput)

    if (nextInputUrls.length === 0) {
      return
    }

    setFormData((currentFormData) => {
      const currentUrls = parseImageUrls(currentFormData.featureImageUrls)
      const availableCount = maxFeatureImageCount - currentUrls.length
      const urlsToAdd = nextInputUrls.slice(0, availableCount)

      if (urlsToAdd.length === 0) {
        alert('기능 이미지는 최대 5장까지 등록할 수 있습니다.')
        return currentFormData
      }

      if (nextInputUrls.length > availableCount) {
        alert(`기능 이미지는 최대 5장까지 등록할 수 있어 ${urlsToAdd.length}장만 추가합니다.`)
      }

      return {
        ...currentFormData,
        featureImageUrls: [...currentUrls, ...urlsToAdd].join('\n'),
        featureImageCaptions: syncCaptionsWithImageCount(
          currentFormData.featureImageCaptions,
          currentUrls.length + urlsToAdd.length,
        ),
      }
    })

    setFeatureImageUrlInput('')
  }

  const handleFeatureImageUrlInputKeyDown = (event) => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    handleAddFeatureImageUrls()
  }

  const handleFeatureImageUrlChange = (targetIndex, value) => {
    setFormData((currentFormData) => {
      const trimmedValue = value.trim()
      const currentUrls = parseImageUrls(currentFormData.featureImageUrls)
      const currentCaptions = parseCaptionLines(currentFormData.featureImageCaptions)

      if (!trimmedValue) {
        const nextUrls = currentUrls.filter((_, index) => index !== targetIndex)
        const nextCaptions = currentCaptions
          .filter((_, index) => index !== targetIndex)
          .slice(0, nextUrls.length)

        return {
          ...currentFormData,
          featureImageUrls: nextUrls.join('\n'),
          featureImageCaptions: syncCaptionsWithImageCount(
            nextCaptions.join('\n'),
            nextUrls.length,
          ),
        }
      }

      const nextUrls = currentUrls.map((url, index) =>
        index === targetIndex ? trimmedValue : url,
      )

      return {
        ...currentFormData,
        featureImageUrls: nextUrls.join('\n'),
        featureImageCaptions: syncCaptionsWithImageCount(
          currentFormData.featureImageCaptions,
          nextUrls.length,
        ),
      }
    })
  }

  const handleRemoveFeatureImage = (removeIndex) => {
    setFormData((currentFormData) => {
      const nextUrls = parseImageUrls(currentFormData.featureImageUrls).filter(
        (_, index) => index !== removeIndex,
      )
      const nextCaptions = parseCaptionLines(currentFormData.featureImageCaptions)
        .filter((_, index) => index !== removeIndex)
        .slice(0, nextUrls.length)

      return {
        ...currentFormData,
        featureImageUrls: nextUrls.join('\n'),
        featureImageCaptions: syncCaptionsWithImageCount(
          nextCaptions.join('\n'),
          nextUrls.length,
        ),
      }
    })
  }

  const handleFeatureImageCaptionChange = (targetIndex, value) => {
    setFormData((currentFormData) => {
      const imageCount = parseImageUrls(currentFormData.featureImageUrls).length
      const nextCaptions = parseCaptionLines(
        syncCaptionsWithImageCount(currentFormData.featureImageCaptions, imageCount),
      )

      nextCaptions[targetIndex] = value

      return {
        ...currentFormData,
        featureImageCaptions: nextCaptions.join('\n'),
      }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.title.trim()) {
      alert('제목은 필수입니다.')
      return
    }

    if (parseImageUrls(formData.featureImageUrls).length > maxFeatureImageCount) {
      alert('기능 이미지는 최대 5장까지 등록할 수 있습니다.')
      return
    }

    const submitData = {
      title: formData.title.trim(),
      summary: formData.summary,
      description: formData.description,
      thumbnailUrl: formData.thumbnailUrl,
      featureImageUrls: toNullableText(formData.featureImageUrls),
      featureImageCaptions: toNullableText(
        syncCaptionsWithImageCount(
          formData.featureImageCaptions,
          parseImageUrls(formData.featureImageUrls).length,
        ),
      ),
      projectUrl: formData.projectUrl,
      techStack: toNullableText(formData.techStack),
      myRole: toNullableText(formData.myRole),
      troubleShooting: toNullableText(formData.troubleShooting),
      githubUrl: toNullableText(formData.githubUrl),
      deployUrl: toNullableText(formData.deployUrl),
      result: toNullableText(formData.result),
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      useYn: formData.useYn,
    }

    try {
      setIsSubmitting(true)
      await onSubmit(submitData)
    } catch (error) {
      console.error('Failed to submit project form:', error)
      alert(error.message || '프로젝트 저장에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" role="presentation">
      <section className="project-modal" aria-modal="true" role="dialog">
        <div className="modal-header">
          <div>
            <p className="eyebrow">Project</p>
            <h2>{project ? '프로젝트 수정' : '프로젝트 등록'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <form className="project-form" onSubmit={handleSubmit}>
          <label>
            <span>제목</span>
            <input
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>요약</span>
            <input
              name="summary"
              type="text"
              value={formData.summary}
              onChange={handleChange}
            />
          </label>

          <label>
            <span>설명</span>
            <textarea
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
            />
          </label>

          <label>
            <span>썸네일 URL</span>
            <div className="input-with-button">
              <input
                name="thumbnailUrl"
                type="text"
                value={formData.thumbnailUrl}
                onChange={handleChange}
              />
              <label className="file-pick-button">
                파일 선택
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailFileChange}
                />
              </label>
            </div>
          </label>

          {formData.thumbnailUrl && (
            <div className="thumbnail-preview">
              <img src={formData.thumbnailUrl} alt="선택한 썸네일 미리보기" />
            </div>
          )}

          <div className="form-field feature-image-manager">
            <div className="feature-image-manager-header">
              <span>기능 이미지</span>
              <small>
                {parseImageUrls(formData.featureImageUrls).length}/{maxFeatureImageCount}
              </small>
            </div>
            <div className="feature-url-composer">
              <input
                type="text"
                value={featureImageUrlInput}
                onChange={(event) => setFeatureImageUrlInput(event.target.value)}
                onKeyDown={handleFeatureImageUrlInputKeyDown}
                placeholder="이미지 URL 붙여넣기"
              />
              <button
                className="feature-url-add-button"
                type="button"
                onClick={handleAddFeatureImageUrls}
              >
                추가
              </button>
              <label className="file-pick-button">
                파일 추가
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFeatureImageFileChange}
                />
              </label>
            </div>
            <p className="field-hint">
              URL은 Enter로 추가할 수 있고, 여러 URL은 줄바꿈 또는 쉼표로 한 번에 붙여넣을 수 있습니다.
            </p>

            {parseImageUrls(formData.featureImageUrls).length === 0 ? (
              <div className="feature-image-empty">등록된 기능 이미지가 없습니다.</div>
            ) : (
              <div className="feature-image-preview">
                {parseImageUrls(formData.featureImageUrls).map((url, index) => (
                  <div className="feature-image-preview-item" key={`${url}-${index}`}>
                    <div className="feature-image-preview-media">
                      <img src={url} alt={`기능 화면 미리보기 ${index + 1}`} />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeatureImage(index)}
                        aria-label={`기능 이미지 ${index + 1} 삭제`}
                      >
                        ×
                      </button>
                    </div>
                    <input
                      type="text"
                      value={url}
                      onChange={(event) =>
                        handleFeatureImageUrlChange(index, event.target.value)
                      }
                      placeholder={`이미지 ${index + 1} URL`}
                    />
                    <input
                      type="text"
                      value={
                        parseCaptionLines(
                          syncCaptionsWithImageCount(
                            formData.featureImageCaptions,
                            parseImageUrls(formData.featureImageUrls).length,
                          ),
                        )[index] ?? ''
                      }
                      onChange={(event) =>
                        handleFeatureImageCaptionChange(index, event.target.value)
                      }
                      placeholder={`사진 ${index + 1} 짧은 설명`}
                      maxLength="60"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <label>
            <span>프로젝트 URL</span>
            <input
              name="projectUrl"
              type="url"
              value={formData.projectUrl}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </label>

          <label>
            <span>기술 스택</span>
            <input
              name="techStack"
              type="text"
              value={formData.techStack}
              onChange={handleChange}
              placeholder="Java, Spring Boot, React (콤마로 구분)"
            />
          </label>

          <div className="form-row">
            <label>
              <span>GitHub URL</span>
              <input
                name="githubUrl"
                type="text"
                value={formData.githubUrl}
                onChange={handleChange}
              />
            </label>

            <label>
              <span>배포 URL</span>
              <input
                name="deployUrl"
                type="text"
                value={formData.deployUrl}
                onChange={handleChange}
              />
            </label>
          </div>

          <label>
            <span>담당 역할</span>
            <textarea
              name="myRole"
              rows="4"
              value={formData.myRole}
              onChange={handleChange}
              placeholder="담당한 역할을 줄바꿈으로 구분해서 입력"
            />
          </label>

          <label>
            <span>트러블슈팅</span>
            <textarea
              name="troubleShooting"
              rows="4"
              value={formData.troubleShooting}
              onChange={handleChange}
              placeholder="겪었던 문제와 해결 과정을 입력"
            />
          </label>

          <label>
            <span>성과 및 결과</span>
            <textarea
              name="result"
              rows="4"
              value={formData.result}
              onChange={handleChange}
              placeholder="프로젝트 성과를 줄바꿈으로 구분해서 입력"
            />
          </label>

          <div className="form-row">
            <label>
              <span>시작일</span>
              <input
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
              />
            </label>

            <label>
              <span>종료일</span>
              <input
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="form-field">
            <span>사용 여부</span>
            <div className="use-segment" aria-label="프로젝트 사용 여부">
              <button
                className={formData.useYn === 'Y' ? 'active' : ''}
                type="button"
                onClick={() =>
                  setFormData((currentFormData) => ({
                    ...currentFormData,
                    useYn: 'Y',
                  }))
                }
              >
                Y 사용
              </button>
              <button
                className={formData.useYn === 'N' ? 'active off' : ''}
                type="button"
                onClick={() =>
                  setFormData((currentFormData) => ({
                    ...currentFormData,
                    useYn: 'N',
                  }))
                }
              >
                N 미사용
              </button>
            </div>
          </div>

          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose}>
              취소
            </button>
            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default ProjectFormModal
