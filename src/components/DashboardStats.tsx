import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Brain } from 'lucide-react';

interface MoodData {
  date: string;
  mood: string;
  mood_emoji: string;
}

interface HealthAnalysis {
  mood_timeline: MoodData[];
  health_score: number;
  summary: string;
}

interface DashboardStatsProps {
  userId: string;
  entryCount: number;
}

export function DashboardStats({ userId, entryCount }: DashboardStatsProps) {
  const [analysis, setAnalysis] = useState<HealthAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entryCount >= 7) {
      fetchAnalysis();
    }
  }, [userId, entryCount]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-health-patterns', {
        body: { userId }
      });

      if (error) throw error;
      setAnalysis(data);
    } catch (error) {
      console.error('Error fetching health analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 81) return 'text-health-success';
    if (score >= 61) return 'text-health-warning';
    if (score >= 31) return 'text-health-warning';
    return 'text-health-error';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 81) return 'Excellent';
    if (score >= 61) return 'Good';
    if (score >= 31) return 'Fair';
    return 'Poor';
  };

  if (entryCount < 7) {
    return (
      <Card className="border-health-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-primary/10 rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="w-8 h-8 text-health-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Dashboard Unlocking...</h3>
              <p className="text-sm text-muted-foreground">
                Complete {7 - entryCount} more entries to unlock your weekly insights
              </p>
            </div>
            <div className="w-full bg-health-surface-muted rounded-full h-2">
              <div 
                className="bg-gradient-primary h-2 rounded-full transition-all"
                style={{ width: `${(entryCount / 7) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{entryCount}/7 entries</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-health-primary/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-pulse space-y-3">
              <div className="w-16 h-16 bg-health-surface-muted rounded-full mx-auto" />
              <div className="h-4 bg-health-surface-muted rounded w-32 mx-auto" />
              <div className="h-3 bg-health-surface-muted rounded w-48 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  return (
    <div className="space-y-6">
      {/* Weekly Mood Tracker */}
      <Card className="border-health-primary/20 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-health-secondary" />
            Weekly Mood Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            {analysis.mood_timeline.map((day, index) => (
              <div key={index} className="text-center flex-1">
                <div className="text-2xl mb-1">{day.mood_emoji}</div>
                <div className="text-xs text-muted-foreground font-medium">{day.mood}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>7 days ago</span>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>

      {/* Overall Health Score */}
      <Card className="border-health-primary/20 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-health-primary" />
            Overall Health Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">This week's wellness</span>
            <span className={`font-bold text-lg ${getHealthScoreColor(analysis.health_score)}`}>
              {analysis.health_score}/100
            </span>
          </div>
          <Progress 
            value={analysis.health_score} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Poor</span>
            <span>Fair</span>
            <span>Good</span>
            <span>Excellent</span>
          </div>
          <div className={`text-center font-semibold ${getHealthScoreColor(analysis.health_score)}`}>
            {getHealthScoreLabel(analysis.health_score)}
          </div>
          {analysis.summary && (
            <div className="bg-health-surface-elevated rounded-lg p-3 mt-4">
              <p className="text-sm text-foreground italic">"{analysis.summary}"</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}