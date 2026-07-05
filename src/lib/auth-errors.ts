const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Incorrect email or password. Please try again.',
  'Email not confirmed': 'Please verify your email address before signing in. Check your inbox.',
  'User already registered': 'An account with this email already exists. Try signing in instead.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
  'Invalid email': 'Please enter a valid email address.',
  'Email link is invalid or has expired': 'The reset link has expired or is invalid. Please request a new one.',
  'Email rate limit exceeded': 'Too many requests. Please wait a moment before trying again.',
  'Signup requires a valid password': 'Password is required. Please enter one.',
  'Unable to validate email address: invalid format': 'Please enter a valid email address.',
  'Auth session missing': 'Your session has expired. Please sign in again.',
  'refresh_token_not_found': 'Your session has expired. Please sign in again.',
  'session_expired': 'Your session has expired. Please sign in again.',
};

export function friendlyAuthError(error: { message?: string; code?: string } | string | null): string {
  if (!error) return '';

  const message = typeof error === 'string' ? error : error.message || error.code || '';
  if (!message) return 'An unexpected error occurred. Please try again.';

  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Unable to connect. Please check your internet connection.';
  }

  const code = typeof error === 'string' ? '' : error.code || '';
  return ERROR_MAP[message] || ERROR_MAP[code] || message;
}
