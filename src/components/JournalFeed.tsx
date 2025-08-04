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
import { Plus, Calendar, Heart, Moon, Tag } from 'lucide-react';
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
}

export function JournalFeed({ userId }: JournalFeedProps) {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({
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
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}