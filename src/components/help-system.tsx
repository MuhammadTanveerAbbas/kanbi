'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  HelpCircle, 
  Keyboard, 
  MousePointer, 
  FileText, 
  Shield,
  Zap,
  Download
} from 'lucide-react';

export default function HelpSystem() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="fixed bottom-4 right-4 z-30">
          <HelpCircle className="h-4 w-4 mr-2" />
          Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Help & Support</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="getting-started" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="getting-started" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  How to Use KANBI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold">1. Paste Your Notes</h4>
                    <p className="text-sm text-muted-foreground">
                      Copy meeting notes, ideas, or thoughts into the text area. Use bullet points for best results.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">2. Generate Tasks</h4>
                    <p className="text-sm text-muted-foreground">
                      Click "Turn This Into Tasks" and we'll find actionable items and organize them.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">3. Track Progress</h4>
                    <p className="text-sm text-muted-foreground">
                      Drag tasks between "To Do", "Working On", and "Finished" columns as you work.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">4. Save Your Work</h4>
                    <p className="text-sm text-muted-foreground">
                      Export your tasks to a file for backup or sharing with your team.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="shortcuts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5" />
                  Keyboard Shortcuts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quick add task</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + N</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Focus notes area</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + /</kbd>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Save/Export</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl + S</kbd>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MousePointer className="h-5 w-5" />
                  Mouse Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold">Drag & Drop</h4>
                    <p className="text-sm text-muted-foreground">
                      Drag tasks between columns to change their status.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Quick Actions</h4>
                    <p className="text-sm text-muted-foreground">
                      Hover over tasks to see quick action buttons: ▶ (start), ✓ (complete), edit, delete.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="faq" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Where is my data stored?</h4>
                <p className="text-sm text-muted-foreground">
                  All your tasks are stored locally in your browser. Nothing is sent to our servers.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Can I use this offline?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! The basic features work offline. AI task suggestions require an internet connection.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">How do I backup my tasks?</h4>
                <p className="text-sm text-muted-foreground">
                  Use the "Save to Computer" button to export your tasks as a JSON file.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Can I share tasks with my team?</h4>
                <p className="text-sm text-muted-foreground">
                  Export your tasks and share the file with teammates. They can import it into their own board.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">What if I accidentally delete a task?</h4>
                <p className="text-sm text-muted-foreground">
                  There's no undo feature yet, but your tasks are automatically saved. Consider exporting regularly as backup.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="privacy" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">🔒 Local Storage Only</h4>
                  <p className="text-sm text-muted-foreground">
                    Your tasks never leave your browser. We can't see your data even if we wanted to.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">🚫 No Tracking</h4>
                  <p className="text-sm text-muted-foreground">
                    We don't use cookies, analytics, or any tracking. Your usage is completely private.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">📤 Data Portability</h4>
                  <p className="text-sm text-muted-foreground">
                    Export your data anytime. It's yours, and you can take it anywhere.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Quick tooltip component for inline help
export function QuickTooltip({ children, content }: { 
  children: React.ReactNode; 
  content: string; 
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-50">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
        </div>
      )}
    </div>
  );
}