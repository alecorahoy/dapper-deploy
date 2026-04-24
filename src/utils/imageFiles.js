export function isHeicLike(file) {
  const name = String(file?.name || "").toLowerCase()
  const type = String(file?.type || "").toLowerCase()
  return /\.(heic|heif)$/.test(name) || type.includes("heic") || type.includes("heif")
}

// Detect HEIC/HEIF by magic bytes even when the file claims to be JPEG/PNG.
// iPhones sometimes save files with a .jpeg extension and image/jpeg MIME
// that are actually HEIC internally — browsers can't decode them and Claude
// rejects them with "Could not process image". Real JPEGs start with FFD8FF.
// HEIC/HEIF files start with `....ftypheic/heix/hevc/mif1/msf1/heim/hevm/hevs`.
async function sniffActualMediaType(file) {
  if (!file || typeof file.slice !== "function") return null
  try {
    const head = await file.slice(0, 16).arrayBuffer()
    const bytes = new Uint8Array(head)
    if (bytes.length < 12) return null
    // JPEG SOI = FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return "image/jpeg"
    // PNG = 89 50 4E 47 0D 0A 1A 0A
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return "image/png"
    // WebP = RIFF....WEBP
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp"
    // GIF = GIF87a / GIF89a
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif"
    // ISO BMFF container — HEIC/HEIF/MP4 etc. Offset 4..7 = "ftyp", offset 8..11 = brand.
    if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
      const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11])
      const heicBrands = new Set(["heic", "heix", "heim", "heis", "hevc", "hevm", "hevs", "mif1", "msf1"])
      if (heicBrands.has(brand)) return "image/heic"
    }
  } catch (err) {
    console.warn("[Dapper Image] Magic-byte sniff failed", err)
  }
  return null
}

export async function isActuallyHeic(file) {
  if (!file) return false
  if (isHeicLike(file)) return true
  const sniffed = await sniffActualMediaType(file)
  return sniffed === "image/heic"
}

const PREPARED_JPEG_SUFFIX = "-dapper-ready"

function normalizedJpegName(file) {
  const baseName = String(file?.name || "photo")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(new RegExp(`${PREPARED_JPEG_SUFFIX}$`, "i"), "")
  return `${baseName || "photo"}${PREPARED_JPEG_SUFFIX}.jpg`
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Could not read this image."))
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

function dataUrlToBlob(dataUrl) {
  const [meta, data] = String(dataUrl || "").split(",")
  const mime = meta?.match(/data:(.*?);base64/i)?.[1] || "image/jpeg"
  if (!data) throw new Error("Could not convert this photo to a compatible JPG.")
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function isPreparedJpeg(file) {
  const name = String(file?.name || "").toLowerCase()
  const type = String(file?.type || "").toLowerCase()
  return type === "image/jpeg" && name.endsWith(`${PREPARED_JPEG_SUFFIX}.jpg`)
}

export async function ensureBrowserImageFile(file) {
  if (!file) return file
  const declaredHeic = isHeicLike(file)
  const sniffedType = declaredHeic ? "image/heic" : await sniffActualMediaType(file)
  const needsHeicConversion = declaredHeic || sniffedType === "image/heic"
  if (!needsHeicConversion) return file

  if (!declaredHeic) {
    console.warn("[Dapper Image] File claims to be", file.type || "(no type)",
      "but magic bytes indicate HEIC — converting via heic2any", { name: file.name, size: file.size })
  }

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
  if (isPreparedJpeg(compatibleFile)) return compatibleFile

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
    let blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
    if (!(blob instanceof Blob)) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality)
      blob = dataUrlToBlob(dataUrl)
    }
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
      try {
        const dataUrl = await readFileAsDataUrl(compatibleFile)
        const dataUrlImage = await loadImageFromSrc(dataUrl)
        return await renderToJpegFile(dataUrlImage, dataUrlImage.width, dataUrlImage.height)
      } catch (dataUrlErr) {
        // Browser can't decode this file, but the raw bytes may still be a
        // valid JPEG/PNG/WebP that Claude can decode server-side. Return the
        // original so the raw vision path can send bytes directly to the API.
        // (Happens with CMYK JPEGs, some color-profile-heavy iPhone exports,
        // and oversized images that exceed the browser's canvas limits.)
        console.error("[Dapper Image] Browser decode failed, falling back to raw bytes", {
          imgErr: imgErr?.message,
          bitmapErr: bitmapErr?.message,
          dataUrlErr: dataUrlErr?.message,
          fileType: compatibleFile?.type || "(unknown)",
          fileName: compatibleFile?.name || "(unnamed)",
          fileSize: compatibleFile?.size,
        })
        return compatibleFile
      }
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
