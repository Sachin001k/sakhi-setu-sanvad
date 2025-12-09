import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Heart, 
  MoreVertical, 
  Reply,
  ThumbsUp,
  Share2,
  Flag,
  Smile,
  Loader2,
  Users,
  Clock,
  Check,
  CheckCheck,
  Wifi
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  likes: number;
  is_anonymous?: boolean;
  replies?: Reply[];
}

interface Reply {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
}

export const CommunityChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Common emojis for quick access
  const commonEmojis = ['😊', '❤️', '👍', '😢', '🤗', '💪', '🌟', '🙏', '😅', '💯', '🎉', '🔥'];

  useEffect(() => {
    if (user) {
      fetchMessages();
      const unsubscribe = subscribeToMessages();
      const presenceUnsubscribe = trackOnlineStatus();
      
      return () => {
        if (unsubscribe) unsubscribe();
        if (presenceUnsubscribe) presenceUnsubscribe();
      };
    }
  }, [user]);

  const trackOnlineStatus = () => {
    if (!user) return () => {};

    // Track user as online
    const presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setOnlineUsers(Object.keys(state).length);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers(prev => prev + 1);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers(prev => Math.max(0, prev - 1));
      })
      .subscribe(async (status) => {
        console.log('Presence subscription status:', status);
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
      console.log('Unsubscribing from presence updates');
      presenceChannel.unsubscribe();
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMessageCount(0); // Clear new message count when scrolling to bottom
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          *,
          users!community_posts_user_id_fkey(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedMessages = data?.map(post => ({
        id: post.id,
        user_id: post.user_id,
        content: post.content,
        created_at: post.created_at,
        user_name: post.users?.full_name || 'Anonymous',
        likes: post.likes || 0,
        is_anonymous: post.is_anonymous || false,
        replies: []
      })) || [];

      setMessages(formattedMessages.reverse());
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('community_posts', {
        config: {
          broadcast: { self: true },
          presence: { key: user?.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_posts'
        },
        async (payload) => {
          console.log('New message received:', payload);
          const newPost = payload.new as any;
          
          // Fetch user details for the new message
          const { data: userData } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', newPost.user_id)
            .single();

          const newMessage: Message = {
            id: newPost.id,
            user_id: newPost.user_id,
            content: newPost.content,
            created_at: newPost.created_at,
            user_name: userData?.full_name || 'Anonymous',
            likes: newPost.likes || 0,
            is_anonymous: newPost.is_anonymous || false,
            replies: []
          };
          
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) return prev;
            
            // Show notification for new messages (not from current user)
            if (newMessage.user_id !== user?.id) {
              setNewMessageCount(prev => prev + 1);
              toast.success(`New message from ${newMessage.user_name}`);
            }
            
            return [...prev, newMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'community_posts'
        },
        (payload) => {
          console.log('Message updated:', payload);
          const updatedPost = payload.new as any;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedPost.id 
                ? { ...msg, likes: updatedPost.likes || 0 }
                : msg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'community_posts'
        },
        (payload) => {
          console.log('Message deleted:', payload);
          const deletedPost = payload.old as any;
          setMessages(prev => prev.filter(msg => msg.id !== deletedPost.id));
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Channel subscription error');
          toast.error('Failed to connect to real-time updates');
        }
      });

    return () => {
      console.log('Unsubscribing from real-time updates');
      supabase.removeChannel(channel);
    };
  };


  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const content = newMessage.trim();
      const title = content.length > 80 ? `${content.slice(0, 77)}...` : content;

      const { error } = await supabase
        .from('community_posts')
        .insert([{
          user_id: user.id,
          title, // Supabase table enforces NOT NULL on title
          content,
          is_anonymous: false
        }]);

      if (error) throw error;

      setNewMessage('');
      toast.success('Message sent!');
      
      // Create notification for community post
      if ((window as any).createNotification) {
        (window as any).createNotification(
          'Community Post Shared',
          'Your message has been shared with the community',
          'post',
          '/community'
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const likeMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('community_posts')
        .update({ likes: messages.find(m => m.id === messageId)?.likes + 1 })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, likes: msg.likes + 1 }
            : msg
        )
      );
    } catch (error) {
      console.error('Error liking message:', error);
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

  const addEmojiToReply = (emoji: string) => {
    setReplyContent(prev => prev + emoji);
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
                <Badge variant="destructive" className="bg-pink-500 text-white animate-pulse">
                  {newMessageCount} new
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
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
                    className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[80%] ${message.user_id === user?.id ? 'order-2' : 'order-1'}`}>
                      <div className={`flex items-start gap-2 sm:gap-3 ${message.user_id === user?.id ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                          <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs">
                            {getInitials(message.user_name || 'A')}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 ${message.user_id === user?.id ? 'text-right' : 'text-left'}`}>
                          <div className={`inline-block p-2 sm:p-3 rounded-2xl break-words ${
                            message.user_id === user?.id 
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}>
                            <p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 sm:gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400 ${
                            message.user_id === user?.id ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className="truncate max-w-[100px] sm:max-w-none">{message.user_name}</span>
                            <span>•</span>
                            <span className="whitespace-nowrap">{formatTime(message.created_at)}</span>
                            {message.user_id === user?.id && (
                              <CheckCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            )}
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
