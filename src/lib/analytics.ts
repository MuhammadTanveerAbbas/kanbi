// Minimal dev-only event tracking — no external data collection
class Analytics {
  track(eventName: string, properties?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${eventName}`, properties);
    }
  }

  trackTaskCreated(count: number) {
    this.track('tasks_created', { count });
  }

  trackTaskCompleted() {
    this.track('task_completed');
  }

  trackError(errorMessage: string) {
    console.error('[Error]', errorMessage);
  }
}

export const analytics = new Analytics();
