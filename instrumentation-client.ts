import * as Sentry from '@sentry/nextjs'
import { baseSentryOptions } from './sentry.shared'

Sentry.init(baseSentryOptions)

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
