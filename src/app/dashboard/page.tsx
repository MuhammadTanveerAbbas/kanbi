'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp, Calendar, Zap, Crown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UsageStats, AnalyticsData, SubscriptionStatus } from '@/lib/dashboard-types';
import { DashboardSkeleton } from '@/components/dashboard/skeleton';

// Lazy load recharts as single bundle
const Chart = dynamic(() => import('@/components/dashboard/chart'), { ssr: false });

const RecentBoards = dynamic(() => import('@/components/dashboard/recent-boards'), {
  loading: () => <Card className="border-[#262626] bg-[#141414]"><CardContent className="p-6"><div className="animate-pulse h-32 bg-gray-800 rounded" /></CardContent></Card>,
});

const TaskStatistics = dynamic(() => import('@/components/dashboard/task-statistics'), {
  loading: () => <Card className="border-[#262626] bg-[#141414]"><CardContent className="p-6"><div className="animate-pulse h-32 bg-gray-800 rounded" /></CardContent></Card>,
});

const GoalSetting = dynamic(() => import('@/components/dashboard/goal-setting'), {
  loading: () => <Card className="border-[#262626] bg-[#141414]"><CardContent className="p-6"><div className="animate-pulse h-32 bg-gray-800 rounded" /></CardContent></Card>,
});

const WorkloadHealth = dynamic(() => import('@/components/dashboard/workload-health'), {
  loading: () => <Card className="border-[#262626] bg-[#141414]"><CardContent className="p-6"><div className="animate-pulse h-32 bg-gray-800 rounded" /></CardContent></Card>,
});

export default function DashboardOverview() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [taskStats, setTaskStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    const handleBoardSaved = () => {
      setTimeout(() => {
        fetchData();
      }, 1000);
    };

    window.addEventListener('board-saved', handleBoardSaved);

    return () => {
      window.removeEventListener('board-saved', handleBoardSaved);
    };
  }, []);

  const defaultUsage: UsageStats = {
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
  };

  const fetchData = async () => {
    try {
      const [usageRes, analyticsRes, subscriptionRes, taskStatsRes] = await Promise.all([
        fetch('/api/usage'),
        fetch('/api/analytics'),
        fetch('/api/subscription/status'),
        fetch('/api/task-stats'),
      ]);

      const usageData = usageRes.ok ? await usageRes.json() : defaultUsage;
      setUsage(usageData);

      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : [];
      setAnalytics(analyticsData);

      const subscriptionData = subscriptionRes.ok ? await subscriptionRes.json() : { plan: 'free', status: 'active' };
      setSubscription(subscriptionData);

      const taskStatsData = taskStatsRes.ok ? await taskStatsRes.json() : { urgent: 0, high: 0, medium: 0, low: 0, total: 0, completed: 0 };
      setTaskStats(taskStatsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setUsage(defaultUsage as UsageStats);
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
            icon={Zap}
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

        {/* AI Workload Health */}
        <WorkloadHealth />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Goals and Recent Boards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <GoalSetting />
              <RecentBoards />
            </div>
          </div>
        </div>

        {/* Usage Chart */}
        <Card className="border-[#262626] bg-[#141414]">
          <CardHeader>
            <CardTitle>Task Activity - Last 30 Days</CardTitle>
            <CardDescription>Track your task creation activity</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <Chart data={chartData} />
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
    <Card className={`border-[#262626] bg-[#141414] ${getBorderColor()}`}>
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
            <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
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
