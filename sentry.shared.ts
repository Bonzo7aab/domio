export const sentryEnabled =
  Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN) &&
  process.env.NODE_ENV === 'production'

export const baseSentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  enabled: sentryEnabled,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0,
  sendDefaultPii: false,
}
