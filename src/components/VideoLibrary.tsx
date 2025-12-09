import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Play, Plus, Calendar, Share2, Search, Filter, Upload, User, Trash2, Video } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  category: string;
  tags: string[];
  published_date: string;
  views: number;
  likes: number;
  is_public: boolean;
  user_id: string;
  created_at: string;
  publisher_name?: string;
}

const VideoLibrary = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: "",
    description: "",
    video_url: "",
    category: "wellness",
    tags: "",
    published_date: new Date().toISOString().split('T')[0],
    is_public: true
  });

  const categories = [
    "wellness",
    "exercise",
    "nutrition",
    "mental-health",
    "community",
    "education",
    "other"
  ];

  useEffect(() => {
    // Test database connection first
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('video_library')
          .select('count', { count: 'exact', head: true });
        
        if (error) {
          console.error('Database connection test failed:', error);
          toast.error('Database connection failed');
        } else {
          console.log('Database connection successful, video count:', data);
          fetchVideos();
        }
      } catch (err) {
        console.error('Database test error:', err);
        toast.error('Failed to connect to database');
      }
    };
    
    testConnection();
  }, []);

  const fetchVideos = async () => {
    try {
      console.log('Fetching videos...');
      const { data, error } = await supabase
        .from('video_library')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched videos:', data);
      
      // If no videos in database, show empty array
      if (!data || data.length === 0) {
        console.log('No videos found in database');
        setVideos([]);
        return;
      }
      
      // For now, use a simple approach without joins
      const videosWithPublisher = (data || []).map((video: any) => ({
        ...video,
        publisher_name: 'Community Member' // Default publisher name
      }));
      
      setVideos(videosWithPublisher);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
      // Set empty array on error to prevent infinite loading
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async () => {
    if (!user) return;

    try {
      const tagsArray = newVideo.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const { error } = await supabase
        .from('video_library')
        .insert({
          user_id: user.id,
          title: newVideo.title,
          description: newVideo.description,
          video_url: newVideo.video_url,
          category: newVideo.category,
          tags: tagsArray,
          published_date: newVideo.published_date,
          is_public: newVideo.is_public,
          views: 0,
          likes: 0
        } as any);

      if (error) throw error;

      toast.success('Video published successfully!');
      setIsAddDialogOpen(false);
      setNewVideo({
        title: "",
        description: "",
        video_url: "",
        category: "wellness",
        tags: "",
        published_date: new Date().toISOString().split('T')[0],
        is_public: true
      });
      fetchVideos();
    } catch (error) {
      console.error('Error adding video:', error);
      toast.error('Failed to add video');
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('video_library')
        .delete()
        .eq('id', videoId)
        .eq('user_id', user.id);

      if (error) throw error;

      setVideos(videos.filter(v => v.id !== videoId));
      toast.success('Video deleted successfully!');
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getVideoThumbnail = (videoUrl: string) => {
    // For YouTube videos
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = videoUrl.includes('youtu.be') 
        ? videoUrl.split('youtu.be/')[1]?.split('?')[0]
        : videoUrl.split('v=')[1]?.split('&')[0];
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    // For Vimeo videos
    if (videoUrl.includes('vimeo.com')) {
      const videoId = videoUrl.split('vimeo.com/')[1];
      return `https://vumbnail.com/${videoId}.jpg`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Community Contributions</h2>
          <p className="text-black/70">Discover and publish wellness resources for the community</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Publish Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
            <DialogTitle>Share a Contribution</DialogTitle>
            <DialogDescription>
              Share a wellness tip, story, or video for others to learn from
            </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                  placeholder="Enter video title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newVideo.description}
                  onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                  placeholder="Describe the video content"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="video_url">Video URL</Label>
                <Input
                  id="video_url"
                  value={newVideo.video_url}
                  onChange={(e) => setNewVideo({...newVideo, video_url: e.target.value})}
                  placeholder="YouTube, Vimeo, or direct video URL"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newVideo.category} onValueChange={(value) => setNewVideo({...newVideo, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="published_date">Published Date</Label>
                  <Input
                    id="published_date"
                    type="date"
                    value={newVideo.published_date}
                    onChange={(e) => setNewVideo({...newVideo, published_date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={newVideo.tags}
                  onChange={(e) => setNewVideo({...newVideo, tags: e.target.value})}
                  placeholder="wellness, meditation, yoga"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddVideo} disabled={!newVideo.title || !newVideo.video_url}>
                  Publish Video
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => {
          const thumbnail = getVideoThumbnail(video.video_url);
          return (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="relative aspect-video bg-muted">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Play className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <Button
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 shadow-lg"
                      onClick={() => window.open(video.video_url, '_blank')}
                    >
                      <Play className="w-6 h-6 ml-1" fill="currentColor" />
                    </Button>
                  </div>
                  <Badge className="absolute top-2 left-2 bg-primary/90">
                    {video.category}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-2 mb-2">{video.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {video.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {video.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {video.publisher_name && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                      <User className="h-3 w-3" />
                      <span>Published by {video.publisher_name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(video.published_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                        onClick={() => navigator.share?.({ title: video.title, url: video.video_url })}
                      >
                        <Share2 className="w-3 h-3" />
                      </Button>
                      {user && video.user_id === user.id ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the video "{video.title}" from the library.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteVideo(video.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Video
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {searchTerm || selectedCategory !== "all" 
              ? "No videos match your search"
              : "No videos published yet"
            }
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {searchTerm || selectedCategory !== "all" 
              ? "Try adjusting your search terms or filter criteria to find more videos."
              : "Be the first to share a wellness video with the community! Help others by publishing educational content about menopause, health, and wellness."
            }
          </p>
          <Button 
            onClick={() => {
              if (searchTerm || selectedCategory !== "all") {
                setSearchTerm("");
                setSelectedCategory("all");
              } else {
                setIsAddDialogOpen(true);
              }
            }}
            className="bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            {searchTerm || selectedCategory !== "all" ? "Clear Filters" : "Publish First Video"}
          </Button>
        </div>
      )}
    </div>
  );
};

export { VideoLibrary };
export default VideoLibrary;
