import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { 
  Search, Send, Paperclip, MoreVertical, 
  Phone, Video, Info 
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getCurrentUserId } from '../../utils/auth';
import { toast } from 'sonner';
import { IMessage } from '@stomp/stompjs';

interface MessagesProps {
  onNavigate: (page: string) => void;
}

interface MessageDto {
  messageId?: number;
  projectId?: number;
  senderId?: number;
  senderName?: string;
  content?: string;
  createdAt?: string;
}

interface ProjectDto {
  projectId?: number;
  title?: string;
  description?: string;
  creatorId?: number;
  status?: string;
}

interface Conversation {
  projectId: number;
  title: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unread: number;
  messages: MessageDto[];
}

export function Messages({ onNavigate }: MessagesProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);
  const userId = getCurrentUserId();

  const { isConnected, subscribe, send } = useWebSocket({
    onConnect: () => {
      console.log('WebSocket connected');
      // Don't subscribe here - wait for project selection
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected');
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
  });

  const handleNewMessage = useCallback((messageDto: MessageDto) => {
    setConversations(prev => prev.map(conv => {
      if (conv.projectId === messageDto.projectId) {
        // Check if message already exists (avoid duplicates)
        const messageExists = conv.messages.some(
          msg => msg.messageId === messageDto.messageId
        );
        
        if (!messageExists) {
          return {
            ...conv,
            messages: [...conv.messages, messageDto],
            lastMessage: messageDto.content,
            lastMessageTime: messageDto.createdAt,
            unread: selectedProjectId === conv.projectId ? 0 : conv.unread + 1,
          };
        }
      }
      return conv;
    }));
  }, [selectedProjectId]);

  const subscribeToProject = useCallback((projectId: number) => {
    if (!isConnected || !subscribe) {
      console.log('Cannot subscribe: WebSocket not ready');
      return;
    }

    // Unsubscribe from previous project if any
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    // Subscribe to project-specific topic
    const destination = `/topic/project/${projectId}`;
    const subscription = subscribe(destination, (message: IMessage) => {
      try {
        const messageDto: MessageDto = JSON.parse(message.body);
        handleNewMessage(messageDto);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    if (subscription) {
      subscriptionRef.current = subscription;
      console.log(`Subscribed to project ${projectId}`);
    } else {
      console.error('Failed to subscribe to project');
    }
  }, [isConnected, subscribe, handleNewMessage]);

  // Fetch messages for a specific project
  const fetchMessagesForProject = useCallback(async (projectId: number) => {
    setLoadingMessages(true);
    try {
      console.log(`[Messages] Fetching messages for project ${projectId}`);
      const messagesRes = await axiosClient.get<MessageDto[]>(`/messages/${projectId}`);
      const messages = messagesRes.data || [];
      console.log(`[Messages] Loaded ${messages.length} messages for project ${projectId}`, messages);

      // Update conversation with fetched messages (create conversation if it doesn't exist)
      setConversations(prev => {
        const existingConv = prev.find(conv => conv.projectId === projectId);
        if (existingConv) {
          // Update existing conversation
          const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;
          return prev.map(conv => {
            if (conv.projectId === projectId) {
              return {
                ...conv,
                messages: messages, // Replace all messages with fetched ones
                lastMessage: lastMessage?.content,
                lastMessageTime: lastMessage?.createdAt,
              };
            }
            return conv;
          });
        } else {
          // Conversation doesn't exist - fetch project details and create it
          console.log(`[Messages] Conversation not found for project ${projectId}, fetching project details...`);
          axiosClient.get<ProjectDto>(`/projects/${projectId}`).then(projectRes => {
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;
            setConversations(prevConv => [...prevConv, {
              projectId: projectId,
              title: projectRes.data?.title || 'Untitled Project',
              lastMessage: lastMessage?.content,
              lastMessageTime: lastMessage?.createdAt,
              unread: 0,
              messages: messages,
            }]);
          }).catch(err => {
            console.error('Failed to fetch project details:', err);
            // Add conversation anyway with default title
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;
            setConversations(prevConv => [...prevConv, {
              projectId: projectId,
              title: 'Untitled Project',
              lastMessage: lastMessage?.content,
              lastMessageTime: lastMessage?.createdAt,
              unread: 0,
              messages: messages,
            }]);
          });
          return prev; // Return previous state while fetching project details
        }
      });
    } catch (error: any) {
      console.error(`[Messages] Failed to fetch messages for project ${projectId}:`, error);
      console.error(`[Messages] Error status: ${error?.response?.status}, message: ${error?.response?.data?.message || error?.message}`);
      // Show error only if it's not a permission issue
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        console.warn(`[Messages] Permission denied for project ${projectId} - user may not be a member`);
      } else {
        toast.error(`Failed to load messages: ${error?.response?.data?.message || error?.message}`);
      }
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Fetch user's projects
  useEffect(() => {
    fetchProjects();
  }, []);

  // Handle URL query parameter for projectId
  useEffect(() => {
    const projectIdParam = searchParams.get('projectId');
    if (projectIdParam) {
      const projectIdNum = Number(projectIdParam);
      if (!isNaN(projectIdNum) && projectIdNum !== selectedProjectId) {
        setSelectedProjectId(projectIdNum);
      }
    }
  }, [searchParams, selectedProjectId]);

  // Fetch messages when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      console.log(`[Messages] Project ${selectedProjectId} selected, fetching messages...`);
      fetchMessagesForProject(selectedProjectId);
    }
  }, [selectedProjectId, fetchMessagesForProject]);

  // Subscribe to WebSocket when project is selected
  useEffect(() => {
    if (!selectedProjectId || !isConnected) {
      return;
    }

    // Add a small delay to ensure STOMP is fully ready
    const timeoutId = setTimeout(() => {
      subscribeToProject(selectedProjectId);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [selectedProjectId, isConnected, subscribeToProject]);

  // Monitor container dimensions for debugging
  useEffect(() => {
    if (!messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const checkDimensions = () => {
      try {
        const rect = container.getBoundingClientRect();
        const styles = window.getComputedStyle(container);
        console.log('[Scroll Debug] Container dimensions:', {
          scrollHeight: container.scrollHeight,
          clientHeight: container.clientHeight,
          offsetHeight: container.offsetHeight,
          scrollTop: container.scrollTop,
          scrollTopMax: container.scrollHeight - container.clientHeight,
          canScroll: container.scrollHeight > container.clientHeight,
          boundingRect: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
          },
          computedStyles: {
            height: styles.height,
            maxHeight: styles.maxHeight,
            minHeight: styles.minHeight,
            overflow: styles.overflow,
            overflowY: styles.overflowY,
            overflowX: styles.overflowX,
            display: styles.display,
            flex: styles.flex,
          },
          parentHeight: container.parentElement?.clientHeight,
          parentComputedHeight: container.parentElement ? window.getComputedStyle(container.parentElement).height : null,
        });
      } catch (error) {
        console.error('[Scroll Debug] Error checking dimensions:', error);
      }
    };
    
    // Check immediately
    checkDimensions();
    
    // Check after a delay to see if dimensions change
    const timeout1 = setTimeout(checkDimensions, 100);
    const timeout2 = setTimeout(checkDimensions, 500);
    const timeout3 = setTimeout(checkDimensions, 1000);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [conversations, selectedProjectId, loadingMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    try {
      const currentConversation = conversations.find(conv => conv.projectId === selectedProjectId);
      console.log('[Scroll Debug] Messages changed, attempting to scroll:', {
        selectedProjectId,
        conversationMessagesCount: currentConversation?.messages?.length || 0,
        containerRefExists: !!messagesContainerRef.current,
        endRefExists: !!messagesEndRef.current,
        loadingMessages,
      });
    scrollToBottom();
    } catch (error) {
      console.error('[Scroll Debug] Error in scroll effect:', error);
    }
  }, [conversations, selectedProjectId, loadingMessages]);

  const fetchProjects = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch projects where user is a member
      const res = await axiosClient.get('/projects/student/me');
      const projects: ProjectDto[] = res.data || [];

      // Initialize conversations for each project (without loading messages yet)
      const initialConversations: Conversation[] = projects.map((project) => {
          return {
            projectId: project.projectId!,
            title: project.title || 'Untitled Project',
          lastMessage: undefined,
          lastMessageTime: undefined,
            unread: 0,
          messages: [], // Will be loaded when project is selected
          };
      });

      setConversations(initialConversations);
      
      // Handle project selection from URL param or select first project
      const projectIdParam = searchParams.get('projectId');
      if (projectIdParam) {
        const projectIdNum = Number(projectIdParam);
        if (!isNaN(projectIdNum)) {
          // Check if project exists in user's projects
          const projectExists = initialConversations.some(conv => conv.projectId === projectIdNum);
          if (projectExists) {
            setSelectedProjectId(projectIdNum);
          } else {
            // Project might exist but user not a member - add it anyway
            setSelectedProjectId(projectIdNum);
            // Add to conversations if not already there
            const existing = initialConversations.find(conv => conv.projectId === projectIdNum);
            if (!existing) {
              // Fetch project details to get title
              axiosClient.get<ProjectDto>(`/projects/${projectIdNum}`).then(projectRes => {
                setConversations(prev => [...prev, {
                  projectId: projectIdNum,
                  title: projectRes.data?.title || 'Untitled Project',
                  lastMessage: undefined,
                  lastMessageTime: undefined,
                  unread: 0,
                  messages: [],
                }]);
              }).catch(err => {
                console.error('Failed to fetch project details:', err);
              });
            }
          }
        }
      } else if (initialConversations.length > 0 && !selectedProjectId) {
        setSelectedProjectId(initialConversations[0].projectId);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };


  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedProjectId || sending) return;

    setSending(true);
    try {
      // Send message via REST API (which will broadcast via WebSocket)
      await axiosClient.post(`/messages/${selectedProjectId}`, {
        content: messageInput.trim(),
      });

      setMessageInput('');
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error?.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    try {
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        try {
          if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            console.log('[Scroll Debug] Container found:', {
              scrollHeight: container.scrollHeight,
              clientHeight: container.clientHeight,
              scrollTop: container.scrollTop,
              canScroll: container.scrollHeight > container.clientHeight,
              className: container.className,
              computedStyle: {
                height: window.getComputedStyle(container).height,
                maxHeight: window.getComputedStyle(container).maxHeight,
                overflow: window.getComputedStyle(container).overflow,
                overflowY: window.getComputedStyle(container).overflowY,
              }
            });

            if (container.scrollHeight > container.clientHeight) {
              container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
              });
              console.log('[Scroll Debug] Scrolled to bottom');
            } else {
              console.warn('[Scroll Debug] Cannot scroll - content height is not greater than container height');
            }
          } else {
            console.warn('[Scroll Debug] messagesContainerRef.current is null');
            // Fallback to scrollIntoView
            if (messagesEndRef.current) {
              console.log('[Scroll Debug] Using fallback scrollIntoView');
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            } else {
              console.warn('[Scroll Debug] messagesEndRef.current is also null');
            }
          }
        } catch (error) {
          console.error('[Scroll Debug] Error in scrollToBottom:', error);
        }
      }, 100);
    } catch (error) {
      console.error('[Scroll Debug] Error setting up scroll timeout:', error);
    }
  };

  const getAvatarInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatMessageTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversation = conversations.find(
    conv => conv.projectId === selectedProjectId
  );
  
  // Define this before useEffect hooks that use it

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
        <h1 className="mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Collaborate with your teammates in real-time
            {!isConnected && (
              <span className="ml-2 text-destructive text-xs">(Connecting...)</span>
            )}
        </p>
        </div>
      </div>

      {/* Messages Container */}
      <Card className="rounded-xl shadow-sm border-border overflow-hidden">
        <div className="grid lg:grid-cols-12 h-[calc(100vh-16rem)] min-h-0">
          {/* Conversations List */}
          <div className="lg:col-span-4 border-r border-border flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Conversation List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                  <button
                      key={conversation.projectId}
                      onClick={() => {
                        setSelectedProjectId(conversation.projectId);
                        // Update URL query param
                        setSearchParams({ projectId: conversation.projectId.toString() });
                        // Mark as read when selected
                        setConversations(prev => prev.map(conv =>
                          conv.projectId === conversation.projectId
                            ? { ...conv, unread: 0 }
                            : conv
                        ));
                      }}
                    className={`w-full p-4 rounded-lg mb-1 transition-colors text-left ${
                        selectedProjectId === conversation.projectId
                        ? 'bg-primary/10'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getAvatarInitials(conversation.title)}
                          </AvatarFallback>
                        </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                            <p className="truncate font-medium">
                              {conversation.title}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {formatTime(conversation.lastMessageTime)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mb-1">
                            {conversation.lastMessage || 'No messages yet'}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="rounded-lg text-xs">
                              Project
                          </Badge>
                          {conversation.unread > 0 && (
                            <Badge className="rounded-full h-5 w-5 p-0 flex items-center justify-center">
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-8 flex flex-col h-full min-h-0 overflow-hidden">
            {selectedConversation ? (
              <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getAvatarInitials(selectedConversation.title)}
                  </AvatarFallback>
                </Avatar>
                <div>
                      <p>{selectedConversation.title}</p>
                  <p className="text-sm text-muted-foreground">
                        {isConnected ? 'Online' : 'Connecting...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* <Button variant="ghost" size="icon" className="rounded-lg">
                  <Info className="h-5 w-5" />
                </Button> */}
                {/* <Button variant="ghost" size="icon" className="rounded-lg">
                  <MoreVertical className="h-5 w-5" />
                </Button> */}
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={(el) => {
                messagesContainerRef.current = el;
                if (el) {
                  // Use requestAnimationFrame to check after render
                  requestAnimationFrame(() => {
                    const rect = el.getBoundingClientRect();
                    const styles = window.getComputedStyle(el);
                    console.log('[Scroll Debug] Container ref set:', {
                      scrollHeight: el.scrollHeight,
                      clientHeight: el.clientHeight,
                      offsetHeight: el.offsetHeight,
                      boundingHeight: rect.height,
                      canScroll: el.scrollHeight > el.clientHeight,
                      computedHeight: styles.height,
                      computedMaxHeight: styles.maxHeight,
                      computedOverflowY: styles.overflowY,
                      parentHeight: el.parentElement?.clientHeight,
                      parentComputedHeight: el.parentElement ? window.getComputedStyle(el.parentElement).height : null,
                    });
                  });
                }
              }}
              className="flex-1 min-h-0 overflow-y-auto p-4"
              style={{ height: 0 }} // Force flex item to respect height constraint
            >
              <div className="space-y-4">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading messages...</span>
                      </div>
                    ) : selectedConversation.messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      selectedConversation.messages.map((message) => {
                        const isOwn = message.senderId?.toString() === userId;
                        return (
                          <div
                            key={message.messageId}
                            className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                          >
                            {!isOwn && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getAvatarInitials(message.senderName || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                            <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                              {!isOwn && (
                                <p className="text-xs text-muted-foreground mb-1">
                                  {message.senderName || 'Unknown'}
                                </p>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                                  isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatMessageTime(message.createdAt)}
                              </p>
                            </div>
                    </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                {/* <Button variant="ghost" size="icon" className="rounded-lg">
                  <Paperclip className="h-5 w-5" />
                </Button> */}
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                  }}
                  className="flex-1"
                      disabled={!isConnected || sending}
                />
                <Button 
                  size="icon" 
                  className="rounded-lg"
                  onClick={handleSendMessage}
                      disabled={!isConnected || sending || !messageInput.trim()}
                >
                      {sending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                  <Send className="h-5 w-5" />
                      )}
                </Button>
              </div>
            </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
