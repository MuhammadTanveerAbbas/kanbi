'use client';

import { Component, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, RefreshCw, Home, Download } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Simple analytics - track error without personal data
    if (typeof window !== 'undefined') {
      try {
        const errorData = {
          message: error.message,
          stack: error.stack?.substring(0, 500), // Limit stack trace
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        };
        localStorage.setItem('kanbi-last-error', JSON.stringify(errorData));
      } catch (e) {
        // Ignore if localStorage fails
      }
    }
    
    this.setState({ errorInfo: errorInfo.componentStack });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleExportData = () => {
    try {
      const tasks = localStorage.getItem('kanbi-tasks');
      if (tasks) {
        const dataStr = tasks;
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `kanbi-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-muted/20">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                Don't worry - your tasks are safe. Let's get you back on track.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-mono text-muted-foreground">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Button
                  onClick={this.handleRefresh}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Page
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  className="w-full"
                  variant="outline"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
                
                <Button
                  onClick={this.handleExportData}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Save My Tasks First
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                If this keeps happening, try clearing your browser data or contact support.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}