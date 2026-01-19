'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Plus, Save, Trash, Edit } from 'lucide-react';

export default function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('activityFeed');
    if (saved) {
      setActivities(JSON.parse(saved));
    }
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'create': return <Plus className="h-4 w-4 text-green-400" />;
      case 'save': return <Save className="h-4 w-4 text-blue-400" />;
      case 'delete': return <Trash className="h-4 w-4 text-red-400" />;
      case 'edit': return <Edit className="h-4 w-4 text-yellow-400" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 10).map((activity, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="mt-1">{getIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function addActivity(type: string, message: string) {
  const saved = localStorage.getItem('activityFeed');
  const activities = saved ? JSON.parse(saved) : [];
  activities.unshift({ type, message, timestamp: new Date().toISOString() });
  localStorage.setItem('activityFeed', JSON.stringify(activities.slice(0, 50)));
}
