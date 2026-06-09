'use server';

import { createClient } from '../../lib/supabase/server';
import { createAdminClientOrNull } from '../../lib/supabase/admin';
import { createNotificationWithPush } from '../../lib/database/notifications-server';

export async function notifyContestQuestionAskerAction(
  questionId: string,
): Promise<{ success: boolean }> {
  if (!questionId?.trim()) {
    return { success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { success: false };
  }

  const admin = createAdminClientOrNull();
  if (!admin) {
    console.warn('notifyContestQuestionAskerAction: admin client unavailable');
    return { success: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: question, error: questionError } = await (admin as any)
    .from('questions')
    .select('asker_id, tender_id')
    .eq('id', questionId.trim())
    .maybeSingle();

  if (questionError || !question?.tender_id || !question.asker_id) {
    return { success: false };
  }

  const { data: canManage, error: accessError } = await supabase.rpc(
    'user_can_manage_contest_tender',
    { p_tender_id: question.tender_id },
  );

  if (accessError || !canManage) {
    return { success: false };
  }

  if (question.asker_id === user.id) {
    return { success: true };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tender } = await (admin as any)
    .from('tenders')
    .select('title')
    .eq('id', question.tender_id)
    .maybeSingle();

  const tenderTitle = (tender?.title as string | undefined) ?? 'konkurs';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error: countError } = await (admin as any)
    .from('question_comments')
    .select('id', { count: 'exact', head: true })
    .eq('question_id', questionId.trim());

  if (countError) {
    return { success: false };
  }

  const isFirstAnswer = (count ?? 0) === 1;
  const actionUrl = `/konkurs/${question.tender_id}?tab=contest-qa`;

  await createNotificationWithPush({
    supabase: admin,
    userId: question.asker_id,
    type: 'contest_question',
    title: isFirstAnswer
      ? 'Odpowiedź na Twoje pytanie do konkursu'
      : 'Nowy komentarz do Twojego pytania',
    message: isFirstAnswer
      ? `Zarządca odpowiedział na Twoje pytanie w konkursie: ${tenderTitle}`
      : `Zarządca dodał komentarz do Twojego pytania w konkursie: ${tenderTitle}`,
    data: {
      tenderId: question.tender_id,
      questionId: questionId.trim(),
      tab: 'contest-qa',
      title: tenderTitle,
    },
    actionUrl,
  });

  return { success: true };
}
