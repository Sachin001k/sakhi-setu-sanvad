import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MessageCircle, 
  Send, 
  Plus, 
  Users, 
  Settings, 
  Smile, 
  Image, 
  Paperclip,
  MoreVertical,
  Reply,
  Heart,
  Share2
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  message_type: string;
  room_id: string | null;
  reply_to: string | null;
  created_at: string;
  author_name: string | null;
  author_avatar_url: string | null;
}

const MESSAGE_COLUMNS = 'id, user_id, content, message_type, room_id, reply_to, created_at, author_name, author_avatar_url';

const fetchMessageById = async (id: string): Promise<ChatMessage | null> => {
  const { data, error } = await supabase
    .from('chat_messages_public')
    .select(MESSAGE_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching message:', error);
    return null;
  }
  return (data as ChatMessage | null) ?? null;
};

interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_by: string;
  created_at: string;
}

const EnhancedChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  // The room whose messages are currently wanted; responses for any other
  // room are stale and get dropped.
  const activeRoomRef = useRef<string | null>(null);

  const appendMessage = useCallback((message: ChatMessage) => {
    if (message.room_id !== activeRoomRef.current) return;
    setMessages(prev => (prev.some(m => m.id === message.id) ? prev : [...prev, message]));
  }, []);

  const fetchMessages = useCallback(async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages_public')
        .select(MESSAGE_COLUMNS)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (activeRoomRef.current !== roomId) return;
      if (error) throw error;
      setMessages((data as ChatMessage[] | null) ?? []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  }, []);

  const fetchRooms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
      if (data && data.length > 0) {
        setActiveRoom(current => current ?? data[0].id);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
    setMessages([]);
    if (!activeRoom) return;

    fetchMessages(activeRoom);

    const channel = supabase
      .channel(`chat-room-${activeRoom}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${activeRoom}`
        },
        async (payload) => {
          const id = (payload.new as { id?: string }).id;
          if (!id) return;
          const message = await fetchMessageById(id);
          if (message) appendMessage(message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoom, fetchMessages, appendMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !activeRoom) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          content: newMessage.trim(),
          message_type: 'text',
          room_id: activeRoom,
          reply_to: replyingTo
        })
        .select('id')
        .single();

      if (error) throw error;

      setNewMessage("");
      setReplyingTo(null);
      if (data?.id) {
        const message = await fetchMessageById(data.id);
        if (message) appendMessage(message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const createRoom = async () => {
    if (!newRoom.name.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('chat_rooms')
        .insert({
          name: newRoom.name.trim(),
          description: newRoom.description.trim() || null,
          is_public: true,
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Room created successfully!');
      setIsCreateRoomOpen(false);
      setNewRoom({ name: "", description: "" });
      fetchRooms();
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-[600px] flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Chat Rooms</h2>
            <Dialog open={isCreateRoomOpen} onOpenChange={setIsCreateRoomOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                  <DialogDescription>
                    Create a new chat room for the community
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="room-name">Room Name</Label>
                    <Input
                      id="room-name"
                      value={newRoom.name}
                      onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
                      placeholder="Enter room name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="room-description">Description (optional)</Label>
                    <Textarea
                      id="room-description"
                      value={newRoom.description}
                      onChange={(e) => setNewRoom({...newRoom, description: e.target.value})}
                      placeholder="Enter room description"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateRoomOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createRoom} disabled={!newRoom.name.trim()}>
                      Create Room
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {rooms.map((room) => (
              <motion.div
                key={room.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={`cursor-pointer transition-all ${
                    activeRoom === room.id 
                      ? 'bg-primary/10 border-primary' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setActiveRoom(room.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{room.name}</h3>
                        {room.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {room.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {rooms.find(r => r.id === activeRoom)?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {messages.length} messages
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">
                    <Users className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${
                      message.user_id === user?.id ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <Avatar className="w-8 h-8">
                      {message.author_avatar_url && (
                        <AvatarImage src={message.author_avatar_url} alt={message.author_name || 'Community member'} />
                      )}
                      <AvatarFallback className="text-xs">
                        {getInitials(message.author_name || 'Community member')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 max-w-[70%] ${
                      message.user_id === user?.id ? 'text-right' : 'text-left'
                    }`}>
                      <div className={`inline-block p-3 rounded-2xl ${
                        message.user_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {message.user_id !== user?.id && (
                            <span className="text-xs font-medium opacity-80">
                              {message.author_name || 'Community member'}
                            </span>
                          )}
                          <span className="text-xs opacity-70">
                            {formatTime(message.created_at)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                            onClick={() => setReplyingTo(message.id)}
                          >
                            <Reply className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-muted/30">
              {replyingTo && (
                <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Replying to message...
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReplyingTo(null)}
                  >
                    ×
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="pr-12"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Smile className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Image className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a room to start chatting</h3>
              <p className="text-muted-foreground">
                Choose a room from the sidebar or create a new one
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { EnhancedChat };
export default EnhancedChat;
