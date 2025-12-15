import {
  CheckCheck,
  Info,
  Paperclip,
  Phone,
  Search,
  Send,
  X,
  MapPin,
  Clock,
  ExternalLink,
  Gavel,
  ArrowLeft,
  Calendar,
  Briefcase
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useUserProfile } from '../contexts/AuthContext';
import { mockConversations, mockMessages } from '../mocks';
import { Message, MessageAttachment } from '../types/messaging';
import { Conversation } from '../types/messaging';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Textarea } from './ui/textarea';
import { Card, CardContent } from './ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { getJobById, getTenderById } from '../lib/data';
import { useRouter } from 'next/navigation';
import { useIsMobile } from './ui/use-mobile';

// Types now imported from centralized types folder

interface MessagingSystemProps {
  onClose?: () => void;
  initialConversationId?: string;
  initialRecipientId?: string;
  isFullPage?: boolean;
  initialConversations?: Conversation[];
  initialMessages?: { [conversationId: string]: Message[] };
  onConversationSelect?: (conversationId: string) => void;
  onSendMessage?: (conversationId: string, content: string) => void;
}

export const MessagingSystem: React.FC<MessagingSystemProps> = ({
  onClose,
  initialConversationId,
  initialRecipientId,
  isFullPage = false,
  initialConversations,
  initialMessages,
  onConversationSelect,
  onSendMessage
}) => {
  const { user } = useUserProfile();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>(
    initialConversations || mockConversations
  );
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    initialConversationId || (conversations.length > 0 ? conversations[0].id : null)
  );
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>(
    initialMessages || mockMessages
  );
  const [showChatView, setShowChatView] = useState(false);

  // Sync with parent state when initialMessages changes
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Show chat view on mobile if initial conversation is provided
  useEffect(() => {
    if (isMobile && initialConversationId) {
      setShowChatView(true);
    }
  }, [isMobile, initialConversationId]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [jobData, setJobData] = useState<any>(null);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);

  // Sync pendingAttachments ref
  useEffect(() => {
    pendingAttachmentsRef.current = pendingAttachments;
  }, [pendingAttachments]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      pendingAttachmentsRef.current.forEach(att => {
        if (att.url.startsWith('blob:')) {
          URL.revokeObjectURL(att.url);
        }
      });
    };
  }, []);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingAttachmentsRef = useRef<MessageAttachment[]>([]);
  const router = useRouter();

  // Auto scroll to bottom when new message arrives or conversation changes
  useEffect(() => {
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages, selectedConversation]);

  // Scroll to bottom when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
  }, [selectedConversation]);

  const currentConversation = conversations.find(conv => conv.id === selectedConversation);
  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];

  // Fetch job details when conversation with jobId is selected
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!currentConversation?.jobId) {
        setJobData(null);
        return;
      }

      setIsLoadingJob(true);
      try {
        // Try to fetch as job first
        const { data: job, error: jobError } = await getJobById(currentConversation.jobId);
        if (job && !jobError) {
          setJobData({ ...job, postType: 'job' });
          setIsLoadingJob(false);
          return;
        }

        // If not found as job, try as tender
        const { data: tender, error: tenderError } = await getTenderById(currentConversation.jobId);
        if (tender && !tenderError) {
          setJobData({ ...tender, postType: 'tender' });
          setIsLoadingJob(false);
          return;
        }

        setJobData(null);
      } catch (error) {
        console.error('Error fetching job details:', error);
        setJobData(null);
      } finally {
        setIsLoadingJob(false);
      }
    };

    fetchJobDetails();
  }, [currentConversation?.jobId]);

  const handleSendMessage = () => {
    // Allow sending if there's text OR attachments
    if ((!newMessage.trim() && pendingAttachments.length === 0) || !selectedConversation || !user) return;

    const messageContent = newMessage.trim() || (pendingAttachments.length > 0 ? 'Przesłano plik' : '');

    // If we have a custom send handler (for database integration), use it
    if (onSendMessage) {
      // Call the handler - let the parent handle optimistic updates
      // Note: For now, we'll send text only. In a real implementation, you'd need to handle file uploads separately
      onSendMessage(selectedConversation, messageContent);
      setNewMessage('');
      setPendingAttachments([]);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Otherwise, use the original mock behavior
    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: user?.id || '',
      senderName: user?.firstName || '',
      senderAvatar: user?.avatar || '',
      content: messageContent,
      timestamp: new Date(),
      read: false,
      attachments: pendingAttachments.length > 0 ? [...pendingAttachments] : undefined,
      type: 'text'
    };

    setMessages(prev => ({
      ...prev,
      [selectedConversation]: [...(prev[selectedConversation] || []), message]
    }));

    // Update conversation last message
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation 
        ? { ...conv, lastMessage: message, updatedAt: new Date() }
        : conv
    ));

    setNewMessage('');
    setPendingAttachments([]);
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Wiadomość wysłana');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedConversation || !user) return;

    // Add files as pending attachments instead of sending immediately
    const newAttachments: MessageAttachment[] = Array.from(files).map((file, index) => ({
      id: `pending-att-${Date.now()}-${index}`,
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'document',
      size: file.size
    }));

    setPendingAttachments(prev => [...prev, ...newAttachments]);
    
    // Clear file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePendingAttachment = (attachmentId: string) => {
    setPendingAttachments(prev => {
      const updated = prev.filter(att => att.id !== attachmentId);
      // Revoke object URL to free memory
      const removed = prev.find(att => att.id === attachmentId);
      if (removed && removed.url.startsWith('blob:')) {
        URL.revokeObjectURL(removed.url);
      }
      return updated;
    });
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Dzisiaj';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Wczoraj';
    } else {
      return new Intl.DateTimeFormat('pl-PL', {
        day: '2-digit',
        month: 'short'
      }).format(date);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleConversationClick = (conversationId: string) => {
    setSelectedConversation(conversationId);
    
    // Clear pending attachments when switching conversations
    setPendingAttachments(prev => {
      prev.forEach(att => {
        if (att.url.startsWith('blob:')) {
          URL.revokeObjectURL(att.url);
        }
      });
      return [];
    });
    
    // On mobile, switch to chat view when conversation is selected
    if (isMobile) {
      setShowChatView(true);
    }
    
    // If we have a custom conversation select handler, call it
    if (onConversationSelect) {
      onConversationSelect(conversationId);
    }
  };

  const handleBackToConversations = () => {
    setShowChatView(false);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participants.some(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || conv.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const otherParticipant = currentConversation?.participants.find(p => p.id !== user?.id || '');

  const containerClass = isFullPage 
    ? "h-full bg-background flex overflow-hidden"
    : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50";
  
  const contentClass = isFullPage
    ? "bg-background w-full h-full flex overflow-hidden min-h-0"
    : "bg-white rounded-lg shadow-xl w-full max-w-6xl h-[80vh] overflow-hidden flex min-h-0";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Conversations List */}
        <div className={`w-full md:w-1/3 lg:w-1/4 border-r flex flex-col min-h-0 ${
          isMobile && showChatView ? 'hidden' : 'flex'
        }`}>
          <div className="p-2 sm:p-4 border-b">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="text-base sm:text-lg font-semibold">Wiadomości</h2>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose} className="h-10 w-10">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
              <Input
                placeholder="Szukaj rozmów..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-10 text-sm sm:text-base"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-1 sm:p-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-500 px-2">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">💬</div>
                  <h3 className="text-base sm:text-lg font-medium mb-2">Brak rozmów</h3>
                  <p className="text-xs sm:text-sm">Nie masz jeszcze żadnych rozmów. Rozpocznij nową rozmowę poprzez złożenie zapytania o wycenę.</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const otherUser = conversation.participants.find(p => p.id !== user?.id || '');
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationClick(conversation.id)}
                      className={`p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-gray-50 active:bg-gray-100 ${
                        selectedConversation === conversation.id ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-9 h-9 sm:w-10 sm:h-10">
                            <AvatarImage src={otherUser?.avatar} />
                            <AvatarFallback>
                              {otherUser?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {otherUser?.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 sm:gap-2">
                            <h3 className="font-medium text-xs sm:text-sm truncate">{otherUser?.name}</h3>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {conversation.lastMessage && (
                                <span className="text-[10px] sm:text-xs text-gray-500">
                                  {formatTime(conversation.lastMessage.timestamp)}
                                </span>
                              )}
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0 sm:py-0.5">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 truncate">{otherUser?.company}</p>
                          {conversation.jobTitle && (
                            <p className="text-[10px] sm:text-xs text-blue-600 mb-0.5 sm:mb-1 truncate">
                              📋 {conversation.jobTitle}
                            </p>
                          )}
                          {conversation.lastMessage && (
                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 min-h-0 flex flex-col w-full ${
          isMobile && !showChatView ? 'hidden' : 'flex'
        }`}>
          {selectedConversation && currentConversation && otherParticipant ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 md:py-4 lg:py-5 relative">
                  {/* Mobile: Back button in top left */}
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToConversations}
                      className="absolute top-3 left-4 sm:left-6 h-8 w-8 sm:h-10 sm:w-10 p-0"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Phone - Top Right Corner */}
                  {otherParticipant.phone && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={`tel:${otherParticipant.phone}`}
                          className="absolute top-3 right-4 sm:right-6 lg:right-8 flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                          <span className="font-medium md:inline hidden">{otherParticipant.phone}</span>
                          <span className="font-medium md:hidden">{otherParticipant.phone}</span>
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Zadzwoń: {otherParticipant.phone}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Mobile: Centered layout, Desktop: Horizontal layout */}
                  <div className={`flex flex-col items-center md:flex-row md:items-start md:justify-between gap-3 md:gap-4 ${
                    isMobile ? 'pt-8' : ''
                  }`}>
                    {/* Main content area */}
                    <div className="flex flex-col items-center md:flex-row md:items-start gap-3 md:gap-4 flex-1 min-w-0 w-full md:w-auto">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20">
                          <AvatarImage src={otherParticipant?.avatar || ''} />
                          <AvatarFallback className="bg-primary text-white text-sm sm:text-lg md:text-xl">
                            {otherParticipant.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {otherParticipant.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 md:-bottom-0.5 md:-right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-3 md:h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>

                      {/* Content section */}
                      <div className="flex-1 min-w-0 w-full md:w-auto text-center md:text-left">
                        {/* Name */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2 md:mb-1.5">
                          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                            {otherParticipant.name}
                          </h1>
                        </div>

                        {/* Company */}
                        {otherParticipant.company && (
                          <p className="text-sm sm:text-base text-gray-600 mb-2 md:mb-2">{otherParticipant.company}</p>
                        )}

                        {/* Job Title Badge */}
                        {currentConversation.jobTitle && (
                          <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2 md:mb-2">
                            <Badge variant="outline" className="text-xs sm:text-sm px-2.5 py-1 border-blue-200 text-blue-700 bg-blue-50">
                              <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5" />
                              {currentConversation.jobTitle}
                            </Badge>
                          </div>
                        )}

                        {/* Info Cards - location, company, salary */}
                        {jobData && !isLoadingJob && (
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2 md:mb-2">
                            {jobData.location && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-md border border-gray-100">
                                <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-gray-700 font-medium truncate">
                                  {typeof jobData.location === 'string' 
                                    ? jobData.location 
                                    : jobData.location.city || 'Nieznana lokalizacja'}
                                </span>
                              </div>
                            )}
                            {jobData.company && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-md border border-gray-100">
                                <Briefcase className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-gray-700 font-medium truncate">
                                  {typeof jobData.company === 'string' 
                                    ? jobData.company 
                                    : jobData.company?.name || 'Unknown'}
                                </span>
                              </div>
                            )}
                            {jobData.salary && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-md border border-gray-100">
                                <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-gray-700 font-medium">{jobData.salary}</span>
                              </div>
                            )}
                            {currentConversation.jobId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/jobs/${currentConversation.jobId}`)}
                                className="h-7 sm:h-8 px-2.5 sm:px-3 text-xs sm:text-sm border-gray-200"
                              >
                                <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5" />
                                Szczegóły
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-hidden min-h-0">
                <ScrollArea className="h-full p-2 sm:p-4" style={{ height: '100%' }}>
                  <div className="space-y-3 sm:space-y-4">
                  {currentMessages.map((message, index) => {
                    const isOwnMessage = message.senderId === user?.id || '';
                    const showDate = index === 0 || 
                      formatDate(message.timestamp) !== formatDate(currentMessages[index - 1].timestamp);

                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="text-center my-3 sm:my-4">
                            <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                              {formatDate(message.timestamp)}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] sm:max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                            <div
                              className={`p-2 sm:p-3 rounded-lg ${
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-xs sm:text-sm break-words">{message.content}</p>
                              
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-1.5 sm:mt-2 space-y-1.5 sm:space-y-2">
                                  {message.attachments.map((attachment) => (
                                    <div
                                      key={attachment.id}
                                      className={`p-1.5 sm:p-2 rounded border ${
                                        isOwnMessage ? 'border-white/20 bg-white/10' : 'border-gray-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 sm:gap-2">
                                        <Paperclip className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[10px] sm:text-xs font-medium truncate">{attachment.name}</p>
                                          <p className="text-[10px] sm:text-xs opacity-70">{formatFileSize(attachment.size)}</p>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-5 w-5 sm:h-6 sm:w-6 p-0 flex-shrink-0">
                                          ⬇
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className={`flex items-center gap-1 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-gray-500 ${
                              isOwnMessage ? 'justify-end' : 'justify-start'
                            }`}>
                              <span>{formatTime(message.timestamp)}</span>
                              {isOwnMessage && (
                                <CheckCheck className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${message.read ? 'text-blue-500' : 'text-gray-400'}`} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Message Input */}
              <div className="p-2 sm:p-4 border-t sticky bottom-0 bg-background z-10 touch-manipulation">
                {isTyping && (
                  <div className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">
                    {otherParticipant.name} pisze...
                  </div>
                )}
                
                {/* Pending Attachments Preview */}
                {pendingAttachments.length > 0 && (
                  <div className="mb-2 sm:mb-3 flex flex-wrap gap-2">
                    {pendingAttachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-md"
                      >
                        <Paperclip className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs font-medium truncate max-w-[120px] sm:max-w-[200px]">
                            {attachment.name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500">
                            {formatFileSize(attachment.size)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePendingAttachment(attachment.id)}
                          className="h-5 w-5 sm:h-6 sm:w-6 p-0 flex-shrink-0 hover:bg-red-100 hover:text-red-600"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-1.5 sm:gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 self-end"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <Textarea
                      ref={textareaRef}
                      placeholder="Napisz wiadomość..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      onClick={(e) => {
                        // Ensure textarea gets focus on mobile
                        e.stopPropagation();
                        e.currentTarget.focus();
                      }}
                      onTouchStart={(e) => {
                        // Explicitly focus on touch for mobile devices
                        e.stopPropagation();
                        const target = e.currentTarget;
                        setTimeout(() => {
                          target.focus();
                        }, 0);
                      }}
                      className="resize-none min-h-[40px] sm:min-h-[44px] max-h-[120px] text-sm sm:text-base touch-manipulation"
                      rows={1}
                      autoFocus={false}
                    />
                  </div>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() && pendingAttachments.length === 0}
                    className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 px-4">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">💬</div>
                <h3 className="text-base sm:text-lg font-medium mb-2">Wybierz rozmowę</h3>
                <p className="text-xs sm:text-sm">Kliknij na rozmowę z listy aby rozpocząć czat</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingSystem;