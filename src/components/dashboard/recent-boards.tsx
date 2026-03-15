'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Star } from 'lucide-react';
import Link from 'next/link';

export default function RecentBoards() {
  const [boards, setBoards] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/saved?limit=5')
      .then(res => res.json())
      .then(data => {
        // API returns array directly, not wrapped in boards property
        setBoards(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error('Failed to fetch recent boards:', error);
        setBoards([]);
      });
  }, []);

  return (
    <Card className="border-[#262626] bg-gradient-to-br from-[#1a1a1a] to-[#141414]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Recent Boards
        </CardTitle>
      </CardHeader>
      <CardContent>
        {boards.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent boards</p>
        ) : (
          <div className="space-y-2">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/dashboard/board?load=${board.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-[#262626] hover:border-primary/50 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{board.title || board.content?.substring(0, 30) || 'Untitled'}</p>
                  <p className="text-xs text-muted-foreground">
                    {board.created_at ? new Date(board.created_at).toLocaleDateString() : 'No date'}
                  </p>
                </div>
                {board.is_favorite && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
