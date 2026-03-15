'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Trash2,
  Bot,
  User,
  Target,
  Calendar,
  Zap,
  Lightbulb,
  ArrowRight,
  X
} from 'lucide-react';
import { Task } from '@/lib/types';

interface Message {
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [currentTasks, setCurrentTasks] = useState<Task[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadChatHistory();
    loadTasks();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTasks = () => {
    const stored = localStorage.getItem('kanbi-tasks');
    if (stored) {
      try {
        const tasks = JSON.parse(stored);
        setCurrentTasks(tasks);
      } catch (e) {
        console.error('Failed to load tasks:', e);
      }
    }
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
          tasks: currentTasks,
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
      inputRef.current?.focus();
    }
  };

  const handleQuickAction = (action: string) => {
    sendMessage(undefined, action);
  };

  const clearChat = async () => {
    try {
      const response = await fetch('/api/ai/chat', { method: 'DELETE' });
      if (response.ok) {
        setMessages([]);
        setShowDeleteConfirm(false);
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

  const suggestedQuestions = [
    { icon: Target, text: "What should I work on first?", action: "What should I work on first?" },
    { icon: Calendar, text: "Help me plan my day", action: "Help me plan my day" },
    { icon: Zap, text: "I'm feeling overwhelmed", action: "I'm feeling overwhelmed" },
    { icon: Lightbulb, text: "Give me productivity tips", action: "Give me productivity tips" },
    { icon: Target, text: "Prioritize my tasks", action: "Prioritize my tasks" },
    { icon: Calendar, text: "Schedule my week", action: "Schedule my week" },
  ];

  if (loadingHistory) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#141414]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground text-sm">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#141414]">
      {/* Header */}
      <div className="bg-[#141414] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-end">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-start space-y-2 sm:space-y-3 pt-2 sm:pt-3">
              <div className="relative">
                <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
                  <Bot className="h-8 sm:h-10 w-8 sm:w-10 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/50">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              
              <div className="text-center space-y-1 sm:space-y-2">
                <h2 className="text-lg sm:text-2xl font-bold">How can I help you today?</h2>
                <p className="text-muted-foreground max-w-sm text-xs sm:text-sm">
                  I'm your AI productivity coach. Ask me anything about your tasks, workload, or productivity.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 w-full max-w-2xl">
                {suggestedQuestions.map((q, index) => (
                  <Card
                    key={index}
                    className="p-2 sm:p-3 cursor-pointer hover:bg-[#1a1a1a] transition-all border-[#262626] bg-[#0a0a0a] hover:border-primary/50 group"
                    onClick={() => sendMessage(q.action)}
                  >
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                        <q.icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs font-medium leading-tight">{q.text}</p>
                      </div>
                      <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                      <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'bg-[#1a1a1a] border border-[#262626]'
                    }`}
                  >
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    <p className="text-[8px] sm:text-[10px] mt-1 sm:mt-2 opacity-60">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center flex-shrink-0">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-2 sm:gap-3 justify-start animate-in fade-in duration-300">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                  <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
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
          )}
        </div>
      </div>

      <div className="bg-[#141414]">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={loading}
                className="pr-10 sm:pr-12 bg-[#1a1a1a] border-[#262626] focus:border-primary h-9 sm:h-10 text-xs sm:text-sm"
              />
              <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[8px] sm:text-xs text-muted-foreground">
                {input.length > 0 && `${input.length}/500`}
              </div>
            </div>
            <Button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              size="sm"
              className="h-9 sm:h-10 px-3 sm:px-4 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>
          <p className="text-[8px] sm:text-[10px] text-muted-foreground mt-1.5 sm:mt-2 text-center">
            AI can make mistakes. Always verify important information.
          </p>
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm bg-[#1a1a1a] border-[#262626] shadow-2xl">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">Clear chat history?</h3>
                  <p className="text-sm text-muted-foreground">This action cannot be undone. All messages will be permanently deleted.</p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 border-[#262626] hover:bg-[#0a0a0a]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={clearChat}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
