import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChatAssistant, ChatMessage, ChatContext } from '@/lib/ai/chat-assistant';
import { chatSchema } from '@/lib/validation/schemas';
import { ValidationError, AuthError, ExternalServiceError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logging/logger';
import { rateLimit, rateLimitResponse, addRateLimitHeaders } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const limitResult = await rateLimit(request, { maxRequests: 30, windowMs: 60000 });
  if (!limitResult.success) return rateLimitResponse(limitResult.limit, limitResult.remaining, limitResult.reset);

  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new AuthError();
    }

    logger.info('Chat request', { userId: user.id, requestId });

    const body = await request.json();
    const { message, tasks, quickAction, workloadHealth, estimatedHours } = body;

    if (!message && !quickAction) {
      throw new ValidationError('Message or quick action required');
    }

    if (message) {
      chatSchema.parse({ message, tasks });
    }

    const context: ChatContext = {
      tasks: tasks || [],
      workloadHealth,
      estimatedHours,
    };

    const chatHistory = await getChatHistory(supabase, user.id);

    let aiResponse: string;

    if (quickAction) {
      aiResponse = await ChatAssistant.handleQuickAction(quickAction, context);
    } else {
      aiResponse = await ChatAssistant.generateResponse(message, context, chatHistory);
    }

    if (message) {
      await saveMessage(supabase, user.id, 'user', message, tasks);
    }

    await saveMessage(supabase, user.id, 'assistant', aiResponse, tasks);

    logger.info('Chat success', { userId: user.id, requestId });

    const response = NextResponse.json({ 
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });
    return addRateLimitHeaders(response, limitResult.limit, limitResult.remaining, limitResult.reset);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const validationError = new ValidationError(error.errors?.[0]?.message || 'Invalid request data');
      logger.error('Validation error', { requestId, errorId: validationError.errorId });
      return NextResponse.json(validationError.toJSON(), { status: validationError.statusCode });
    }

    if (error instanceof AuthError || error instanceof ValidationError) {
      logger.warn(error.message, { requestId, errorId: error.errorId });
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }

    logger.error('Chat error', { requestId, error: error.message });
    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        errorId: requestId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new AuthError();
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      logger.error('Error fetching chat history', { userId: user.id, requestId, error: error.message });
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ 
      messages: messages.map(msg => ({
        role: msg.role,
        message: msg.message,
        timestamp: msg.created_at,
      }))
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }

    logger.error('Get chat history error', { requestId, error: error.message });
    return NextResponse.json({ messages: [] });
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new AuthError();
    }

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      logger.error('Error deleting chat history', { userId: user.id, requestId, error: error.message });
      return NextResponse.json(
        {
          error: 'Failed to clear chat',
          code: 'DATABASE_ERROR',
          statusCode: 500,
          errorId: requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json(error.toJSON(), { status: error.statusCode });
    }

    logger.error('Delete chat error', { requestId, error: error.message });
    return NextResponse.json(
      {
        error: 'Failed to clear chat',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        errorId: requestId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function getChatHistory(supabase: any, userId: string): Promise<ChatMessage[]> {
  try {
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, message, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!messages) return [];

    return messages.reverse().map((msg: any) => ({
      role: msg.role,
      message: msg.message,
      timestamp: new Date(msg.created_at),
    }));
  } catch (error) {
    logger.error('Error fetching chat history', { userId, error });
    return [];
  }
}

async function saveMessage(
  supabase: any,
  userId: string,
  role: 'user' | 'assistant',
  message: string,
  tasks: any[]
) {
  try {
    await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        role,
        message,
        task_context: { task_count: tasks?.length || 0 },
      });
  } catch (error) {
    logger.error('Error saving message', { userId, error });
  }
}
