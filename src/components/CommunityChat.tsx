import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  Heart,
  Smile,
  Loader2,
  Users,
  CheckCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from '@/lib/notifications';
import { toast } from 'sonner';

interface Message {
  id: string;
  user_id: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  content: string;
  created_at: string;
  likes: number;
  is_anonymous: boolean;
  is_own: boolean;
  liked_by_me: boolean;
}

const POST_COLUMNS = 'id, user_id, author_name, author_avatar_url, content, created_at, likes, is_anonymous, is_own, liked_by_me';

// Within this many pixels of the end of the list counts as "at the bottom".
const BOTTOM_THRESHOLD_PX = 40;

const getDisplayName = (message: Message) =>
  message.author_name || (message.is_anonymous ? 'Anonymous' : 'Community member');

const fetchPostById = async (id: string): Promise<Message | null> => {
  const { data, error } = await supabase
    .from('community_posts_public')
    .select(POST_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching post:', error);
    return null;
  }
  return (data as Message | null) ?? null;
};

export const CommunityChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [pendingLikes, setPendingLikes] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const { user } = useAuth();

  // Common emojis for quick access
  const commonEmojis = ['😊', '❤️', '👍', '😢', '🤗', '💪', '🌟', '🙏', '😅', '💯', '🎉', '🔥'];

  const appendMessage = useCallback((message: Message) => {
    setMessages(prev => (prev.some(m => m.id === message.id) ? prev : [...prev, message]));
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('community_posts_public')
          .select(POST_COLUMNS)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        if (cancelled) return;

        isAtBottomRef.current = true;
        setMessages(((data as Message[] | null) ?? []).reverse());
      } catch (error) {
        console.error('Error fetching messages:', error);
        if (!cancelled) toast.error('Failed to load messages');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMessages();

    // The base table is owner-only, so other users' changes arrive as a
    // minimal broadcast ({ id, likes }) and the row is re-read from the view.
    const postsChannel = supabase
      .channel('community-posts')
      .on('broadcast', { event: 'insert' }, async ({ payload }) => {
        const id = payload?.id as string | undefined;
        if (!id) return;

        const post = await fetchPostById(id);
        if (!post || cancelled) return;

        if (post.is_own) {
          isAtBottomRef.current = true;
        } else {
          if (!isAtBottomRef.current) {
            setNewMessageCount(count => count + 1);
          }
          toast.success(`New message from ${getDisplayName(post)}`);
        }
        appendMessage(post);
      })
      .on('broadcast', { event: 'update' }, ({ payload }) => {
        const id = payload?.id as string | undefined;
        if (!id || typeof payload.likes !== 'number') return;
        setMessages(prev =>
          prev.map(msg => (msg.id === id ? { ...msg, likes: payload.likes } : msg))
        );
      })
      .on('broadcast', { event: 'delete' }, ({ payload }) => {
        const id = payload?.id as string | undefined;
        if (!id) return;
        setMessages(prev => prev.filter(msg => msg.id !== id));
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Community posts channel subscription error');
          toast.error('Failed to connect to real-time updates');
        }
      });

    // Online users: count comes only from the synced presence state, so
    // join/leave events can't double-count.
    const presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        setOnlineUsers(Object.keys(presenceChannel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [user, appendMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    isAtBottomRef.current = true;
    setNewMessageCount(0);
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD_PX;
    isAtBottomRef.current = atBottom;
    if (atBottom) setNewMessageCount(0);
  };

  // Follow new messages only when the user is already at the bottom;
  // otherwise leave their scroll position alone and let the badge count up.
  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const content = newMessage.trim();
      const title = content.length > 80 ? `${content.slice(0, 77)}...` : content;

      const { data, error } = await supabase
        .from('community_posts')
        .insert([{
          user_id: user.id,
          title, // Supabase table enforces NOT NULL on title
          content,
          is_anonymous: false
        }])
        .select('id')
        .single();

      if (error) throw error;

      setNewMessage('');
      toast.success('Message sent!');

      // Show it right away; the broadcast may arrive later (or not at all).
      if (data?.id) {
        const post = await fetchPostById(data.id);
        if (post) {
          isAtBottomRef.current = true;
          appendMessage(post);
        }
      }

      createNotification(
        'Community Post Shared',
        'Your message has been shared with the community',
        'community',
        '/community'
      );
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const toggleLike = async (messageId: string) => {
    if (!user || pendingLikes.has(messageId)) return;

    setPendingLikes(prev => new Set(prev).add(messageId));
    try {
      const { data, error } = await supabase.rpc('toggle_post_like', { p_post_id: messageId });
      if (error) throw error;

      const result = (data as { liked: boolean; likes: number }[] | null)?.[0];
      if (result) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, liked_by_me: result.liked, likes: result.likes }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Could not update like');
    } finally {
      setPendingLikes(prev => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          <p className="text-gray-600 dark:text-gray-300">Loading community messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Community Chat</h2>
          <p className="text-gray-600 dark:text-gray-300">Connect with other women on their menopause journey</p>
        </div>
      </div>

      {/* Messages */}
      <Card className="flex flex-col max-h-[70vh] min-h-[400px]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-pink-500" />
              <CardTitle className="text-lg">Live Chat</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={`${isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                {isConnected ? 'Live' : 'Offline'}
              </Badge>
              {onlineUsers > 0 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  <Users className="w-3 h-3 mr-1" />
                  {onlineUsers} online
                </Badge>
              )}
              {newMessageCount > 0 && (
                <Badge
                  variant="destructive"
                  className="bg-pink-500 text-white animate-pulse cursor-pointer"
                  onClick={scrollToBottom}
                >
                  {newMessageCount} new
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages List */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
          >
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No messages yet. Be the first to start the conversation!</p>
              </div>
            ) : (
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${message.is_own ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[80%] ${message.is_own ? 'order-2' : 'order-1'}`}>
                      <div className={`flex items-start gap-2 sm:gap-3 ${message.is_own ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                          {message.author_avatar_url && (
                            <AvatarImage src={message.author_avatar_url} alt={getDisplayName(message)} />
                          )}
                          <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs">
                            {getInitials(getDisplayName(message))}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 ${message.is_own ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block p-2 sm:p-3 rounded-2xl break-words ${
                            message.is_own 
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}>
                            <p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 sm:gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400 ${
                            message.is_own ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className="truncate max-w-[100px] sm:max-w-none">{getDisplayName(message)}</span>
                            <span>•</span>
                            <span className="whitespace-nowrap">{formatTime(message.created_at)}</span>
                            {message.is_own && (
                              <CheckCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            )}
                            <button
                              type="button"
                              onClick={() => toggleLike(message.id)}
                              disabled={pendingLikes.has(message.id)}
                              aria-pressed={message.liked_by_me}
                              aria-label={message.liked_by_me ? 'Unlike message' : 'Like message'}
                              className={`flex items-center gap-1 rounded px-1 transition-colors disabled:opacity-50 ${
                                message.liked_by_me ? 'text-pink-500' : 'hover:text-pink-500'
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${message.liked_by_me ? 'fill-current' : ''}`} />
                              {message.likes > 0 && <span>{message.likes}</span>}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            
            <div ref={messagesEndRef} />
          </div>


          {/* Message Input */}
          <div className="p-4 border-t bg-white dark:bg-gray-900">
            <form onSubmit={sendMessage} className="flex gap-3">
              <div className="flex-1 relative">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Share your thoughts with the community..."
                  className="pr-12 min-h-[60px] max-h-[120px] resize-none text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-neon-pink focus:ring-neon-pink/20 rounded-xl text-black dark:text-white placeholder-gray-500 dark:placeholder-white"
                  disabled={sending}
                  rows={2}
                />
                <div className="absolute right-3 top-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-pink-500"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 h-[60px] self-end"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </form>
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-xl border shadow-lg"
              >
                <div className="flex flex-wrap gap-2">
                  {commonEmojis.map((emoji, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addEmoji(emoji)}
                      className="h-10 w-10 p-0 text-xl hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-lg"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
