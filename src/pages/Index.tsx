import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthDialog } from '@/components/AuthDialog';
import { Dashboard } from '@/pages/Dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, FileText, TrendingUp, Sparkles, Brain } from 'lucide-react';
import heroImage from '@/assets/hero-image.jpg';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-surface">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading Plusnote...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard user={user} onSignOut={() => setUser(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Health and wellness" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-20">
          <div className="text-center space-y-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Plusnote
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Your AI-powered health journal companion that helps you track daily wellness, 
              discover patterns, and generate professional reports for your healthcare team.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => setAuthDialogOpen(true)}
                className="bg-gradient-primary hover:opacity-90 text-lg px-8 py-3 shadow-floating"
                size="lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Your Health Journey
              </Button>
              
              <Button
                onClick={() => setAuthDialogOpen(true)}
                variant="outline"
                className="text-lg px-8 py-3"
                size="lg"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need for better health tracking
            </h2>
            <p className="text-xl text-muted-foreground">
              Simple journaling meets powerful AI insights
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="shadow-elevated hover:shadow-floating transition-shadow border-health-primary/20">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">AI Journal Companion</h3>
                <p className="text-muted-foreground">
                  Chat with your personal health assistant that remembers your history and helps you reflect on patterns.
                </p>
                <Badge variant="secondary" className="bg-health-surface">
                  <Brain className="w-3 h-3 mr-1" />
                  AI-Powered
                </Badge>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="shadow-elevated hover:shadow-floating transition-shadow border-health-primary/20">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-health-secondary rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Daily Health Feed</h3>
                <p className="text-muted-foreground">
                  Beautiful, Instagram-style cards for tracking mood, sleep, symptoms, and daily experiences.
                </p>
                <Badge variant="secondary" className="bg-health-surface">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Pattern Recognition
                </Badge>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="shadow-elevated hover:shadow-floating transition-shadow border-health-primary/20">
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-semibold">Smart Reports</h3>
                <p className="text-muted-foreground">
                  Generate professional health summaries for doctor visits with one click. Download as PDF or share digitally.
                </p>
                <Badge variant="secondary" className="bg-health-surface">
                  <FileText className="w-3 h-3 mr-1" />
                  Medical-Grade
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-health-surface-elevated">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to take control of your health?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of people using Plusnote to understand their health better and communicate more effectively with their healthcare team.
          </p>
          <Button
            onClick={() => setAuthDialogOpen(true)}
            className="bg-gradient-primary hover:opacity-90 text-lg px-12 py-4 shadow-floating"
            size="lg"
          >
            <Heart className="mr-2 h-5 w-5" />
            Start Journaling Today
          </Button>
          <p className="text-sm text-muted-foreground">
            Free to start • No medical advice • Secure & private
          </p>
        </div>
      </section>

      {/* Auth Dialog */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onAuthSuccess={(user) => setUser(user)}
      />
    </div>
  );
};

export default Index;
