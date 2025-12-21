// Privacy-focused analytics - no personal data, no tracking
// Only tracks anonymous usage patterns to improve the tool

interface AnalyticsEvent {
  event: string;
  timestamp: string;
  sessionId: string;
}

class PrivacyAnalytics {
  private sessionId: string;
  private enabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.enabled = this.checkIfEnabled();
  }

  private generateSessionId(): string {
    // Generate random session ID (not tied to user)
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private checkIfEnabled(): boolean {
    // Check if user has opted out
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('kanbi-analytics-opt-out') !== 'true';
  }

  track(eventName: string, properties?: Record<string, any>) {
    if (!this.enabled) return;

    try {
      const event: AnalyticsEvent = {
        event: eventName,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        ...properties
      };

      // Store locally for now (can be sent to privacy-focused analytics later)
      const events = this.getStoredEvents();
      events.push(event);
      
      // Keep only last 100 events
      const recentEvents = events.slice(-100);
      localStorage.setItem('kanbi-analytics', JSON.stringify(recentEvents));
    } catch (error) {
      // Silently fail if localStorage is full
      console.error('Analytics error:', error);
    }
  }

  private getStoredEvents(): AnalyticsEvent[] {
    try {
      const stored = localStorage.getItem('kanbi-analytics');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Track common events
  trackTaskCreated(count: number) {
    this.track('tasks_created', { count });
  }

  trackTaskCompleted() {
    this.track('task_completed');
  }

  trackExport() {
    this.track('data_exported');
  }

  trackImport() {
    this.track('data_imported');
  }

  trackOnboardingCompleted() {
    this.track('onboarding_completed');
  }

  trackError(errorMessage: string) {
    this.track('error_occurred', { 
      error: errorMessage.substring(0, 100) // Limit error message length
    });
  }

  // Get usage statistics (for user's own insight)
  getUsageStats() {
    const events = this.getStoredEvents();
    return {
      totalEvents: events.length,
      tasksCreated: events.filter(e => e.event === 'tasks_created').length,
      tasksCompleted: events.filter(e => e.event === 'task_completed').length,
      exportsCount: events.filter(e => e.event === 'data_exported').length,
    };
  }

  // Allow users to opt out
  optOut() {
    localStorage.setItem('kanbi-analytics-opt-out', 'true');
    localStorage.removeItem('kanbi-analytics');
    this.enabled = false;
  }

  optIn() {
    localStorage.removeItem('kanbi-analytics-opt-out');
    this.enabled = true;
  }
}

// Export singleton instance
export const analytics = new PrivacyAnalytics();