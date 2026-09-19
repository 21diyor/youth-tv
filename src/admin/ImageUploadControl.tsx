import { useRef, useState, type ChangeEvent } from "react"

import {
  ACCEPTED_IMAGE_TYPES,
  IMAGE_HINT,
  validateImageFile,
} from "@/data/media"

import { Button } from "@/components/ui/button"

/**
 * "Rasmni almashtirish": pick → validate → upload to private storage →
 * hand the new storage path to the editor's draft form. Nothing reaches
 * the TVs until the draft is saved ("Saqlash") and published.
 */
export function ImageUploadControl({
  upload,
  onUploaded,
  hasPendingImage,
}: {
  upload: (file: File) => Promise<string>
  onUploaded: (path: string) => void
  /** Form holds an uploaded image that is not yet saved to the draft. */
  hasPendingImage: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Allow picking the same file again after an error.
    event.target.value = ""

    if (!file) {
      return
    }

    const invalid = validateImageFile(file)

    if (invalid) {
      setError(invalid)
      return
    }

    setUploading(true)
    setError(null)

    try {
      onUploaded(await upload(file))
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Rasmni yuklab bo‘lmadi. Qayta urinib ko‘ring."
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        className="hidden"
        onChange={handleChange}
      />

      <Button
        variant="outline"
        className="w-full"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Yuklanmoqda…" : "Rasmni almashtirish"}
      </Button>

      <p
        className={`mt-[9px] text-[10px] leading-[1.5] ${
          error ? "font-medium text-red-600" : "text-neutral-400"
        }`}
      >
        {error ??
          (hasPendingImage
            ? "Yangi rasm yuklandi. TV’da ko‘rinishi uchun saqlang va e’lon qiling."
            : IMAGE_HINT)}
      </p>
    </>
  )
}
