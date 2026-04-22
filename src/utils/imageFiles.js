export function isHeicLike(file) {
  const name = String(file?.name || "").toLowerCase()
  const type = String(file?.type || "").toLowerCase()
  return /\.(heic|heif)$/.test(name) || type.includes("heic") || type.includes("heif")
}

function normalizedJpegName(file) {
  const baseName = String(file?.name || "photo").replace(/\.(heic|heif)$/i, "")
  return `${baseName || "photo"}.jpg`
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
