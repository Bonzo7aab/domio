interface AuthErrorLike {
  message?: string
  code?: string
}

/** True when Supabase cannot refresh because the stored refresh token is missing or revoked. */
export function isInvalidRefreshTokenError(error: AuthErrorLike | null | undefined): boolean {
  if (!error?.message) return false

  const message = error.message.toLowerCase()
  return (
    message.includes('refresh token not found') ||
    message.includes('invalid refresh token') ||
    error.code === 'refresh_token_not_found'
  )
}
