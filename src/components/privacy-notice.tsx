'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Lock, Eye, Database, X } from 'lucide-react';

export default function PrivacyNotice() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      {/* Privacy banner for first-time users */}
      <PrivacyBanner />
      
      {/* Privacy details dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            Privacy & Security
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your Privacy & Security
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Local Storage Only</h3>
                  <p className="text-sm text-muted-foreground">
                    All your tasks and notes stay in your browser. We never see or store your data on our servers.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">No Account Required</h3>
                  <p className="text-sm text-muted-foreground">
                    No email, password, or personal information needed. Start using immediately.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">No Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    We don't use cookies, analytics, or tracking. Your usage is completely private.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">What We Do Collect</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Basic error logs (no personal data) to fix bugs</li>
                <li>• Anonymous usage statistics to improve the tool</li>
                <li>• Nothing else - that's it!</li>
              </ul>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Your Data Rights</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Export your tasks anytime as JSON files</li>
                <li>• Clear all data by clearing browser storage</li>
                <li>• No data to delete from our servers (we don't have any)</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PrivacyBanner() {
  const [showBanner, setShowBanner] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('kanbi-privacy-acknowledged');
  });

  const acknowledgePivacy = () => {
    localStorage.setItem('kanbi-privacy-acknowledged', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 md:left-auto md:right-4 md:max-w-sm">
      <Card className="border-primary/20 bg-background/95 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Your Privacy Matters</p>
              <p className="text-xs text-muted-foreground mb-3">
                Your tasks stay in your browser. We don't collect personal data.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={acknowledgePivacy}>
                  Got it
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowBanner(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}