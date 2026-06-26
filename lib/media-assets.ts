const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || "dz1awxm73"

function cloudinaryImageUrl(path: string) {
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${path.replace(
    /^\/+/,
    ""
  )}`
}

function looksLikeCloudinaryImagePath(value: string) {
  return (
    /^v\d+\//.test(value) ||
    /^loyer360\/images\//.test(value) ||
    /^homelink\/images\//.test(value)
  )
}

export function mediaAssetUrl(asset?: string | null) {
  const value = asset?.trim()

  if (!value) {
    return ""
  }

  if (value.startsWith("/api/proxy/")) {
    return value
  }

  if (/^(blob|data):/i.test(value)) {
    return value
  }

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  const imageUploadIndex = value.indexOf("image/upload/")
  if (imageUploadIndex !== -1) {
    return cloudinaryImageUrl(
      value.slice(imageUploadIndex + "image/upload/".length)
    )
  }

  if (looksLikeCloudinaryImagePath(value)) {
    return cloudinaryImageUrl(value)
  }

  return `/api/proxy/${value.replace(/^\/+/, "")}`
}
