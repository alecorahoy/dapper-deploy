export function isHeicLike(file) {
  const name = String(file?.name || "").toLowerCase()
  const type = String(file?.type || "").toLowerCase()
  return /\.(heic|heif)$/.test(name) || type.includes("heic") || type.includes("heif")
}

function normalizedJpegName(file) {
  const baseName = String(file?.name || "photo").replace(/\.[a-z0-9]+$/i, "")
  return `${baseName || "photo"}.jpg`
}

function loadImageFromSrc(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onerror = () => reject(new Error("Could not load this image."))
    image.onload = () => resolve(image)
    image.src = src
  })
}

async function decodeBitmap(file) {
  if (typeof createImageBitmap !== "function") {
    throw new Error("This browser cannot decode the selected image with createImageBitmap.")
  }
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" })
  } catch {
    return createImageBitmap(file)
  }
}

export async function ensureBrowserImageFile(file) {
  if (!file || !isHeicLike(file)) return file

  try {
    const { default: heic2any } = await import("heic2any")
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.92,
    })
    const blob = Array.isArray(converted) ? converted[0] : converted
    if (!(blob instanceof Blob)) {
      throw new Error("HEIC conversion did not return an image blob.")
    }
    return new File([blob], normalizedJpegName(file), {
      type: blob.type || "image/jpeg",
      lastModified: file.lastModified || Date.now(),
    })
  } catch (err) {
    console.error("[Dapper Image] HEIC conversion failed", err)
    throw new Error("This HEIC/HEIF photo could not be converted on this device. Please export it as JPG or PNG and try again.")
  }
}

export async function prepareVisionImageFile(file, { maxSide = 1600, quality = 0.88 } = {}) {
  const compatibleFile = await ensureBrowserImageFile(file)
  if (!compatibleFile) return compatibleFile

  const clampSize = (width, height) => {
    if (!width || !height) throw new Error("The selected image has no readable dimensions.")
    const scale = Math.min(1, maxSide / Math.max(width, height))
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
    }
  }

  const renderToJpegFile = async (image, width, height) => {
    const nextSize = clampSize(width, height)
    const canvas = document.createElement("canvas")
    canvas.width = nextSize.width
    canvas.height = nextSize.height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not prepare this image for analysis.")
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
    if (!(blob instanceof Blob)) throw new Error("Could not convert this photo to a compatible JPG.")
    return new File([blob], normalizedJpegName(compatibleFile), {
      type: "image/jpeg",
      lastModified: compatibleFile.lastModified || Date.now(),
    })
  }

  const objectUrl = URL.createObjectURL(compatibleFile)
  try {
    const image = await loadImageFromSrc(objectUrl)
    return renderToJpegFile(image, image.width, image.height)
  } catch (imgErr) {
    try {
      const bitmap = await decodeBitmap(compatibleFile)
      try {
        return await renderToJpegFile(bitmap, bitmap.width, bitmap.height)
      } finally {
        bitmap.close?.()
      }
    } catch (bitmapErr) {
      console.warn("[Dapper Image] Vision file preparation fell back to original file", imgErr, bitmapErr)
      return compatibleFile
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
