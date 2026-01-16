'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Zap, Crown, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UsageStats, AnalyticsData, SubscriptionStatus } from '@/lib/dashboard-types';
import Link from 'next/link';

const boardTips = [
  {
    id: '1',
    title: 'Paste messy notes',
    description: 'Just paste your unorganized notes and let AI extract tasks automatically with priorities and due dates.',
    category: 'Quick Start',
  },
  {
    id: '2',
    title: 'Drag and drop',
    description: 'Move tasks between columns (To Do, In Progress, Done) by dragging them.',
    category: 'Feature',
  },
  {
    id: '3',
    title: 'Set priorities',
    description: 'Mark tasks as Low, Medium, High, or Urgent to stay focused on what matters.',
    category: 'Best Practice',
  },
  {
    id: '4',
    title: 'Add due dates',
    description: 'Set deadlines to keep track of time-sensitive tasks.',
    category: 'Feature',
  },
  {
    id: '5',
    title: 'Export your board',
    description: 'Download your tasks as JSON to backup or share with your team.',
    category: 'Tip',
  },
  {
    id: '6',
    title: 'Search and filter',
    description: 'Use the search bar to quickly find tasks or filter by priority level.',
    category: 'Feature',
  },
  {
    id: '7',
    title: 'Clear completed',
    description: 'Bulk delete all completed tasks to keep your board clean and focused.',
    category: 'Tip',
  },
  {
    id: '8',
    title: 'Track progress',
    description: 'View completion percentage and see how many tasks you\'ve finished.',
    category: 'Feature',
  },
];

export default function DashboardOverview() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % boardTips.length);
    }, 5000);
    return () => clearInterval(interval);
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

      setRecentActivity([]);
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
    return (
      <div className="fixed inset-0 bg-[#141414] z-50 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-2 border-2 border-transparent border-t-primary/60 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.6s' }} />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-primary">Loading Dashboard</p>
            <p className="text-sm text-muted-foreground">Just a moment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

      {/* Board Tips Carousel - Full Width */}
      <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414]">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                Board Tips & Best Practices
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">Master your workflow with these helpful tips</CardDescription>
            </div>
            <Badge variant="outline" className="text-xs w-fit">
              Tip {currentTipIndex + 1} of {boardTips.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {boardTips[currentTipIndex] && (
            <motion.div
              key={currentTipIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <div className="grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-6">
                <div className="flex items-center justify-center sm:justify-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#2a2a2a] to-[#1f1f1f] flex items-center justify-center border border-[#262626]">
                    <span className="text-3xl sm:text-4xl">💡</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <Badge variant="secondary" className="text-[10px] sm:text-xs">
                    {boardTips[currentTipIndex].category}
                  </Badge>
                  <h3 className="font-bold text-lg sm:text-xl">{boardTips[currentTipIndex].title}</h3>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{boardTips[currentTipIndex].description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <div className="flex gap-1.5 flex-1">
                  {boardTips.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTipIndex(index)}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        index === currentTipIndex ? 'bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                      aria-label={`Go to tip ${index + 1}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentTipIndex((prev) => (prev - 1 + boardTips.length) % boardTips.length)}
                    className="h-8 w-8 p-0"
                  >
                    ←
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentTipIndex((prev) => (prev + 1) % boardTips.length)}
                    className="h-8 w-8 p-0"
                  >
                    →
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Link href="/dashboard/board">
            <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414] hover:border-[#3a3a3a] transition-all cursor-pointer h-full">
              <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center space-y-3">
                <div className="text-3xl sm:text-4xl">📋</div>
                <h3 className="font-semibold text-sm sm:text-base">Open Kanban Board</h3>
                <p className="text-xs sm:text-sm text-gray-400">Create and manage tasks</p>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/saved">
            <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414] hover:border-[#3a3a3a] transition-all cursor-pointer h-full">
              <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center space-y-3">
                <div className="text-3xl sm:text-4xl">💾</div>
                <h3 className="font-semibold text-sm sm:text-base">View Saved Boards</h3>
                <p className="text-xs sm:text-sm text-gray-400">Access your saved work</p>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </CardContent>
            </Card>
          </Link>
          {subscription?.plan === 'free' ? (
            <Link href="/pricing">
              <Card className="border-[#262626] bg-gradient-to-br from-primary/10 to-primary/5 hover:border-primary/50 transition-all cursor-pointer h-full">
                <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center space-y-3">
                  <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                  <h3 className="font-semibold text-sm sm:text-base">Upgrade to Premium</h3>
                  <p className="text-xs sm:text-sm text-gray-400">Unlock unlimited features</p>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Link href="/dashboard/settings">
              <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414] hover:border-[#3a3a3a] transition-all cursor-pointer h-full">
                <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center space-y-3">
                  <div className="text-3xl sm:text-4xl">⚙️</div>
                  <h3 className="font-semibold text-sm sm:text-base">Settings</h3>
                  <p className="text-xs sm:text-sm text-gray-400">Manage your account</p>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414]">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your last 5 generations</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No recent activity</p>
              <Link href="/dashboard/board">
                <Button variant="outline" className="mt-4">
                  Open Board
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 border border-gray-800 rounded-lg hover:bg-gray-900/30 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{activity.title || 'Untitled'}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">{title}</CardTitle>
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="text-xl sm:text-2xl font-bold">{value}</div>
          {badge && (
            <Badge
              variant={badge === 'premium' ? 'default' : 'outline'}
              className={`text-[10px] sm:text-xs ${badge === 'premium' ? 'bg-gradient-to-r from-gray-700 to-gray-800 border-0' : ''}`}
            >
              {badge}
            </Badge>
          )}
        </div>
        {description && <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{description}</p>}
        {progress !== undefined && (
          <div className="mt-2 sm:mt-3">
            <div className="h-1 sm:h-1.5 bg-gray-800 rounded-full overflow-hidden">
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
