const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;

export function cldUrl(publicId: string, transform?: string) {
  const segment = transform ? `${transform}/` : '';
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${segment}${publicId}`;
}

export function cldRawUrl(publicId: string) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${publicId}`;
}
