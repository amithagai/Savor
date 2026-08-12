const DEFAULT_CLOUD_NAME = 'dtracwymf'

function resolveCloudName(value: string | undefined) {
  const configured = value?.trim()
  if (configured) return configured

  // The cloud name is public and already appears in every delivered asset URL.
  // Keep a site-specific fallback so a missing build-time variable cannot
  // produce `/undefined/` URLs in production.
  return DEFAULT_CLOUD_NAME
}

const CLOUD_NAME = resolveCloudName(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME)

export function cldUrl(publicId: string, transform?: string) {
  const segment = transform ? `${transform}/` : ''
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${segment}${publicId}`
}

export function cldRawUrl(publicId: string) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${publicId}`
}
