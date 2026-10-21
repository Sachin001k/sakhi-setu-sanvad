import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Bell, 
  Plus, 
  Clock, 
  Pill, 
  Droplets, 
  Moon, 
  Activity, 
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createNotification } from '@/lib/notifications';
import { toast } from 'sonner';

interface Reminder {
  id: string;
  reminder_type: string;
  title: string;
  description?: string;
  scheduled_time: string;
  days_of_week: number[];
  is_active: boolean;
  created_at: string;
}

const Reminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const [formData, setFormData] = useState({
    reminder_type: 'medication',
    title: '',
    description: '',
    scheduled_time: '09:00',
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
    is_active: true
  });

  const reminderTypes = [
    { value: 'medication', label: 'Medication', icon: Pill, color: 'text-blue-500' },
    { value: 'hydration', label: 'Hydration', icon: Droplets, color: 'text-cyan-500' },
    { value: 'sleep', label: 'Sleep', icon: Moon, color: 'text-purple-500' },
    { value: 'exercise', label: 'Exercise', icon: Activity, color: 'text-green-500' },
    { value: 'appointment', label: 'Appointment', icon: Calendar, color: 'text-orange-500' }
  ];

  const daysOfWeek = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' }
  ];

  const fetchReminders = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setReminders((data || []).map((r) => ({
        ...r,
        description: r.description ?? undefined,
        days_of_week: r.days_of_week ?? [],
        is_active: r.is_active ?? true,
        created_at: r.created_at ?? ''
      })));
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast.error('Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const reminderData = {
        ...formData,
        user_id: user.id
      };

      if (editingReminder) {
        const { error } = await supabase
          .from('reminders')
          .update(reminderData)
          .eq('id', editingReminder.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success('Reminder updated and saved.');
        
        void createNotification(
          'Reminder Updated',
          `"${formData.title}" reminder has been updated`,
          'reminder',
          '/profile?tab=reminders'
        );
      } else {
        const { error } = await supabase
          .from('reminders')
          .insert([reminderData]);

        if (error) throw error;
        toast.success('Reminder saved.');
        
        const reminderTypeLabel = reminderTypes.find(r => r.value === formData.reminder_type)?.label || formData.reminder_type;
        void createNotification(
          'Reminder Saved',
          `New ${reminderTypeLabel.toLowerCase()} reminder "${formData.title}" has been saved`,
          'reminder',
          '/profile?tab=reminders'
        );
      }

      await fetchReminders();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving reminder:', error);
      toast.error('Failed to save reminder');
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      reminder_type: reminder.reminder_type,
      title: reminder.title,
      description: reminder.description || '',
      scheduled_time: reminder.scheduled_time,
      days_of_week: reminder.days_of_week,
      is_active: reminder.is_active
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id ?? '');

      if (error) throw error;
      toast.success('Reminder deleted successfully!');
      await fetchReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error('Failed to delete reminder');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_active: !isActive })
        .eq('id', id)
        .eq('user_id', user?.id ?? '');

      if (error) throw error;
      await fetchReminders();
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast.error('Failed to update reminder');
    }
  };

  const resetForm = () => {
    setFormData({
      reminder_type: 'medication',
      title: '',
      description: '',
      scheduled_time: '09:00',
      days_of_week: [1, 2, 3, 4, 5, 6, 7],
      is_active: true
    });
    setEditingReminder(null);
  };

  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort()
    }));
  };

  const getReminderIcon = (type: string) => {
    const reminderType = reminderTypes.find(rt => rt.value === type);
    return reminderType ? reminderType.icon : Bell;
  };

  const getReminderColor = (type: string) => {
    const reminderType = reminderTypes.find(rt => rt.value === type);
    return reminderType ? reminderType.color : 'text-gray-500';
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDaysText = (days: number[]) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes(6) && !days.includes(7)) return 'Weekdays';
    if (days.length === 2 && days.includes(6) && days.includes(7)) return 'Weekends';
    
    const dayNames = days.map(day => {
      const dayObj = daysOfWeek.find(d => d.value === day);
      return dayObj ? dayObj.label.slice(0, 3) : '';
    });
    return dayNames.join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reminders</h2>
          <p className="text-gray-600">Keep a saved list of your wellness routines</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
              </DialogTitle>
              <DialogDescription>
                Save reminders for your wellness routine. They are saved to your list here; the app does not send alerts for them yet.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="reminder_type">Type</Label>
                <Select
                  value={formData.reminder_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, reminder_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reminderTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${type.color}`} />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Take evening medication"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional notes..."
                />
              </div>

              <div>
                <Label htmlFor="scheduled_time">Time</Label>
                <Input
                  id="scheduled_time"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label>Days of Week</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {daysOfWeek.map((day) => (
                    <Button
                      key={day.value}
                      type="button"
                      variant={formData.days_of_week.includes(day.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDayToggle(day.value)}
                    >
                      {day.label.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingReminder ? 'Update' : 'Create'} Reminder
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {reminders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No Reminders Yet</h3>
            <p className="text-gray-600 mb-4">
              Save your first reminder to keep track of your wellness routine
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Reminder
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reminders.map((reminder) => {
            const Icon = getReminderIcon(reminder.reminder_type);
            const color = getReminderColor(reminder.reminder_type);
            
            return (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={!reminder.is_active ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gray-100`}>
                          <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{reminder.title}</h3>
                          {reminder.description && (
                            <p className="text-sm text-gray-600">{reminder.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              {formatTime(reminder.scheduled_time)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {getDaysText(reminder.days_of_week)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={reminder.is_active ? "default" : "secondary"}>
                          {reminder.is_active ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Inactive
                            </div>
                          )}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(reminder)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(reminder.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(reminder.id, reminder.is_active)}
                          >
                            {reminder.is_active ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Reminders;
