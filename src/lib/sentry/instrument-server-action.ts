import * as Sentry from '@sentry/nextjs'

export function instrumentServerAction<Args extends unknown[], Result>(
  name: string,
  fn: (...args: Args) => Promise<Result>
): (...args: Args) => Promise<Result> {
  return async (...args: Args) =>
    Sentry.withServerActionInstrumentation(name, { recordResponse: false }, async () =>
      fn(...args)
    )
}
