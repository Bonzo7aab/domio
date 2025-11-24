import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import { createNotification, findExistingConversation, createConversation, sendMessage } from './messaging';

/**
 * Submit a question about a job
 */
export async function submitQuestion(
  supabase: SupabaseClient<Database>,
  jobId: string,
  askerId: string,
  question: string
): Promise<{ success: boolean; error: any; questionId?: string }> {
  try {
    // 1. Verify session and get the authenticated user ID
    // This ensures asker_id matches auth.uid() for RLS policies
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error('No active session:', sessionError);
      return { success: false, error: new Error('Brak aktywnej sesji. Proszę się zalogować ponownie.') };
    }

    const authenticatedUserId = sessionData.session.user.id;
    
    // Verify the passed askerId matches the authenticated user
    if (askerId !== authenticatedUserId) {
      console.warn('askerId mismatch:', { askerId, authenticatedUserId });
      // Use authenticated user ID instead to ensure RLS policy passes
    }

    // 2. Check if the ID is a job or a tender
    // The questions table supports both job_id and tender_id
    let isJob = false;
    let isTender = false;
    let managerId: string | null = null;
    let title: string | null = null;

    // Try to find it as a job first
    try {
      const { data: jobData, error: jobError } = await (supabase as any)
        .from('jobs')
        .select('id, title, manager_id')
        .eq('id', jobId)
        .limit(1);
      
      if (!jobError && jobData && jobData.length > 0) {
        isJob = true;
        managerId = jobData[0].manager_id;
        title = jobData[0].title;
      }
    } catch (err) {
      console.warn('Error checking if ID is a job:', err);
    }

    // If not a job, try as a tender
    if (!isJob) {
      try {
        const { data: tenderData, error: tenderError } = await (supabase as any)
          .from('tenders')
          .select('id, title, manager_id')
          .eq('id', jobId)
          .limit(1);
        
        if (!tenderError && tenderData && tenderData.length > 0) {
          isTender = true;
          managerId = tenderData[0].manager_id;
          title = tenderData[0].title;
        }
      } catch (err) {
        console.warn('Error checking if ID is a tender:', err);
      }
    }

    if (!isJob && !isTender) {
      return { success: false, error: new Error('Ogłoszenie nie istnieje') };
    }

    // 3. Insert the question into the database
    // Use authenticatedUserId to ensure it matches auth.uid() for RLS policies
    console.log('Inserting question with:', {
      jobId,
      isJob,
      isTender,
      askerId: authenticatedUserId,
      questionLength: question.trim().length,
      hasSession: !!sessionData.session,
      sessionUserId: sessionData.session?.user?.id
    });

    const insertPayload: any = {
      asker_id: authenticatedUserId, // Use session user ID to match auth.uid()
      question: question.trim(),
      is_public: true,
    };

    // Set either job_id or tender_id based on what we found
    if (isJob) {
      insertPayload.job_id = jobId;
    } else if (isTender) {
      insertPayload.tender_id = jobId;
    }

    console.log('Insert payload:', insertPayload);

    // Try insert with select first
    let questionDataArray: any[] | null = null;
    let questionError: any = null;

    const insertResult = await (supabase as any)
      .from('questions')
      .insert(insertPayload)
      .select('id');

    questionDataArray = insertResult.data;
    questionError = insertResult.error;

    // If select fails but insert might have succeeded, try to query the question back
    if (questionError && (!questionError.code || questionError.code !== '23503')) {
      console.warn('Insert with select failed, trying to query back:', questionError);
      
      // Wait a moment for the insert to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to find the question we just inserted
      const { data: foundQuestion, error: findError } = await (supabase as any)
        .from('questions')
        .select('id')
        .eq('job_id', jobId)
        .eq('asker_id', authenticatedUserId)
        .eq('question', question.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!findError && foundQuestion) {
        console.log('Found question after insert:', foundQuestion);
        questionDataArray = [foundQuestion];
        questionError = null;
      }
    }

    if (questionError) {
      // Log the full error object
      const errorDetails = {
        error: questionError,
        errorString: JSON.stringify(questionError, null, 2),
        errorKeys: Object.keys(questionError),
        code: questionError?.code,
        message: questionError?.message,
        details: questionError?.details,
        hint: questionError?.hint,
        authenticatedUserId,
        jobId,
        insertPayload
      };
      
      console.error('Error submitting question - full details:', errorDetails);
      
      // Check if it's a foreign key constraint error (job doesn't exist)
      if (questionError.code === '23503' || questionError.message?.includes('foreign key')) {
        return { success: false, error: new Error('Ogłoszenie nie istnieje') };
      }
      
      // Check if it's an RLS policy violation
      if (questionError.code === '42501' || questionError.message?.includes('policy') || questionError.message?.includes('permission') || questionError.message?.includes('row-level security')) {
        return { success: false, error: new Error('Brak uprawnień do dodania pytania. Sprawdź czy jesteś zalogowany.') };
      }
      
      // Return a more descriptive error
      const errorMessage = questionError.message || questionError.code || 'Nieznany błąd podczas zapisywania pytania';
      return { success: false, error: new Error(errorMessage) };
    }

    if (!questionDataArray || questionDataArray.length === 0) {
      console.error('No question data returned from insert');
      return { success: false, error: new Error('Failed to create question') };
    }

    const questionData = Array.isArray(questionDataArray) ? questionDataArray[0] : questionDataArray;

    // 4. Create or find conversation and add question as a message
    let conversationId: string | null = null;
    if (managerId && authenticatedUserId !== managerId) {
      try {
        // Find existing conversation between asker and manager
        const existingConvResult = await findExistingConversation(
          supabase,
          authenticatedUserId,
          managerId
        );

        if (existingConvResult.error) {
          console.warn('Error finding existing conversation:', existingConvResult.error);
        }

        // If conversation exists, use it; otherwise create a new one
        if (existingConvResult.data) {
          conversationId = existingConvResult.data;
          console.log('Found existing conversation:', conversationId);
        } else {
          // Create new conversation
          const convResult = await createConversation(supabase, {
            participant1: authenticatedUserId,
            participant2: managerId,
            subject: `Pytanie: ${title}`,
            jobId: isJob ? jobId : null,
            tenderId: isTender ? jobId : null,
          });

          if (convResult.error || !convResult.data) {
            console.warn('Failed to create conversation:', convResult.error);
          } else {
            conversationId = convResult.data;
            console.log('Created new conversation:', conversationId);
          }
        }

        // If we have a conversation, add the question as a message
        if (conversationId) {
          const messageResult = await sendMessage(supabase, {
            conversationId: conversationId,
            senderId: authenticatedUserId,
            content: question.trim(),
            messageType: 'text',
          });

          if (messageResult.error) {
            console.warn('Failed to add question as message:', messageResult.error);
            // Don't fail the whole operation if message creation fails
          } else {
            console.log('Question added as message to conversation');
          }
        }
      } catch (convError) {
        console.warn('Error creating conversation/message for question:', convError);
        // Don't fail the whole operation if conversation/message creation fails
      }
    }

    // 5. Create a notification for the job/tender owner (manager) if we have the manager_id
    if (managerId && title) {
      try {
        const notificationResult = await createNotification(
          supabase,
          managerId,
          'new_message', // Using 'new_message' as closest match for question notifications
          'Nowe pytanie dotyczące ogłoszenia',
          `Otrzymałeś nowe pytanie dotyczące ogłoszenia: ${title}`,
          {
            questionId: questionData.id,
            [isJob ? 'jobId' : 'tenderId']: jobId,
            title: title,
          },
          isJob ? `/jobs/${jobId}` : `/tenders/${jobId}`
        );

        if (notificationResult.error) {
          console.warn('Failed to create notification:', notificationResult.error);
          // Don't fail the whole operation if notification fails
        }
      } catch (notifError) {
        console.warn('Error creating notification:', notifError);
        // Don't fail the whole operation if notification fails
      }
    }

    return { success: true, error: null, questionId: questionData.id };
  } catch (err) {
    console.error('Error submitting question:', err);
    return { success: false, error: err };
  }
}

