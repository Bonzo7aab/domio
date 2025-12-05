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
  Gavel
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
import { getJobById, getTenderById } from '../lib/data';
import { useRouter } from 'next/navigation';

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
  const [conversations, setConversations] = useState<Conversation[]>(
    initialConversations || mockConversations
  );
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    initialConversationId || (conversations.length > 0 ? conversations[0].id : null)
  );
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>(
    initialMessages || mockMessages
  );

  // Sync with parent state when initialMessages changes
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [jobData, setJobData] = useState<any>(null);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedConversation]);

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
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const messageContent = newMessage.trim();

    // If we have a custom send handler (for database integration), use it
    if (onSendMessage) {
      // Call the handler - let the parent handle optimistic updates
      onSendMessage(selectedConversation, messageContent);
      setNewMessage('');
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

    Array.from(files).forEach(file => {
      const attachment: MessageAttachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 'document',
        size: file.size
      };

      const message: Message = {
        id: `msg-${Date.now()}`,
        senderId: user?.id || '',
        senderName: user?.firstName || '',
        senderAvatar: user?.avatar || '',
        content: `Przesłano plik: ${file.name}`,
        timestamp: new Date(),
        read: false,
        attachments: [attachment],
        type: 'text'
      };

      setMessages(prev => ({
        ...prev,
        [selectedConversation]: [...(prev[selectedConversation] || []), message]
      }));
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
    
    // If we have a custom conversation select handler, call it
    if (onConversationSelect) {
      onConversationSelect(conversationId);
    }
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
    : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50";
  
  const contentClass = isFullPage
    ? "bg-background w-full h-full flex overflow-hidden min-h-0"
    : "bg-white rounded-lg shadow-xl w-full max-w-6xl h-[80vh] overflow-hidden flex min-h-0";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Conversations List */}
        <div className="w-1/3 border-r flex flex-col min-h-0">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Wiadomości</h2>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Szukaj rozmów..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-medium mb-2">Brak rozmów</h3>
                  <p className="text-sm">Nie masz jeszcze żadnych rozmów. Rozpocznij nową rozmowę poprzez złożenie zapytania o wycenę.</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const otherUser = conversation.participants.find(p => p.id !== user?.id || '');
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationClick(conversation.id)}
                      className={`p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedConversation === conversation.id ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={otherUser?.avatar} />
                            <AvatarFallback>
                              {otherUser?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {otherUser?.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-sm truncate">{otherUser?.name}</h3>
                            <div className="flex items-center gap-1">
                              {conversation.lastMessage && (
                                <span className="text-xs text-gray-500">
                                  {formatTime(conversation.lastMessage.timestamp)}
                                </span>
                              )}
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">{otherUser?.company}</p>
                          {conversation.jobTitle && (
                            <p className="text-xs text-blue-600 mb-1 truncate">
                              📋 {conversation.jobTitle}
                            </p>
                          )}
                          {conversation.lastMessage && (
                            <p className="text-sm text-gray-600 truncate">
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
        <div className="flex-1 min-h-0 flex flex-col">
          {selectedConversation && currentConversation && otherParticipant ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={otherParticipant?.avatar || ''} />
                        <AvatarFallback>
                          {otherParticipant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {otherParticipant.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{otherParticipant.name}</h3>
                      <p className="text-sm text-gray-600">{otherParticipant.company}</p>
                      {currentConversation.jobTitle && (
                        <p className="text-xs text-blue-600 mb-1">📋 {currentConversation.jobTitle}</p>
                      )}
                      {/* Compact Job Details */}
                      {jobData && !isLoadingJob && (
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {jobData.company && (
                            <span className="truncate">
                              {typeof jobData.company === 'string' 
                                ? jobData.company 
                                : jobData.company?.name || 'Unknown'}
                            </span>
                          )}
                          {jobData.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
                                {typeof jobData.location === 'string' 
                                  ? jobData.location 
                                  : jobData.location.city || 'Nieznana lokalizacja'}
                              </span>
                            </div>
                          )}
                          {jobData.salary && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{jobData.salary}</span>
                            </div>
                          )}
                          {currentConversation.jobId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/jobs/${currentConversation.jobId}`)}
                              className="h-5 px-2 text-xs"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Szczegóły
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {otherParticipant.phone && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{otherParticipant.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-hidden min-h-0">
                <ScrollArea className="h-full p-4" style={{ height: '100%' }}>
                  <div className="space-y-4">
                  {currentMessages.map((message, index) => {
                    const isOwnMessage = message.senderId === user?.id || '';
                    const showDate = index === 0 || 
                      formatDate(message.timestamp) !== formatDate(currentMessages[index - 1].timestamp);

                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="text-center my-4">
                            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                              {formatDate(message.timestamp)}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                            <div
                              className={`p-3 rounded-lg ${
                                isOwnMessage
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {message.attachments.map((attachment) => (
                                    <div
                                      key={attachment.id}
                                      className={`p-2 rounded border ${
                                        isOwnMessage ? 'border-white/20 bg-white/10' : 'border-gray-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Paperclip className="h-4 w-4" />
                                        <div className="flex-1">
                                          <p className="text-xs font-medium">{attachment.name}</p>
                                          <p className="text-xs opacity-70">{formatFileSize(attachment.size)}</p>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                          ⬇
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                              isOwnMessage ? 'justify-end' : 'justify-start'
                            }`}>
                              <span>{formatTime(message.timestamp)}</span>
                              {isOwnMessage && (
                                <CheckCheck className={`h-3 w-3 ${message.read ? 'text-blue-500' : 'text-gray-400'}`} />
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
              <div className="p-4 border-t">
                {isTyping && (
                  <div className="text-xs text-gray-500 mb-2">
                    {otherParticipant.name} pisze...
                  </div>
                )}
                <div className="flex items-end gap-2">
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
                    className="mb-2"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Napisz wiadomość..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="resize-none min-h-[40px] max-h-[120px]"
                      rows={1}
                    />
                  </div>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="h-10 w-10"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-lg font-medium mb-2">Wybierz rozmowę</h3>
                <p>Kliknij na rozmowę z listy aby rozpocząć czat</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingSystem;