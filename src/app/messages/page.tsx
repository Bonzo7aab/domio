'use client'

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessagingSystem } from '../../components/MessagingSystem';
import { useUserProfile } from '../../contexts/AuthContext';
import { createClient } from '../../lib/supabase/client';
import { markMessagesAsRead } from '../../lib/database/messaging';
import { getConversations, getMessages } from '../../lib/data';
import { Conversation, Message } from '../../types/messaging';
import { mockConversations } from '../../mocks';
import { toast } from 'sonner';

function LoadingState({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<LoadingState label="Ładowanie wiadomości..." />}>
      <MessagesPageContent />
    </Suspense>
  );
}

function MessagesPageContent() {
  const { user, isLoading } = useUserProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Get conversation ID from URL params
  const conversationId = searchParams.get('conversation');

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      const currentPath = typeof window !== 'undefined' 
        ? `${window.location.pathname}${window.location.search}` 
        : '/messages';
      router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
    }
  }, [user, isLoading, router]);

  // Fetch conversations and messages when user is loaded
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setIsLoadingData(true);
        setError(null);
        
        // Fetch conversations
        const conversationsResult = await getConversations(user.id);
        
        if (conversationsResult.error) {
          throw new Error('Nie udało się załadować rozmów');
        }

        const fetchedConversations = conversationsResult.data || [];
        setConversations(fetchedConversations);

        // If no conversations found, fall back to mock data for testing
        if (fetchedConversations.length === 0) {
          console.log('No conversations found in database, using mock data for testing');
          setConversations(mockConversations);
        }

        // If there's a specific conversation in URL, load its messages
        if (conversationId && fetchedConversations.some(c => c.id === conversationId)) {
          const messagesResult = await getMessages(conversationId);
          
          if (messagesResult.error) {
            console.warn('Failed to load messages for conversation:', messagesResult.error);
          } else {
            setMessages(prev => ({
              ...prev,
              [conversationId]: messagesResult.data || []
            }));
          }
        }

      } catch (err) {
        console.error('Error loading messages data:', err);
        setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas ładowania danych');
        toast.error('Nie udało się załadować wiadomości');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user, conversationId]);

  // Handle conversation selection
  const handleConversationSelect = async (selectedConversationId: string) => {
    if (!user) return;

    // If messages already loaded, don't reload
    if (messages[selectedConversationId]) {
      return;
    }

    try {
      const messagesResult = await getMessages(selectedConversationId);
      
      if (messagesResult.error) {
        console.error('Failed to load messages:', messagesResult.error);
        toast.error('Nie udało się załadować wiadomości');
        return;
      }

      setMessages(prev => ({
        ...prev,
        [selectedConversationId]: messagesResult.data || []
      }));

      // Mark messages as read
      const supabase = createClient();
      await markMessagesAsRead(supabase, selectedConversationId, user.id);
      
    } catch (err) {
      console.error('Error loading conversation messages:', err);
      toast.error('Nie udało się załadować wiadomości');
    }
  };

  // Handle sending a new message
  const handleSendMessage = async (conversationId: string, content: string) => {
    if (!user) return;

    const tempId = `temp-${Date.now()}`;

    // Create optimistic message for immediate UI update
    const optimisticMessage: Message = {
      id: tempId,
      senderId: user.id,
      senderName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      senderAvatar: user.avatar || '',
      content,
      timestamp: new Date(),
      read: false,
      type: 'text'
    };

    // Add optimistic message immediately
    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), optimisticMessage]
    }));

    try {
      const supabase = createClient();

      // First, let's check if the conversation exists and user is a participant
      const { data: conversation, error: convError } = await (supabase as any)
        .from('conversations')
        .select('id, participant_1, participant_2')
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error('Conversation check error:', convError);
        throw new Error('Nie można znaleźć rozmowy');
      }

      // Check if user is a participant
      if (conversation.participant_1 !== user.id && conversation.participant_2 !== user.id) {
        console.error('User is not a participant in this conversation');
        throw new Error('Nie masz uprawnień do wysyłania wiadomości w tej rozmowie');
      }

      // Send message to database
      const { data: sendResult, error } = await (supabase as any)
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: 'text'
        })
        .select('id')
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Nie udało się wysłać wiadomości');
      }

      // Update message with real ID (replace the optimistic update)
      setMessages(prev => ({
        ...prev,
        [conversationId]: prev[conversationId].map(msg => 
          msg.id === tempId ? { 
            ...msg, 
            id: sendResult.id
          } : msg
        )
      }));

      toast.success('Wiadomość wysłana');

    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Nie udało się wysłać wiadomości');
      
      // Remove optimistic update on error
      setMessages(prev => ({
        ...prev,
        [conversationId]: prev[conversationId].filter(msg => msg.id !== tempId)
      }));
    }
  };

  // Prevent hydration mismatch - wait for client-side mount
  if (!mounted) {
    return <LoadingState label="Ładowanie..." />;
  }

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingState label="Sprawdzanie..." />;
  }

  // Don't render if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold mb-2">Błąd ładowania</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  // Show loading while fetching data
  if (isLoadingData) {
    return <LoadingState label="Ładowanie wiadomości..." />;
  }

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-10rem)] bg-background">
      <MessagingSystem
        isFullPage={true}
        initialConversationId={conversationId || undefined}
        initialConversations={conversations}
        initialMessages={messages}
        onConversationSelect={handleConversationSelect}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
