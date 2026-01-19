export type SubscriptionPlan = 'free' | 'premium';

export type SubscriptionStatus = {
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd?: string;
};

export type UsageStats = {
  totalGenerations: number;
  todayCount: number; // AI usage today (for backward compatibility)
  todayLimit: number; // AI daily limit (for backward compatibility)
  monthCount: number; // AI usage this month (for backward compatibility)
  monthLimit: number; // AI monthly limit (for backward compatibility)
  boardsUsedToday: number;
  boardsUsedMonth: number;
  boardsTodayLimit: number;
  boardsMonthLimit: number;
  aiUsedToday: number;
  aiUsedMonth: number;
  aiTodayLimit: number;
  aiMonthLimit: number;
  plan?: 'free' | 'premium';
};

export type Generation = {
  id: string;
  user_id: string;
  input_text: string;
  output_text: string;
  tone?: string;
  length?: string;
  format?: string;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
  title?: string;
};

export type AnalyticsData = {
  date: string;
  count: number;
}[];

export type AITip = {
  id: string;
  title: string;
  description: string;
  category: string;
};

export type Feedback = {
  id?: string;
  user_id?: string;
  type: 'feature' | 'bug' | 'improvement' | 'other';
  message: string;
  created_at?: string;
};
