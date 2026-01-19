'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Zap, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UsageStats, AnalyticsData, SubscriptionStatus } from '@/lib/dashboard-types';
import SearchBar from '@/components/dashboard/search-bar';
import RecentBoards from '@/components/dashboard/recent-boards';
import KeyboardShortcuts from '@/components/dashboard/keyboard-shortcuts';
import OnboardingTour from '@/components/dashboard/onboarding-tour';
import TaskStatistics from '@/components/dashboard/task-statistics';
import GoalSetting from '@/components/dashboard/goal-setting';
import ActivityFeed from '@/components/dashboard/activity-feed';
import { DashboardSkeleton } from '@/components/dashboard/skeleton';

export default function DashboardOverview() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [taskStats, setTaskStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usageRes, analyticsRes, subscriptionRes] = await Promise.all([
        fetch('/api/usage'),
        fetch('/api/analytics'),
        fetch('/api/subscription/status'),
      ]);

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage(usageData);
      } else {
        setUsage({ todayCount: 0, todayLimit: 10, monthCount: 0, monthLimit: 300, totalGenerations: 0, boardsUsedToday: 0, boardsUsedMonth: 0 });
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      } else {
        setAnalytics([]);
      }

      if (subscriptionRes.ok) {
        const subscriptionData = await subscriptionRes.json();
        setSubscription(subscriptionData);
      } else {
        setSubscription({ plan: 'free', status: 'active' });
      }

      // Mock task stats - replace with real API
      setTaskStats({
        urgent: 5,
        high: 12,
        medium: 20,
        low: 8,
        total: 45,
        completed: 30,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setUsage({ todayCount: 0, todayLimit: 10, monthCount: 0, monthLimit: 300, totalGenerations: 0, boardsUsedToday: 0, boardsUsedMonth: 0 });
      setAnalytics([]);
      setSubscription({ plan: 'free', status: 'active' });
    } finally {
      setLoading(false);
    }
  };

  const chartData = analytics.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: item.count,
  }));

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <OnboardingTour />
      <KeyboardShortcuts />
      
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <SearchBar />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Boards Used Today"
            value={`${usage?.boardsUsedToday || 0}/10`}
            icon={Zap}
            description={`${10 - (usage?.boardsUsedToday || 0)} remaining`}
            progress={((usage?.boardsUsedToday || 0) / 10) * 100}
          />
          <StatCard
            title="Boards This Month"
            value={`${usage?.boardsUsedMonth || 0}/300`}
            icon={Calendar}
            description={`${300 - (usage?.boardsUsedMonth || 0)} remaining`}
            progress={((usage?.boardsUsedMonth || 0) / 300) * 100}
          />
          <StatCard
            title="Total Tasks"
            value={usage?.totalGenerations || 0}
            icon={TrendingUp}
            description="All time"
          />
          <StatCard
            title="Plan Status"
            value={subscription?.plan === 'premium' ? 'Premium' : 'Free'}
            icon={Crown}
            description={subscription?.plan === 'premium' ? 'Unlimited boards' : '10/day, 300/month'}
            badge={subscription?.plan === 'premium' ? 'premium' : 'free'}
          />
        </div>

        {/* Goals and Recent Boards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GoalSetting />
          <RecentBoards />
        </div>

        {/* Usage Chart */}
        <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414]">
          <CardHeader>
            <CardTitle>Task Activity - Last 30 Days</CardTitle>
            <CardDescription>Track your task creation activity</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6b7280" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#666" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#262626' }}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis 
                  stroke="#666" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#262626' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                  labelStyle={{ color: '#fff', marginBottom: '4px' }}
                  cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#6b7280"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Statistics */}
        <TaskStatistics stats={taskStats} />

        {/* Activity Feed */}
        <ActivityFeed />
      </div>
    </>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  progress,
  badge,
}: {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  progress?: number;
  badge?: 'free' | 'premium';
}) {
  return (
    <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {badge && (
            <Badge
              variant={badge === 'premium' ? 'default' : 'outline'}
              className={`text-xs ${badge === 'premium' ? 'bg-gradient-to-r from-gray-700 to-gray-800 border-0' : ''}`}
            >
              {badge}
            </Badge>
          )}
        </div>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        {progress !== undefined && (
          <div className="mt-3">
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gray-600 to-gray-700 transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
