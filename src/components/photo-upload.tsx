"use client"

import { useState } from "react"
import { generateReactHelpers } from "@uploadthing/react"
import type { OurFileRouter } from "@/lib/uploadthing"

const { useUploadThing } = generateReactHelpers<OurFileRouter>()

export function PhotoUpload() {
  const [urls, setUrls] = useState<string[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const { startUpload, isUploading } = useUploadThing("sightingPhoto", {
    onClientUploadComplete: (res) => {
      const newUrls = res.map((r) => r.ufsUrl)
      setUrls((prev) => [...prev, ...newUrls])
    },
  })

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    // Local previews
    files.forEach((f) => {
      const reader = new FileReader()
      reader.onload = (ev) =>
        setPreviews((prev) => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })

    startUpload(files)
  }

  function removePhoto(idx: number) {
    setUrls((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <div>
      {previews.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {previews.map((src, i) => (
            <div key={i} className="relative">
              <img
                src={src}
                alt=""
                className="w-20 h-20 object-cover border border-black"
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute -top-1.5 -right-1.5 bg-white border border-black w-5 h-5 text-xs text-black hover:bg-black hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="flex items-center gap-2 cursor-pointer text-sm text-black hover:text-gray-700">
        <span className="border border-dashed border-black px-4 py-2 hover:bg-gray-50 transition-colors">
          {isUploading ? "Uploading…" : "📷 Add photos (up to 4)"}
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={isUploading || urls.length >= 4}
          onChange={handleFiles}
        />
      </label>

      {/* Hidden inputs carry URLs into the FormData */}
      {urls.map((url, i) => (
        <input key={i} type="hidden" name="photoUrls" value={url} />
      ))}
    </div>
  )
}
