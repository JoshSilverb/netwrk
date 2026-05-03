'use client';
import { useState, useRef } from 'react';
import { useTags } from '@/hooks/useContacts';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface Props {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}

export function TagAutocomplete({ tags, onAdd, onRemove }: Props) {
  const [input, setInput] = useState('');
  const { data: allTags = [] } = useTags();
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = input.trim().length > 0
    ? allTags.filter(
        (t) =>
          t.toLowerCase().startsWith(input.toLowerCase()) &&
          !tags.includes(t)
      )
    : [];

  function handleAdd(value: string) {
    const trimmed = value.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    onAdd(trimmed);
    setInput('');
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-2">
      {/* Current tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                className="hover:text-teal-900 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleAdd(input); }
          }}
          placeholder="Add tag…"
          className={cn(
            'flex h-9 flex-1 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
            'placeholder:text-slate-400 transition-colors'
          )}
        />
        <button
          type="button"
          onClick={() => handleAdd(input)}
          className="px-3 h-9 rounded-md border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Add
        </button>
      </div>

      {/* Suggestion chips — appear as you type */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleAdd(s)}
              className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                'bg-white border border-teal-200 text-teal-600',
                'hover:bg-teal-50 hover:border-teal-400 hover:text-teal-700',
                'transition-colors animate-in fade-in-0 zoom-in-95 duration-100'
              )}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
