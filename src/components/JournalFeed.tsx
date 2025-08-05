import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, Heart, Moon, Tag, Edit2, Trash2, X, Check } from 'lucide-react';
import { format } from 'date-fns';

interface HealthLog {
  id: string;
  entry_text: string;
  mood_rating: number | null;
  sleep_rating: number | null;
  symptoms: any;
  tags: string[] | null;
  log_date: string;
  created_at: string;
}

interface JournalFeedProps {
  userId: string;
  onLogsUpdate?: (count: number) => void;
}

export function JournalFeed({ userId, onLogsUpdate }: JournalFeedProps) {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({
    entry_text: '',
    mood_rating: [5],
    sleep_rating: [5],
    tags: [] as string[],
    tagInput: ''
  });
  const [editEntry, setEditEntry] = useState({
    entry_text: '',
    mood_rating: [5],
    sleep_rating: [5],
    tags: [] as string[],
    tagInput: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [userId]);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching logs",
        description: error.message,
      });
    } else {
      setLogs(data || []);
      onLogsUpdate?.(data?.length || 0);
    }
  };

  const handleAddTag = () => {
    if (newEntry.tagInput.trim() && !newEntry.tags.includes(newEntry.tagInput.trim())) {
      setNewEntry(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewEntry(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSaveEntry = async () => {
    if (!newEntry.entry_text.trim()) {
      toast({
        variant: "destructive",
        title: "Entry required",
        description: "Please write something about your day.",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('health_logs')
      .insert({
        user_id: userId,
        entry_text: newEntry.entry_text,
        mood_rating: newEntry.mood_rating[0],
        sleep_rating: newEntry.sleep_rating[0],
        tags: newEntry.tags.length > 0 ? newEntry.tags : null,
        log_date: new Date().toISOString().split('T')[0]
      });

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error saving entry",
        description: error.message,
      });
    } else {
      toast({
        title: "Entry saved!",
        description: "Your health log has been recorded.",
      });
      setNewEntry({
        entry_text: '',
        mood_rating: [5],
        sleep_rating: [5],
        tags: [],
        tagInput: ''
      });
      setShowNewEntry(false);
      fetchLogs();
    }
  };

  const handleEditLog = (log: HealthLog) => {
    setEditingId(log.id);
    setEditEntry({
      entry_text: log.entry_text,
      mood_rating: [log.mood_rating || 5],
      sleep_rating: [log.sleep_rating || 5],
      tags: log.tags || [],
      tagInput: ''
    });
  };

  const handleUpdateEntry = async (logId: string) => {
    if (!editEntry.entry_text.trim()) {
      toast({
        variant: "destructive",
        title: "Entry required",
        description: "Please write something about your day.",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('health_logs')
      .update({
        entry_text: editEntry.entry_text,
        mood_rating: editEntry.mood_rating[0],
        sleep_rating: editEntry.sleep_rating[0],
        tags: editEntry.tags.length > 0 ? editEntry.tags : null,
      })
      .eq('id', logId);

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating entry",
        description: error.message,
      });
    } else {
      toast({
        title: "Entry updated!",
        description: "Your health log has been updated.",
      });
      setEditingId(null);
      fetchLogs();
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('health_logs')
      .delete()
      .eq('id', logId);

    setLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting entry",
        description: error.message,
      });
    } else {
      toast({
        title: "Entry deleted!",
        description: "Your health log has been deleted.",
      });
      fetchLogs();
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditEntry({
      entry_text: '',
      mood_rating: [5],
      sleep_rating: [5],
      tags: [],
      tagInput: ''
    });
  };

  const handleAddEditTag = () => {
    if (editEntry.tagInput.trim() && !editEntry.tags.includes(editEntry.tagInput.trim())) {
      setEditEntry(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }));
    }
  };

  const handleRemoveEditTag = (tagToRemove: string) => {
    setEditEntry(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getMoodEmoji = (rating: number) => {
    if (rating <= 2) return '😢';
    if (rating <= 4) return '😐';
    if (rating <= 6) return '😊';
    if (rating <= 8) return '😄';
    return '🤩';
  };

  const getSleepEmoji = (rating: number) => {
    if (rating <= 2) return '😴';
    if (rating <= 4) return '😪';
    if (rating <= 6) return '😌';
    if (rating <= 8) return '😊';
    return '✨';
  };

  return (
    <div className="space-y-6">
      {/* Add New Entry Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => setShowNewEntry(!showNewEntry)}
          className="bg-gradient-primary hover:opacity-90 shadow-floating"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Entry
        </Button>
      </div>

      {/* New Entry Form */}
      {showNewEntry && (
        <Card className="shadow-elevated border-health-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-health-primary" />
              <h3 className="font-semibold">How are you feeling today?</h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="entry">Tell me about your day...</Label>
              <Textarea
                id="entry"
                placeholder="What did you eat? How did you sleep? Any symptoms or feelings you noticed?"
                value={newEntry.entry_text}
                onChange={(e) => setNewEntry(prev => ({ ...prev, entry_text: e.target.value }))}
                className="min-h-[120px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-health-secondary" />
                  <Label>Mood: {getMoodEmoji(newEntry.mood_rating[0])} ({newEntry.mood_rating[0]}/10)</Label>
                </div>
                <Slider
                  value={newEntry.mood_rating}
                  onValueChange={(value) => setNewEntry(prev => ({ ...prev, mood_rating: value }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-health-accent" />
                  <Label>Sleep Quality: {getSleepEmoji(newEntry.sleep_rating[0])} ({newEntry.sleep_rating[0]}/10)</Label>
                </div>
                <Slider
                  value={newEntry.sleep_rating}
                  onValueChange={(value) => setNewEntry(prev => ({ ...prev, sleep_rating: value }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-health-success" />
                <Label>Tags (symptoms, foods, activities)</Label>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag (e.g., headache, pizza, exercise)"
                  value={newEntry.tagInput}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, tagInput: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Add
                </Button>
              </div>
              {newEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newEntry.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowNewEntry(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEntry} disabled={loading} className="bg-gradient-primary">
              {loading ? 'Saving...' : 'Save Entry'}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Logs Feed */}
      <div className="space-y-4">
        {logs.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">No entries yet. Start your health journey today!</p>
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="shadow-soft hover:shadow-elevated transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-health-primary" />
                    <span className="font-medium">{format(new Date(log.log_date), 'MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {editingId !== log.id && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditLog(log)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLog(log.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {log.mood_rating && (
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-health-secondary" />
                        <span className="text-sm">{getMoodEmoji(log.mood_rating)}</span>
                      </div>
                    )}
                    {log.sleep_rating && (
                      <div className="flex items-center gap-1">
                        <Moon className="h-4 w-4 text-health-accent" />
                        <span className="text-sm">{getSleepEmoji(log.sleep_rating)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {editingId === log.id ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor={`edit-entry-${log.id}`}>Edit your entry...</Label>
                      <Textarea
                        id={`edit-entry-${log.id}`}
                        value={editEntry.entry_text}
                        onChange={(e) => setEditEntry(prev => ({ ...prev, entry_text: e.target.value }))}
                        className="min-h-[120px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-health-secondary" />
                          <Label>Mood: {getMoodEmoji(editEntry.mood_rating[0])} ({editEntry.mood_rating[0]}/10)</Label>
                        </div>
                        <Slider
                          value={editEntry.mood_rating}
                          onValueChange={(value) => setEditEntry(prev => ({ ...prev, mood_rating: value }))}
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4 text-health-accent" />
                          <Label>Sleep Quality: {getSleepEmoji(editEntry.sleep_rating[0])} ({editEntry.sleep_rating[0]}/10)</Label>
                        </div>
                        <Slider
                          value={editEntry.sleep_rating}
                          onValueChange={(value) => setEditEntry(prev => ({ ...prev, sleep_rating: value }))}
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-health-success" />
                        <Label>Tags</Label>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag"
                          value={editEntry.tagInput}
                          onChange={(e) => setEditEntry(prev => ({ ...prev, tagInput: e.target.value }))}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddEditTag()}
                        />
                        <Button type="button" onClick={handleAddEditTag} variant="outline">
                          Add
                        </Button>
                      </div>
                      {editEntry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {editEntry.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleRemoveEditTag(tag)}
                            >
                              {tag} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleUpdateEntry(log.id)} 
                        disabled={loading} 
                        className="bg-gradient-primary"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {loading ? 'Updating...' : 'Update'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-foreground mb-3">{log.entry_text}</p>
                    {log.tags && log.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {log.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}