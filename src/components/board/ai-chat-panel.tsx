'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, Loader2, Trash2, MessageSquare, Bot, User } from 'lucide-react';
import { Task } from '@/lib/types';

interface Message {
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

interface AIChatPanelProps {
  tasks: Task[];
  workloadHealth?: number;
  estimatedHours?: number;
}

export default function AIChatPanel({ tasks, workloadHealth, estimatedHours }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch('/api/ai/chat');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const sendMessage = async (messageText?: string, quickAction?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend && !quickAction) return;

    setLoading(true);

    if (textToSend && !quickAction) {
      const userMessage: Message = {
        role: 'user',
        message: textToSend,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          quickAction,
          tasks,
          workloadHealth,
          estimatedHours,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = {
          role: 'assistant',
          message: data.response,
          timestamp: data.timestamp,
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        message: "Sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    sendMessage(undefined, action);
  };

  const clearChat = async () => {
    if (!confirm('Clear all chat history?')) return;

    try {
      const response = await fetch('/api/ai/chat', { method: 'DELETE' });
      if (response.ok) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loadingHistory) {
    return (
      <Card className="border-[#262626] bg-[#141414] h-full">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-[#1a1a1a] rounded w-full"></div>
            <div className="h-3 bg-[#1a1a1a] rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#262626] bg-[#141414] flex flex-col h-full shadow-xl">
      <CardHeader className="pb-3 border-b border-[#262626]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">AI Assistant</CardTitle>
              <p className="text-[10px] text-muted-foreground">Productivity coach</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="h-7 w-7 p-0 hover:bg-red-500/10 hover:text-red-400"
              title="Clear chat"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 min-h-0 p-3">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('prioritize')}
            disabled={loading || tasks.length === 0}
            className="text-xs h-7 border-[#262626] hover:border-primary/50 hover:bg-[#1a1a1a] transition-all"
          >
            🎯 Prioritize
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('plan')}
            disabled={loading || tasks.length === 0}
            className="text-xs h-7 border-[#262626] hover:border-primary/50 hover:bg-[#1a1a1a] transition-all"
          >
            📅 Plan
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('defer')}
            disabled={loading || tasks.length === 0}
            className="text-xs h-7 border-[#262626] hover:border-primary/50 hover:bg-[#1a1a1a] transition-all"
          >
            ⚡ Defer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('motivate')}
            disabled={loading}
            className="text-xs h-7 border-[#262626] hover:border-primary/50 hover:bg-[#1a1a1a] transition-all"
          >
            💡 Motivate
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 min-h-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {messages.length === 0 ? (
            <div className="text-center py-6 flex flex-col items-center justify-center h-full">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <p className="text-xs font-medium text-foreground">
                Start a conversation
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Ask about your tasks
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-[#1a1a1a] border border-[#262626]'
                  }`}
                >
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  <p className="text-[9px] mt-1 opacity-50">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                <Bot className="h-3 w-3 text-white" />
              </div>
              <div className="bg-[#1a1a1a] border border-[#262626] rounded-lg px-3 py-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-2 border-t border-[#262626]">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything..."
            disabled={loading}
            className="text-xs h-8 bg-[#1a1a1a] border-[#262626] focus:border-primary"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            size="sm"
            className="h-8 px-2.5 bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
