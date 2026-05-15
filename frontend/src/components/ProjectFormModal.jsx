import { useState } from 'react'
import { uploadImage } from '../api/projectApi'

const getDateValue = (date) => {
  if (!date) {
    return ''
  }

  return String(date).split('T')[0]
}

const createEmptyTroubleSolution = () => ({
  title: '',
  content: '',
})

const createEmptyTroubleItem = () => ({
  title: '',
  problem: '',
  solutions: [createEmptyTroubleSolution()],
  selectedSolutionIndex: 0,
  selectedReason: '',
})

const normalizeTroubleSolutions = (solutions) => {
  if (!Array.isArray(solutions)) {
    return []
  }

  return solutions
    .map((solution) => ({
      title: solution?.title?.trim() ?? '',
      content: solution?.content?.trim() ?? '',
    }))
    .filter((solution) => solution.title || solution.content)
}

const normalizeTroubleItems = (items) => {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .map((item) => {
      const solutions = normalizeTroubleSolutions(item?.solutions)
      const rawSelectedSolutionIndex = Number(item?.selectedSolutionIndex ?? 0)
      const selectedSolutionIndex =
        solutions.length > 0 &&
        Number.isInteger(rawSelectedSolutionIndex) &&
        rawSelectedSolutionIndex >= 0 &&
        rawSelectedSolutionIndex < solutions.length
          ? rawSelectedSolutionIndex
          : 0

      return {
        title: item?.title?.trim() ?? '',
        problem: item?.problem?.trim() || item?.content?.trim() || '',
        solutions,
        selectedSolutionIndex,
        selectedReason: item?.selectedReason?.trim() ?? '',
      }
    })
    .filter(
      (item) =>
        item.title ||
        item.problem ||
        item.solutions.length > 0 ||
        item.selectedReason,
    )
}

const prepareTroubleItemsForForm = (items) =>
  items.map((item) => ({
    ...item,
    solutions: item.solutions.length > 0 ? item.solutions : [createEmptyTroubleSolution()],
  }))

