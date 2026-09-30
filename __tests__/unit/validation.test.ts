import { describe, it, expect } from 'vitest'
import {
  analyzeWorkloadSchema,
  trackCompletionSchema,
  chatSchema,
  feedbackSchema,
} from '@/lib/validation/schemas'

describe('Validation Schemas', () => {


  describe('analyzeWorkloadSchema', () => {
    const validTask = {
      id: '1',
      title: 'Task 1',
      status: 'To Do' as const,
      priority: 'High' as const,
      createdAt: new Date().toISOString(),
    }

    it('should validate with required fields only', () => {
      const data = { tasks: [validTask] }
      expect(() => analyzeWorkloadSchema.parse(data)).not.toThrow()
    })

    it('should validate with userCapacity', () => {
      const data = { tasks: [validTask], userCapacity: 8 }
      expect(() => analyzeWorkloadSchema.parse(data)).not.toThrow()
    })

    it('should reject userCapacity below minimum', () => {
      const data = { tasks: [validTask], userCapacity: 0 }
      expect(() => analyzeWorkloadSchema.parse(data)).toThrow()
    })

    it('should reject userCapacity above maximum', () => {
      const data = { tasks: [validTask], userCapacity: 25 }
      expect(() => analyzeWorkloadSchema.parse(data)).toThrow()
    })

    it('should reject invalid task status', () => {
      const data = {
        tasks: [{ ...validTask, status: 'Invalid' }],
      }
      expect(() => analyzeWorkloadSchema.parse(data)).toThrow()
    })

    it('should reject invalid priority', () => {
      const data = {
        tasks: [{ ...validTask, priority: 'Critical' }],
      }
      expect(() => analyzeWorkloadSchema.parse(data)).toThrow()
    })

    it('should accept empty tasks array', () => {
      const data = { tasks: [] }
      expect(() => analyzeWorkloadSchema.parse(data)).not.toThrow()
    })
  })


  describe('trackCompletionSchema', () => {
    it('should validate with all required fields', () => {
      const data = {
        taskId: '123',
        taskTitle: 'Complete task',
        taskPriority: 'High' as const,
        timeSpentMinutes: 30,
      }
      expect(() => trackCompletionSchema.parse(data)).not.toThrow()
    })

    it('should reject negative time spent', () => {
      const data = {
        taskId: '123',
        taskTitle: 'Complete task',
        taskPriority: 'High' as const,
        timeSpentMinutes: -5,
      }
      expect(() => trackCompletionSchema.parse(data)).toThrow()
    })

    it('should accept zero time spent', () => {
      const data = {
        taskId: '123',
        taskTitle: 'Complete task',
        taskPriority: 'High' as const,
        timeSpentMinutes: 0,
      }
      expect(() => trackCompletionSchema.parse(data)).not.toThrow()
    })
  })

  describe('chatSchema', () => {
    it('should validate with message only', () => {
      const data = { message: 'Hello AI' }
      expect(() => chatSchema.parse(data)).not.toThrow()
    })

    it('should reject empty message', () => {
      const data = { message: '' }
      expect(() => chatSchema.parse(data)).toThrow()
    })

    it('should reject message exceeding max length', () => {
      const data = { message: 'a'.repeat(2001) }
      expect(() => chatSchema.parse(data)).toThrow()
    })

    it('should validate with tasks', () => {
      const data = { message: 'Help me prioritize', tasks: [{ id: '1', title: 'Task' }] }
      expect(() => chatSchema.parse(data)).not.toThrow()
    })
  })

  describe('feedbackSchema', () => {
    it('should validate bug feedback', () => {
      const data = { type: 'bug' as const, message: 'Found a bug' }
      expect(() => feedbackSchema.parse(data)).not.toThrow()
    })

    it('should validate with email', () => {
      const data = {
        type: 'feature' as const,
        message: 'Add dark mode',
        email: 'user@example.com',
      }
      expect(() => feedbackSchema.parse(data)).not.toThrow()
    })

    it('should reject invalid email', () => {
      const data = {
        type: 'general' as const,
        message: 'Feedback',
        email: 'invalid-email',
      }
      expect(() => feedbackSchema.parse(data)).toThrow()
    })

    it('should reject invalid feedback type', () => {
      const data = { type: 'spam', message: 'Spam' }
      expect(() => feedbackSchema.parse(data)).toThrow()
    })
  })


})
