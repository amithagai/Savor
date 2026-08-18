const configuredLoginPath = import.meta.env.VITE_ADMIN_LOGIN_PATH?.trim()

export const ADMIN_LOGIN_PATH = configuredLoginPath?.startsWith('/')
  ? configuredLoginPath
  : '/savor-entry-8f4k2m'

export const adminLoginPath = (query = '') => `${ADMIN_LOGIN_PATH}${query}`

