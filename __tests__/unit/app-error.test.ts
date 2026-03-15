import {
  AppError,
  ValidationError,
  AuthError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
} from '@/lib/errors/AppError'

describe('AppError Classes', () => {
  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR')

      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('TEST_ERROR')
      expect(error.name).toBe('AppError')
    })

    it('should generate unique errorId', () => {
      const error1 = new AppError('Error 1', 400, 'TEST')
      const error2 = new AppError('Error 2', 400, 'TEST')

      expect(error1.errorId).not.toBe(error2.errorId)
    })

    it('should accept custom errorId', () => {
      const customId = 'custom-error-id'
      const error = new AppError('Test', 400, 'TEST', customId)

      expect(error.errorId).toBe(customId)
    })

    it('should serialize to JSON', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR', 'error-123')
      const json = error.toJSON()

      expect(json.error).toBe('Test error')
      expect(json.code).toBe('TEST_ERROR')
      expect(json.statusCode).toBe(400)
      expect(json.errorId).toBe('error-123')
      expect(json.timestamp).toBeDefined()
    })

    it('should capture stack trace', () => {
      const error = new AppError('Test', 400, 'TEST')

      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('AppError')
    })
  })

  describe('ValidationError', () => {
    it('should have correct status code', () => {
      const error = new ValidationError('Invalid input')

      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
    })

    it('should use provided message', () => {
      const message = 'Email is required'
      const error = new ValidationError(message)

      expect(error.message).toBe(message)
    })

    it('should accept custom errorId', () => {
      const error = new ValidationError('Invalid', 'val-123')

      expect(error.errorId).toBe('val-123')
    })

    it('should be instanceof AppError', () => {
      const error = new ValidationError('Test')

      expect(error instanceof AppError).toBe(true)
    })
  })

  describe('AuthError', () => {
    it('should have correct status code', () => {
      const error = new AuthError()

      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('AUTH_ERROR')
    })

    it('should have default message', () => {
      const error = new AuthError()

      expect(error.message).toBe('Authentication required')
    })

    it('should accept custom message', () => {
      const error = new AuthError('Invalid credentials')

      expect(error.message).toBe('Invalid credentials')
    })

    it('should accept custom errorId', () => {
      const error = new AuthError('Test', 'auth-123')

      expect(error.errorId).toBe('auth-123')
    })
  })

  describe('RateLimitError', () => {
    it('should have correct status code', () => {
      const error = new RateLimitError()

      expect(error.statusCode).toBe(429)
      expect(error.code).toBe('RATE_LIMIT_ERROR')
    })

    it('should have default message', () => {
      const error = new RateLimitError()

      expect(error.message).toBe('Rate limit exceeded')
    })

    it('should accept custom message', () => {
      const error = new RateLimitError('API limit reached')

      expect(error.message).toBe('API limit reached')
    })

    it('should accept custom errorId', () => {
      const error = new RateLimitError('Test', 'rate-123')

      expect(error.errorId).toBe('rate-123')
    })
  })

  describe('ExternalServiceError', () => {
    it('should have correct status code', () => {
      const error = new ExternalServiceError('Service unavailable')

      expect(error.statusCode).toBe(502)
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR')
    })

    it('should require message', () => {
      const error = new ExternalServiceError('AI service down')

      expect(error.message).toBe('AI service down')
    })

    it('should accept custom errorId', () => {
      const error = new ExternalServiceError('Test', 'ext-123')

      expect(error.errorId).toBe('ext-123')
    })
  })

  describe('DatabaseError', () => {
    it('should have correct status code', () => {
      const error = new DatabaseError()

      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('DATABASE_ERROR')
    })

    it('should have default message', () => {
      const error = new DatabaseError()

      expect(error.message).toBe('Database operation failed')
    })

    it('should accept custom message', () => {
      const error = new DatabaseError('Connection timeout')

      expect(error.message).toBe('Connection timeout')
    })

    it('should accept custom errorId', () => {
      const error = new DatabaseError('Test', 'db-123')

      expect(error.errorId).toBe('db-123')
    })
  })

  describe('Error inheritance', () => {
    it('all errors should extend AppError', () => {
      const errors = [
        new ValidationError('Test'),
        new AuthError('Test'),
        new RateLimitError('Test'),
        new ExternalServiceError('Test'),
        new DatabaseError('Test'),
      ]

      errors.forEach(error => {
        expect(error instanceof AppError).toBe(true)
        expect(error instanceof Error).toBe(true)
      })
    })

    it('should have proper error names', () => {
      expect(new ValidationError('Test').name).toBe('ValidationError')
      expect(new AuthError('Test').name).toBe('AuthError')
      expect(new RateLimitError('Test').name).toBe('RateLimitError')
      expect(new ExternalServiceError('Test').name).toBe('ExternalServiceError')
      expect(new DatabaseError('Test').name).toBe('DatabaseError')
    })
  })

  describe('JSON serialization', () => {
    it('should include all required fields', () => {
      const error = new ValidationError('Test error', 'test-123')
      const json = error.toJSON()

      expect(json).toHaveProperty('error')
      expect(json).toHaveProperty('code')
      expect(json).toHaveProperty('statusCode')
      expect(json).toHaveProperty('errorId')
      expect(json).toHaveProperty('timestamp')
    })

    it('should have valid timestamp format', () => {
      const error = new AppError('Test', 400, 'TEST')
      const json = error.toJSON()

      expect(() => new Date(json.timestamp)).not.toThrow()
    })

    it('should preserve error details in JSON', () => {
      const error = new RateLimitError('Custom limit message', 'limit-456')
      const json = error.toJSON()

      expect(json.error).toBe('Custom limit message')
      expect(json.code).toBe('RATE_LIMIT_ERROR')
      expect(json.statusCode).toBe(429)
      expect(json.errorId).toBe('limit-456')
    })
  })

  describe('error handling patterns', () => {
    it('should work with try-catch', () => {
      const throwError = () => {
        throw new ValidationError('Invalid data')
      }

      expect(() => throwError()).toThrow(ValidationError)
    })

    it('should work with instanceof checks', () => {
      const error = new AuthError('Not authenticated')

      if (error instanceof AuthError) {
        expect(error.statusCode).toBe(401)
      } else {
        fail('Should be AuthError')
      }
    })

    it('should work with error code checks', () => {
      const error = new RateLimitError()

      if (error.code === 'RATE_LIMIT_ERROR') {
        expect(error.statusCode).toBe(429)
      } else {
        fail('Should have RATE_LIMIT_ERROR code')
      }
    })
  })
})
