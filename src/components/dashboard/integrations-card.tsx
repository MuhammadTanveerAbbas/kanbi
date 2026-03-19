'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plug2, Zap, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

const integrations = [
  {
    id: 'notion',
    name: 'Notion',
    description: 'Two-way sync with your Notion workspace',
    icon: Zap,
    status: 'available',
    color: 'text-gray-400',
  },
];

export default function IntegrationsCard() {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrationStatus();
    
    // Listen for URL changes to refresh status after OAuth
    const handleFocus = () => {
      fetchIntegrationStatus();
    };
    
    // Check for success parameter in URL and refresh status
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'notion_connected') {
      // Delay to ensure database has been updated
      setTimeout(() => {
        fetchIntegrationStatus();
      }, 1000);
    }
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchIntegrationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations/status');
      
      if (response.ok) {
        const data = await response.json();
        setConnected(data.connected || {});
      } else {
        setConnected({});
      }
    } catch (error) {
      console.error('Failed to fetch integration status:', error);
      setConnected({});
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (integrationId: string) => {
    setConnecting(integrationId);
    
    try {
      if (integrationId === 'notion') {
        window.location.href = '/api/integrations/notion/auth';
      } else {
        alert('Integration not available');
        setConnecting(null);
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect. Please try again.');
      setConnecting(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    try {
      const response = await fetch('/api/integrations/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: integrationId }),
      });

      if (response.ok) {
        setConnected(prev => ({ ...prev, [integrationId]: false }));
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      alert('Failed to disconnect. Please try again.');
    }
  };

  return (
    <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414] hover:border-[#3a3a3a] transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Plug2 className="h-5 w-5" />
              Integrations
            </CardTitle>
            <CardDescription className="text-sm">
              Connect your favorite tools to supercharge your workflow
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchIntegrationStatus}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const isConnected = connected[integration.id] || false;
          const isConnecting = connecting === integration.id;

          return (
            <div
              key={integration.id}
              className="flex items-center justify-between p-4 rounded-lg border border-[#262626] bg-[#0a0a0a] hover:border-[#3a3a3a] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg bg-[#141414] ${integration.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{integration.name}</h4>
                    {isConnected && (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
                        Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {integration.description}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={isConnected ? 'outline' : 'default'}
                onClick={() => isConnected ? handleDisconnect(integration.id) : handleConnect(integration.id)}
                disabled={isConnecting}
                className="min-w-[90px]"
              >
                {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
          );
        })}
        
        <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-gray-400">
            <strong className="text-primary">Premium Feature:</strong> Integrations are available on the Premium plan ($9/month). 
            Upgrade to unlock automatic syncing and save hours every week.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
