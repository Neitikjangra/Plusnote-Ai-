import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { JournalFeed } from '@/components/JournalFeed';
import { ChatBot } from '@/components/ChatBot';
import { ReportGenerator } from '@/components/ReportGenerator';
import { DashboardStats } from '@/components/DashboardStats';
import { Button } from '@/components/ui/button';
import { LogOut, Heart, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/useUserProfile';

interface DashboardProps {
  user: User;
  onSignOut: () => void;
}

export function Dashboard({ user, onSignOut }: DashboardProps) {
  const { toast } = useToast();
  const [entryCount, setEntryCount] = useState(0);
  const { profile, loading: profileLoading, getDisplayName } = useUserProfile(user.id);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: error.message,
      });
    } else {
      onSignOut();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="bg-health-surface-elevated shadow-soft border-b border-health-primary/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Plusnote
              </h1>
              <p className="text-sm text-muted-foreground">Your AI Health Journal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Welcome, {profileLoading ? 'Loading...' : getDisplayName()}
              </span>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              How are you feeling today?
            </h2>
            <p className="text-muted-foreground">
              Track your daily health, discover patterns, and generate insights for your healthcare team.
            </p>
          </div>

          {/* Dashboard Stats */}
          <DashboardStats userId={user.id} entryCount={entryCount} />

          {/* Journal Feed */}
          <JournalFeed userId={user.id} onLogsUpdate={setEntryCount} />
        </div>
      </main>

      {/* Fixed Components */}
      <ChatBot userId={user.id} />
      <ReportGenerator userId={user.id} patientName={getDisplayName()} />
    </div>
  );
}