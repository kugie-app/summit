'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ForecastStream {
  id: number;
  name: string;
  type: 'revenue' | 'expense';
  order: number;
}

export interface ForecastItem {
  id: number;
  streamId: number;
  name: string;
  order: number;
}

interface StreamTreeProps {
  streams: ForecastStream[];
  items: ForecastItem[];
  selectedItemId?: number;
  onSelectItem: (itemId: number) => void;
  onAddStream?: () => void;
  onAddItem?: (streamId: number) => void;
  onDeleteStream?: (streamId: number) => void;
  onDeleteItem?: (itemId: number) => void;
}

export function StreamTree({
  streams,
  items,
  selectedItemId,
  onSelectItem,
  onAddStream,
  onAddItem,
  onDeleteStream,
  onDeleteItem,
}: StreamTreeProps) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  function toggleCollapse(streamId: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(streamId)) next.delete(streamId);
      else next.add(streamId);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {streams
        .sort((a, b) => a.order - b.order)
        .map((stream) => {
          const streamItems = items.filter((i) => i.streamId === stream.id).sort((a, b) => a.order - b.order);
          const isCollapsed = collapsed.has(stream.id);

          return (
            <div key={stream.id} className="rounded-md border">
              {/* Stream header */}
              <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-t-md">
                <button
                  className="flex items-center gap-2 flex-1 text-left text-sm font-medium"
                  onClick={() => toggleCollapse(stream.id)}
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span>{stream.name}</span>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    stream.type === 'revenue'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  )}>
                    {stream.type}
                  </span>
                </button>
                <div className="flex gap-1">
                  {onAddItem && (
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onAddItem(stream.id)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                  {onDeleteStream && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive"
                      onClick={() => onDeleteStream(stream.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Items */}
              {!isCollapsed && (
                <div className="divide-y">
                  {streamItems.map((item) => (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        'flex items-center justify-between w-full px-6 py-2 text-sm text-left hover:bg-accent transition-colors cursor-pointer',
                        selectedItemId === item.id && 'bg-accent font-medium'
                      )}
                      onClick={() => onSelectItem(item.id)}
                      onKeyDown={(e) => e.key === 'Enter' && onSelectItem(item.id)}
                    >
                      <span>{item.name}</span>
                      {onDeleteItem && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 text-destructive opacity-0 group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {streamItems.length === 0 && (
                    <p className="px-6 py-2 text-xs text-muted-foreground">No items</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      {onAddStream && (
        <Button variant="outline" size="sm" className="w-full" onClick={onAddStream}>
          <Plus className="h-4 w-4 mr-2" /> Add Stream
        </Button>
      )}
    </div>
  );
}
