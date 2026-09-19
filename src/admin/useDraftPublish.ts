import { useEffect, useState } from "react"

import {
  getDraft,
  getPublishErrorMessage,
  getPublishState,
  getSaveErrorMessage,
  isSameContent,
  publish,
  saveDraft,
  subscribe,
  type TvContentKey,
  type TvContentMap,
} from "@/data/tvStore"

const CONFIRMATION_DURATION = 2000

/**
 * Draft → publish state for one editor.
 *
 * - `formValue` is exactly what "Saqlash" would store.
 * - "Saqlash" writes the draft only; the TVs do not change.
 * - "E’lon qilish" publishes the SAVED draft only, so it is blocked while
 *   the form holds unsaved edits.
 */
export function useDraftPublish<K extends TvContentKey>(
  key: K,
  formValue: TvContentMap[K],
  isValid: boolean
) {
  const [savedDraft, setSavedDraft] = useState<TvContentMap[K]>(() =>
    getDraft(key)
  )
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(
    () => getPublishState(key).hasUnpublishedChanges
  )

  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [published, setPublished] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)

  // Another admin tab may publish; keep the unpublished indicator honest.
  useEffect(() => {
    return subscribe(key, () => {
      setHasUnpublishedChanges(
        getPublishState(key).hasUnpublishedChanges
      )
    })
  }, [key])

  const isDirty = !isSameContent(formValue, savedDraft)
  const busy = saving || publishing

  const canSave = isValid && !busy

  const canPublish =
    hasUnpublishedChanges && !isDirty && isValid && !busy

  const handleSave = async () => {
    if (!canSave) {
      return
    }

    setSaving(true)
    setSaveError(null)
    setPublishError(null)
    setPublished(false)

    try {
      await saveDraft(key, formValue)
    } catch (error) {
      setSaveError(getSaveErrorMessage(error))
      return
    } finally {
      setSaving(false)
    }

    setSavedDraft(formValue)
    setHasUnpublishedChanges(getPublishState(key).hasUnpublishedChanges)
    setSaved(true)

    window.setTimeout(() => {
      setSaved(false)
    }, CONFIRMATION_DURATION)
  }

  const handlePublish = async () => {
    if (!canPublish) {
      return
    }

    setPublishing(true)
    setPublishError(null)
    setSaveError(null)
    setSaved(false)

    try {
      await publish(key)
    } catch (error) {
      setPublishError(getPublishErrorMessage(error))
      return
    } finally {
      setPublishing(false)
    }

    setHasUnpublishedChanges(getPublishState(key).hasUnpublishedChanges)
    setPublished(true)

    window.setTimeout(() => {
      setPublished(false)
    }, CONFIRMATION_DURATION)
  }

  return {
    isDirty,
    hasUnpublishedChanges,
    saving,
    publishing,
    saved,
    published,
    saveError,
    publishError,
    canSave,
    canPublish,
    handleSave,
    handlePublish,
  }
}

export type DraftPublishState = ReturnType<typeof useDraftPublish>