const parseTroubleItems = (project) => {
  const responseItems = normalizeTroubleItems(project?.troubleShootingItems)

  if (responseItems.length > 0) {
    return prepareTroubleItemsForForm(responseItems)
  }

  const rawTroubleShooting = project?.troubleShooting?.trim()

  if (!rawTroubleShooting) {
    return [createEmptyTroubleItem()]
  }

  if (rawTroubleShooting.startsWith('[')) {
    try {
      const parsedItems = normalizeTroubleItems(JSON.parse(rawTroubleShooting))

      if (parsedItems.length > 0) {
        return prepareTroubleItemsForForm(parsedItems)
      }
    } catch {
      // Legacy plain text fallback below.
    }
  }

  const legacyItems = rawTroubleShooting
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      title: '',
      problem: line,
      solutions: [createEmptyTroubleSolution()],
      selectedSolutionIndex: 0,
      selectedReason: '',
    }))

  return legacyItems.length > 0 ? legacyItems : [createEmptyTroubleItem()]
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
  troubleShootingItems: parseTroubleItems(project),
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
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }))
  }

  const handleTroubleItemChange = (targetIndex, field, value) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      troubleShootingItems: currentFormData.troubleShootingItems.map((item, index) =>
        index === targetIndex
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    }))
  }

  const handleAddTroubleItem = () => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      troubleShootingItems: [...currentFormData.troubleShootingItems, createEmptyTroubleItem()],
    }))
  }

  const handleRemoveTroubleItem = (targetIndex) => {
    setFormData((currentFormData) => {
      if (currentFormData.troubleShootingItems.length <= 1) {
        return currentFormData
      }

      return {
        ...currentFormData,
        troubleShootingItems: currentFormData.troubleShootingItems.filter(
          (_, index) => index !== targetIndex,
        ),
      }
    })
  }

  const handleTroubleSolutionChange = (troubleIndex, solutionIndex, field, value) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      troubleShootingItems: currentFormData.troubleShootingItems.map((item, index) =>
        index === troubleIndex
          ? {
              ...item,
              solutions: item.solutions.map((solution, currentSolutionIndex) =>
                currentSolutionIndex === solutionIndex
                  ? {
                      ...solution,
                      [field]: value,
                    }
                  : solution,
              ),
            }
          : item,
      ),
    }))
  }

  const handleAddTroubleSolution = (troubleIndex) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      troubleShootingItems: currentFormData.troubleShootingItems.map((item, index) =>
        index === troubleIndex
          ? {
              ...item,
              solutions: [...item.solutions, createEmptyTroubleSolution()],
            }
          : item,
      ),
    }))
  }

  const handleRemoveTroubleSolution = (troubleIndex, solutionIndex) => {
    setFormData((currentFormData) => ({
      ...currentFormData,
      troubleShootingItems: currentFormData.troubleShootingItems.map((item, index) => {
        if (index !== troubleIndex || item.solutions.length <= 1) {
          return item
        }

        const nextSolutions = item.solutions.filter(
          (_, currentSolutionIndex) => currentSolutionIndex !== solutionIndex,
        )
        const nextSelectedSolutionIndex =
          item.selectedSolutionIndex >= nextSolutions.length
            ? Math.max(nextSolutions.length - 1, 0)
            : item.selectedSolutionIndex > solutionIndex
              ? item.selectedSolutionIndex - 1
              : item.selectedSolutionIndex

        return {
          ...item,
          solutions: nextSolutions,
          selectedSolutionIndex: nextSelectedSolutionIndex,
        }
      }),
    }))
  }

  const handleThumbnailFileChange = async (event) => {
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

    try {
      setIsUploadingImage(true)
      const uploadedImage = await uploadImage(file)
      setFormData((currentFormData) => ({
        ...currentFormData,
        thumbnailUrl: uploadedImage.url,
      }))
    } catch (error) {
      console.error('Failed to upload thumbnail image:', error)
      alert(error.message || '썸네일 이미지 업로드에 실패했습니다.')
    } finally {
      setIsUploadingImage(false)
      event.target.value = ''
    }
  }

  const handleFeatureImageFileChange = async (event) => {
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

    try {
      setIsUploadingImage(true)
      const imageUrls = await Promise.all(
        files.map((file) => uploadImage(file).then((uploadedImage) => uploadedImage.url)),
      )

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
    } catch (error) {
      console.error('Failed to upload feature images:', error)
      alert(error.message || '기능 이미지 업로드에 실패했습니다.')
    } finally {
      setIsUploadingImage(false)
      event.target.value = ''
    }
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

    const troubleShootingItems = normalizeTroubleItems(formData.troubleShootingItems)
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
      troubleShooting: troubleShootingItems.length > 0 ? JSON.stringify(troubleShootingItems) : null,
      troubleShootingItems,
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
                disabled={isUploadingImage}
              />
              <label className="file-pick-button">
                {isUploadingImage ? '업로드 중...' : '파일 선택'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailFileChange}
                  disabled={isUploadingImage}
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
                disabled={isUploadingImage}
              />
              <button
                className="feature-url-add-button"
                type="button"
                onClick={handleAddFeatureImageUrls}
                disabled={isUploadingImage}
              >
                추가
              </button>
              <label className="file-pick-button">
                {isUploadingImage ? '업로드 중...' : '파일 추가'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFeatureImageFileChange}
                  disabled={isUploadingImage}
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

          <div className="form-field trouble-shooting-manager">
            <div className="trouble-shooting-manager-header">
              <div>
                <span>트러블슈팅</span>
                <small>문제, 검토한 방안, 최종 선택 이유를 함께 기록합니다.</small>
              </div>
              <button
                className="trouble-item-button trouble-item-button--add"
                type="button"
                onClick={handleAddTroubleItem}
                aria-label="트러블슈팅 항목 추가"
                title="항목 추가"
              >
                +
              </button>
            </div>

            <div className="trouble-item-list">
              {formData.troubleShootingItems.map((item, index) => (
                <div className="trouble-item-editor" key={index}>
                  <div className="trouble-item-editor-fields">
                    <div className="trouble-item-editor-header">
                      <span>Issue {index + 1}</span>
                      <input
                        name="troubleTitle"
                        type="text"
                        value={item.title}
                        onChange={(event) =>
                          handleTroubleItemChange(index, 'title', event.target.value)
                        }
                        placeholder="제목 예: 이미지 업로드 실패"
                      />
                    </div>

                    <label className="trouble-note-field">
                      <span>문제 상황</span>
                      <textarea
                        name="troubleProblem"
                        rows="4"
                        value={item.problem}
                        onChange={(event) =>
                          handleTroubleItemChange(index, 'problem', event.target.value)
                        }
                        placeholder="현상, 원인, 영향 범위를 정리하세요."
                      />
                    </label>

                    <div className="trouble-solution-block">
                      <div className="trouble-solution-header">
                        <div>
                          <span>해결 방안 검토</span>
                          <small>라디오 버튼으로 최종 채택 방안을 표시하세요.</small>
                        </div>
                        <button
                          className="trouble-inline-button"
                          type="button"
                          onClick={() => handleAddTroubleSolution(index)}
                          aria-label="해결 방안 추가"
                          title="해결 방안 추가"
                        >
                          +
                        </button>
                      </div>

                      <div className="trouble-solution-list">
                        {item.solutions.map((solution, solutionIndex) => (
                          <div
                            className={`trouble-solution-editor ${
                              item.selectedSolutionIndex === solutionIndex
                                ? 'is-selected'
                                : ''
                            }`}
                            key={solutionIndex}
                          >
                            <label className="trouble-solution-choice">
                              <input
                                type="radio"
                                name={`selectedTroubleSolution-${index}`}
                                checked={item.selectedSolutionIndex === solutionIndex}
                                onChange={() =>
                                  handleTroubleItemChange(
                                    index,
                                    'selectedSolutionIndex',
                                    solutionIndex,
                                  )
                                }
                              />
                              <span className="trouble-solution-radio" aria-hidden="true" />
                              <span className="trouble-solution-choice-text">최종 선택</span>
                            </label>
                            <div className="trouble-solution-fields">
                              {item.selectedSolutionIndex === solutionIndex && (
                                <span className="trouble-selected-badge">Selected</span>
                              )}
                              <input
                                name="troubleSolutionTitle"
                                type="text"
                                value={solution.title}
                                onChange={(event) =>
                                  handleTroubleSolutionChange(
                                    index,
                                    solutionIndex,
                                    'title',
                                    event.target.value,
                                  )
                                }
                                placeholder={`방안 ${solutionIndex + 1} 예: 서버 측 검증 로직 추가`}
                              />
                              <textarea
                                name="troubleSolutionContent"
                                rows="3"
                                value={solution.content}
                                onChange={(event) =>
                                  handleTroubleSolutionChange(
                                    index,
                                    solutionIndex,
                                    'content',
                                    event.target.value,
                                  )
                                }
                                placeholder="장점, 단점, 비용, 적용 범위를 함께 적어두세요."
                              />
                            </div>
                            <button
                              className="trouble-inline-button trouble-inline-button--remove"
                              type="button"
                              onClick={() => handleRemoveTroubleSolution(index, solutionIndex)}
                              disabled={item.solutions.length <= 1}
                              aria-label="해결 방안 삭제"
                              title="해결 방안 삭제"
                            >
                              -
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <label className="trouble-note-field trouble-note-field--decision">
                      <span>채택 이유 및 결과</span>
                      <textarea
                        name="troubleSelectedReason"
                        rows="3"
                        value={item.selectedReason}
                        onChange={(event) =>
                          handleTroubleItemChange(index, 'selectedReason', event.target.value)
                        }
                        placeholder="왜 이 방안을 선택했는지, 적용 후 어떤 결과가 있었는지 적으세요."
                      />
                    </label>
                  </div>
                  <button
                    className="trouble-item-button trouble-item-button--remove"
                    type="button"
                    onClick={() => handleRemoveTroubleItem(index)}
                    disabled={formData.troubleShootingItems.length <= 1}
                    aria-label="트러블슈팅 항목 삭제"
                    title="항목 삭제"
                  >
                    -
                  </button>
                </div>
              ))}
            </div>
          </div>

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
            <button className="primary-button" type="submit" disabled={isSubmitting || isUploadingImage}>
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default ProjectFormModal
