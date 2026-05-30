import 'server-only';

import type { EvaluationContext } from '@openfeature/server-sdk';

export interface FlagshipUserContext {
  id: string;
  email?: string;
  userType?: string;
  platformRole?: string;
}

export function buildEvaluationContext(user?: FlagshipUserContext | null): EvaluationContext {
  if (!user) {
    return { targetingKey: 'anonymous' };
  }

  return {
    targetingKey: user.id,
    ...(user.email ? { email: user.email } : {}),
    ...(user.userType ? { userType: user.userType } : {}),
    ...(user.platformRole ? { platformRole: user.platformRole } : {}),
  };
}
