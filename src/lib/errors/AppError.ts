export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string,
    public errorId: string = crypto.randomUUID()
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      errorId: this.errorId,
      timestamp: new Date().toISOString(),
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, errorId?: string) {
    super(message, 400, 'VALIDATION_ERROR', errorId);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication required', errorId?: string) {
    super(message, 401, 'AUTH_ERROR', errorId);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', errorId?: string) {
    super(message, 429, 'RATE_LIMIT_ERROR', errorId);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, errorId?: string) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', errorId);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', errorId?: string) {
    super(message, 500, 'DATABASE_ERROR', errorId);
  }
}
