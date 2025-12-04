import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database';
import type { Conversation, Message } from '../../types/messaging';

export interface QuoteRequestData {
  projectType: string;
  budgetRange: {
    min: number;
    max: number;
  };
  timeline: string;
  location: string;
  jobReference?: string | null;
}

export interface ConversationData {
  participant1: string;
  participant2: string;
  subject: string;
  jobId?: string | null;
  tenderId?: string | null;
}

export interface MessageData {
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'document' | 'system' | 'quote';
  attachments?: any;
}

/**
 * Create a new conversation between two users
 */
export async function createConversation(
  supabase: SupabaseClient<Database>,
  data: ConversationData
): Promise<{ data: string | null; error: any }> {
  try {
    const { data: conversation, error } = await (supabase as any)
      .from('conversations')
      .insert({
        participant_1: data.participant1,
        participant_2: data.participant2,
        subject: data.subject,
        job_id: data.jobId || null,
        tender_id: data.tenderId || null,
        last_message_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return { data: null, error };
    }

    return { data: conversation?.id || null, error: null };
  } catch (err) {
    console.error('Error creating conversation:', err);
    return { data: null, error: err };
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  supabase: SupabaseClient<Database>,
  data: MessageData
): Promise<{ data: string | null; error: any }> {
  try {
    const { data: message, error } = await (supabase as any)
      .from('messages')
      .insert({
        conversation_id: data.conversationId,
        sender_id: data.senderId,
        content: data.content,
        message_type: data.messageType,
        attachments: data.attachments || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return { data: null, error };
    }

    // Update conversation's last_message_at
    await (supabase as any)
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', data.conversationId);

    return { data: message?.id || null, error: null };
  } catch (err) {
    console.error('Error sending message:', err);
    return { data: null, error: err };
  }
}

/**
 * Send a quote request message with structured data
 */
export async function sendQuoteRequestMessage(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  senderId: string,
  message: string,
  quoteData: QuoteRequestData
): Promise<{ data: string | null; error: any }> {
  try {
    const attachments = {
      projectType: quoteData.projectType,
      budgetRange: quoteData.budgetRange,
      timeline: quoteData.timeline,
      location: quoteData.location,
      jobReference: quoteData.jobReference || null,
    };

    return await sendMessage(supabase, {
      conversationId,
      senderId,
      content: message,
      messageType: 'quote',
      attachments,
    });
  } catch (err) {
    console.error('Error sending quote request message:', err);
    return { data: null, error: err };
  }
}

/**
 * Create a notification for a user
 * Note: This function does NOT send push notifications. 
 * Use createNotificationWithPush from notifications-server.ts if you need push notifications.
 */
export async function createNotification(
  supabase: SupabaseClient<Database>,
  userId: string,
  type: 'new_job' | 'new_tender' | 'application_received' | 'bid_received' | 'application_status_update' | 'bid_status_update' | 'job_assigned' | 'tender_awarded' | 'new_message' | 'review_received' | 'certificate_expiring' | 'deadline_reminder' | 'system_announcement' | 'subscription_expiring' | 'payment_failed' | 'verification_approved' | 'verification_rejected' | 'profile_completion_reminder',
  title: string,
  message: string,
  data?: any,
  actionUrl?: string
): Promise<{ data: string | null; error: any }> {
  try {
    // Insert notification without select first (RLS might block select for other users)
    const { error: insertError } = await (supabase as any)
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: data || null,
        action_url: actionUrl || null,
        priority: 'normal',
      });

    if (insertError) {
      console.error('Error creating notification (insert):', {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      return { data: null, error: insertError };
    }

    // Try to get the ID, but if it fails due to RLS, that's okay - the insert succeeded
    try {
      const { data: notification, error: selectError } = await (supabase as any)
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', type)
        .eq('title', title)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (selectError) {
        console.warn('Could not retrieve notification ID (RLS may block select):', selectError);
        // Insert succeeded, so return success even if we can't get the ID
        return { data: null, error: null };
      }

      return { data: notification?.id || null, error: null };
    } catch (selectErr) {
      console.warn('Error selecting notification ID:', selectErr);
      // Insert succeeded, so return success
      return { data: null, error: null };
    }
  } catch (err) {
    console.error('Error creating notification:', err);
    return { data: null, error: err };
  }
}

/**
 * Get the user profile ID that represents a contractor company
 */
export async function getContractorUserId(
  supabase: SupabaseClient<Database>,
  contractorCompanyId: string
): Promise<{ data: string | null; error: any }> {
  try {
    console.log('Looking for contractor user for company ID:', contractorCompanyId);
    
    // First, try to find any active user for this company
    const { data: userCompanies, error } = await (supabase as any)
      .from('user_companies')
      .select('user_id')
      .eq('company_id', contractorCompanyId)
      .eq('is_active', true);

    console.log('Query result:', { userCompanies, error });

    if (error) {
      console.error('Error querying user_companies table:', error);
      return { data: null, error };
    }

    if (!userCompanies || userCompanies.length === 0) {
      console.warn('No active users found for contractor company:', contractorCompanyId);
      
      // Try to find the contractor company details for debugging
      const { data: company, error: companyError } = await (supabase as any)
        .from('companies')
        .select('id, name, type, email, phone')
        .eq('id', contractorCompanyId)
        .single();
      
      console.log('Contractor company info:', { company, companyError });
      
      // For now, we'll still allow the quote request to proceed
      // but notify the user that the contractor may not be notified via the system
      return { 
        data: null, 
        error: null // Don't fail, but the calling function will need to handle this
      };
    }

    // Find primary user or use the first one
    const primaryUser = userCompanies.find((uc: any) => uc.is_primary);
    const userId = primaryUser?.user_id || userCompanies[0]?.user_id;
    
    console.log('Found contractor user:', userId);
    return { data: userId || null, error: null };
  } catch (err) {
    console.error('Error finding contractor user:', err);
    return { data: null, error: err };
  }
}

/**
 * Complete workflow: Create conversation, send quote request, and notify contractor
 */
export async function submitQuoteRequest(
  supabase: SupabaseClient<Database>,
  requesterId: string,
  contractorCompanyId: string,
  contractorName: string,
  message: string,
  quoteData: QuoteRequestData
): Promise<{ success: boolean; error: any; note?: string }> {
  try {
    // 1. Find the user profile ID that represents the contractor company
    const contractorUserResult = await getContractorUserId(supabase, contractorCompanyId);
    
    // Handle case where contractor has no user account
    if (contractorUserResult.error) {
      return { 
        success: false, 
        error: new Error('Nie można znaleźć profilu użytkownika wykonawcy') 
      };
    }

    if (!contractorUserResult.data) {
      // Contractor doesn't have a user account, but we can still save the request
      console.warn('Contractor has no user account, saving quote request without conversation');
      
      // TODO: Store quote requests in a separate table for contractors without user accounts
      // For now, we'll just inform the user
      return { 
        success: true, 
        error: null,
        note: 'Ten wykonawca nie ma aktywnego konta w systemie. Skontaktuj się z nim bezpośrednio.'
      };
    }

    const contractorUserId = contractorUserResult.data;

    // 2. Create conversation
    const conversationResult = await createConversation(supabase, {
      participant1: requesterId,
      participant2: contractorUserId,
      subject: `Zapytanie o wycenę - ${quoteData.projectType}`,
      jobId: quoteData.jobReference || null,
    });

    if (conversationResult.error || !conversationResult.data) {
      return { success: false, error: conversationResult.error };
    }

    // 3. Send quote request message
    const messageResult = await sendQuoteRequestMessage(
      supabase,
      conversationResult.data,
      requesterId,
      message,
      quoteData
    );

    if (messageResult.error || !messageResult.data) {
      return { success: false, error: messageResult.error };
    }

    // 4. Create notification for contractor
    const notificationResult = await createNotification(
      supabase,
      contractorUserId,
      'new_message',
      'Nowe zapytanie o wycenę',
      `Otrzymałeś nowe zapytanie o wycenę od użytkownika dotyczące: ${quoteData.projectType}`,
      {
        conversationId: conversationResult.data,
        messageId: messageResult.data,
        projectType: quoteData.projectType,
        budgetRange: quoteData.budgetRange,
        timeline: quoteData.timeline,
        location: quoteData.location,
      },
      `/messages?conversation=${conversationResult.data}`
    );

    if (notificationResult.error) {
      console.warn('Failed to create notification:', notificationResult.error);
      // Don't fail the whole operation if notification fails
    }

    return { success: true, error: null, note: undefined };
  } catch (err) {
    console.error('Error submitting quote request:', err);
    return { success: false, error: err };
  }
}

/**
 * Check if a conversation already exists between two users
 */
export async function findExistingConversation(
  supabase: SupabaseClient<Database>,
  participant1: string,
  participant2: string
): Promise<{ data: string | null; error: any }> {
  try {
    const { data: conversation, error } = await (supabase as any)
      .from('conversations')
      .select('id')
      .or(`and(participant_1.eq.${participant1},participant_2.eq.${participant2}),and(participant_1.eq.${participant2},participant_2.eq.${participant1})`)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error finding conversation:', error);
      return { data: null, error };
    }

    return { data: conversation?.id || null, error: null };
  } catch (err) {
    console.error('Error finding conversation:', err);
    return { data: null, error: err };
  }
}

/**
 * Find a conversation by job_id and participants
 */
export async function findConversationByJob(
  supabase: SupabaseClient<Database>,
  jobId: string,
  participant1: string,
  participant2: string,
  isTender: boolean = false
): Promise<{ data: string | null; error: any }> {
  try {
    const jobField = isTender ? 'tender_id' : 'job_id';
    const { data: conversation, error } = await (supabase as any)
      .from('conversations')
      .select('id')
      .eq(jobField, jobId)
      .or(`and(participant_1.eq.${participant1},participant_2.eq.${participant2}),and(participant_1.eq.${participant2},participant_2.eq.${participant1})`)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error finding conversation by job:', error);
      return { data: null, error };
    }

    return { data: conversation?.id || null, error: null };
  } catch (err) {
    console.error('Error finding conversation by job:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch all conversations for a user with participant details
 */
export async function fetchUserConversations(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ data: Conversation[] | null; error: any }> {
  try {
    const { data: conversations, error } = await (supabase as any)
      .from('conversations')
      .select(`
        id,
        subject,
        last_message_at,
        created_at,
        updated_at,
        job_id,
        tender_id,
        participant_1_profile:user_profiles!conversations_participant_1_fkey(
          id,
          first_name,
          last_name,
          avatar_url,
          user_type,
          phone
        ),
        participant_2_profile:user_profiles!conversations_participant_2_fkey(
          id,
          first_name,
          last_name,
          avatar_url,
          user_type,
          phone
        ),
        job:jobs(
          id,
          title
        ),
        tender:tenders(
          id,
          title
        )
      `)
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return { data: null, error };
    }

    // Transform to Conversation format
    const transformedConversations: Conversation[] = (conversations || []).map((conv: any) => {
      const otherParticipant = conv.participant_1_profile?.id === userId 
        ? conv.participant_2_profile 
        : conv.participant_1_profile;
      
      const currentUser = conv.participant_1_profile?.id === userId 
        ? conv.participant_1_profile 
        : conv.participant_2_profile;

      return {
        id: conv.id,
        participants: [
          {
            id: currentUser?.id || '',
            name: `${currentUser?.first_name || ''} ${currentUser?.last_name || ''}`.trim(),
            avatar: currentUser?.avatar_url || '',
            userType: currentUser?.user_type === 'manager' ? 'manager' : 'contractor',
            phone: currentUser?.phone || undefined,
            isOnline: false // TODO: Implement online status
          },
          {
            id: otherParticipant?.id || '',
            name: `${otherParticipant?.first_name || ''} ${otherParticipant?.last_name || ''}`.trim(),
            avatar: otherParticipant?.avatar_url || '',
            userType: otherParticipant?.user_type === 'manager' ? 'manager' : 'contractor',
            phone: otherParticipant?.phone || undefined,
            isOnline: false // TODO: Implement online status
          }
        ],
        lastMessage: undefined, // Will be populated separately
        unreadCount: 0, // Will be calculated separately
        jobId: conv.job_id || conv.tender_id, // Support both jobs and tenders
        jobTitle: conv.job?.title || conv.tender?.title, // Support both jobs and tenders
        createdAt: new Date(conv.created_at),
        updatedAt: new Date(conv.updated_at)
      };
    });

    return { data: transformedConversations, error: null };
  } catch (err) {
    console.error('Error fetching conversations:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch all messages for a conversation
 */
export async function fetchConversationMessages(
  supabase: SupabaseClient<Database>,
  conversationId: string
): Promise<{ data: Message[] | null; error: any }> {
  try {
    const { data: messages, error } = await (supabase as any)
      .from('messages')
      .select(`
        id,
        sender_id,
        content,
        message_type,
        attachments,
        created_at,
        sender_profile:user_profiles!messages_sender_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return { data: null, error };
    }

    // Transform to Message format
    const transformedMessages: Message[] = (messages || []).map((msg: any) => ({
      id: msg.id,
      senderId: msg.sender_id,
      senderName: `${msg.sender_profile?.first_name || ''} ${msg.sender_profile?.last_name || ''}`.trim(),
      senderAvatar: msg.sender_profile?.avatar_url || '',
      content: msg.content,
      timestamp: new Date(msg.created_at),
      read: false, // TODO: Implement read status
      type: msg.message_type === 'quote' ? 'text' : 'text', // Map to supported types
      attachments: msg.attachments ? Object.values(msg.attachments).map((att: any) => ({
        id: att.id || '',
        name: att.name || '',
        url: att.url || '',
        type: att.type || 'other',
        size: att.size || 0
      })) : undefined
    }));

    return { data: transformedMessages, error: null };
  } catch (err) {
    console.error('Error fetching messages:', err);
    return { data: null, error: err };
  }
}

/**
 * Mark messages as read for a user in a conversation
 */
export async function markMessagesAsRead(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  userId: string
): Promise<{ data: boolean; error: any }> {
  try {
    // First, get all unread messages in this conversation
    const { data: messages, error: messagesError } = await (supabase as any)
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId); // Don't mark own messages as read

    if (messagesError) {
      console.error('Error fetching messages for read status:', messagesError);
      return { data: false, error: messagesError };
    }

    if (!messages || messages.length === 0) {
      return { data: true, error: null };
    }

    // Insert read status for each message
    const readStatusInserts = messages.map((msg: any) => ({
      message_id: msg.id,
      user_id: userId,
      read_at: new Date().toISOString()
    }));

    const { error: insertError } = await (supabase as any)
      .from('message_read_status')
      .upsert(readStatusInserts, { 
        onConflict: 'message_id,user_id',
        ignoreDuplicates: true 
      });

    if (insertError) {
      console.error('Error marking messages as read:', insertError);
      return { data: false, error: insertError };
    }

    return { data: true, error: null };
  } catch (err) {
    console.error('Error marking messages as read:', err);
    return { data: false, error: err };
  }
}
