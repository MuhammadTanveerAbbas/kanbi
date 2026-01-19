'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Zap, Crown, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UsageStats, AnalyticsData, SubscriptionStatus } from '@/lib/dashboard-types';
import SearchBar from '@/components/dashboard/search-bar';
import RecentBoards from '@/components/dashboard/recent-boards';
import KeyboardShortcuts from '@/components/dashboard/keyboard-shortcuts';
import OnboardingTour from '@/components/dashboard/onboarding-tour';
import TaskStatistics from '@/components/dashboard/task-statistics';
import GoalSetting from '@/components/dashboard/goal-setting';
import { DashboardSkeleton } from '@/components/dashboard/skeleton';

export default function DashboardOverview() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [taskStats, setTaskStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    // Listen for board saved events to refresh usage stats
    const handleBoardSaved = () => {
      // Refresh usage data after a short delay to allow backend to update
      setTimeout(() => {
        fetchData();
      }, 1000);
    };

    // Set up periodic refresh every 30 seconds to keep stats updated
    const refreshInterval = setInterval(() => {
      fetchData();
    }, 30000);

    window.addEventListener('board-saved', handleBoardSaved);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('board-saved', handleBoardSaved);
    };
  }, []);

  const fetchData = async () => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const cacheBuster = new Date().getTime();
      const [usageRes, analyticsRes, subscriptionRes, taskStatsRes] = await Promise.all([
        fetch(`/api/usage?t=${cacheBuster}`, { cache: 'no-store' }),
        fetch('/api/analytics'),
        fetch('/api/subscription/status'),
        fetch('/api/task-stats'),
      ]);

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        console.log('Usage data received:', usageData);
        setUsage(usageData);
        // Update subscription from usage data if available
        if (usageData.plan) {
          setSubscription({ plan: usageData.plan, status: 'active' });
        }
      } else {
        const errorText = await usageRes.text();
        console.error('Usage API error:', usageRes.status, errorText);
        setUsage({
          todayCount: 0,
          todayLimit: 10,
          monthCount: 0,
          monthLimit: 300,
          totalGenerations: 0,
          boardsUsedToday: 0,
          boardsUsedMonth: 0,
          boardsTodayLimit: 10,
          boardsMonthLimit: 300,
          aiUsedToday: 0,
          aiUsedMonth: 0,
          aiTodayLimit: 10,
          aiMonthLimit: 300,
          plan: 'free'
        });
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

      if (taskStatsRes.ok) {
        const taskStatsData = await taskStatsRes.json();
        setTaskStats(taskStatsData);
      } else {
        setTaskStats({ urgent: 0, high: 0, medium: 0, low: 0, total: 0, completed: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setUsage({
        todayCount: 0,
        todayLimit: 10,
        monthCount: 0,
        monthLimit: 300,
        totalGenerations: 0,
        boardsUsedToday: 0,
        boardsUsedMonth: 0,
        boardsTodayLimit: 10,
        boardsMonthLimit: 300,
        aiUsedToday: 0,
        aiUsedMonth: 0,
        aiTodayLimit: 10,
        aiMonthLimit: 300,
        plan: 'free'
      });
      setAnalytics([]);
      setSubscription({ plan: 'free', status: 'active' });
      setTaskStats({ urgent: 0, high: 0, medium: 0, low: 0, total: 0, completed: 0 });
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
      <div className="space-y-6">
        {/* Search Bar - Removed from here, now in layout */}
        <h1 className="text-2xl font-bold text-center sm:text-left">Dashboard Overview</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Boards Used Today"
            value={`${usage?.boardsUsedToday || 0}/${usage?.boardsTodayLimit || 10}`}
            icon={Zap}
            description={`${Math.max(0, (usage?.boardsTodayLimit || 10) - (usage?.boardsUsedToday || 0))} remaining`}
            progress={((usage?.boardsUsedToday || 0) / (usage?.boardsTodayLimit || 10)) * 100}
            status={getUsageStatus(usage?.boardsUsedToday || 0, usage?.boardsTodayLimit || 10)}
          />
          <StatCard
            title="Boards This Month"
            value={`${usage?.boardsUsedMonth || 0}/${usage?.boardsMonthLimit || 300}`}
            icon={Calendar}
            description={`${Math.max(0, (usage?.boardsMonthLimit || 300) - (usage?.boardsUsedMonth || 0))} remaining`}
            progress={((usage?.boardsUsedMonth || 0) / (usage?.boardsMonthLimit || 300)) * 100}
            status={getUsageStatus(usage?.boardsUsedMonth || 0, usage?.boardsMonthLimit || 300)}
          />
          <StatCard
            title="AI Used Today"
            value={`${usage?.aiUsedToday || 0}/${usage?.aiTodayLimit || 10}`}
            icon={Sparkles}
            description={`${Math.max(0, (usage?.aiTodayLimit || 10) - (usage?.aiUsedToday || 0))} remaining`}
            progress={((usage?.aiUsedToday || 0) / (usage?.aiTodayLimit || 10)) * 100}
            status={getUsageStatus(usage?.aiUsedToday || 0, usage?.aiTodayLimit || 10)}
          />
          <StatCard
            title="AI This Month"
            value={`${usage?.aiUsedMonth || 0}/${usage?.aiMonthLimit || 300}`}
            icon={TrendingUp}
            description={`${Math.max(0, (usage?.aiMonthLimit || 300) - (usage?.aiUsedMonth || 0))} remaining`}
            progress={((usage?.aiUsedMonth || 0) / (usage?.aiMonthLimit || 300)) * 100}
            status={getUsageStatus(usage?.aiUsedMonth || 0, usage?.aiMonthLimit || 300)}
          />
        </div>

        {/* Plan Status Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title="Plan Status"
            value={subscription?.plan === 'premium' || usage?.plan === 'premium' ? 'Premium' : 'Free'}
            icon={Crown}
            description={
              subscription?.plan === 'premium' || usage?.plan === 'premium'
                ? `${usage?.boardsTodayLimit || 50} boards/day, ${usage?.boardsMonthLimit || 1500}/month`
                : `${usage?.boardsTodayLimit || 10} boards/day, ${usage?.boardsMonthLimit || 300}/month`
            }
            badge={subscription?.plan === 'premium' || usage?.plan === 'premium' ? 'premium' : 'free'}
          />
          <StatCard
            title="Total Tasks"
            value={usage?.totalGenerations || 0}
            icon={TrendingUp}
            description="All time"
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
      </div>
    </>
  );
}

function getUsageStatus(used: number, limit: number): 'normal' | 'warning' | 'error' {
  if (limit === 0) return 'normal';
  const percentage = (used / limit) * 100;
  if (percentage >= 100) return 'error';
  if (percentage >= 90) return 'warning';
  return 'normal';
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  progress,
  badge,
  status = 'normal',
}: {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  progress?: number;
  badge?: 'free' | 'premium';
  status?: 'normal' | 'warning' | 'error';
}) {
  const getProgressColor = () => {
    switch (status) {
      case 'error':
        return 'bg-gradient-to-r from-red-600 to-red-700';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-600 to-yellow-700';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-700';
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case 'error':
        return 'border-red-500/50';
      case 'warning':
        return 'border-yellow-500/50';
      default:
        return 'border-[#262626]';
    }
  };

  return (
    <Card className={`border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414] ${getBorderColor()}`}>
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
        {description && (
          <p className={`text-xs mt-1 ${
            status === 'error' ? 'text-red-400' :
            status === 'warning' ? 'text-yellow-400' :
            'text-gray-500'
          }`}>
            {description}
            {status === 'error' && ' - Limit reached!'}
            {status === 'warning' && ' - Approaching limit'}
          </p>
        )}
        {progress !== undefined && (
          <div className="mt-3">
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor()} transition-all duration-300`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            {progress > 0 && (
              <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% used</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
