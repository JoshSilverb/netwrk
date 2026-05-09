'use client';
import { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting?: { main_text: string; secondary_text: string };
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function LocationAutocomplete({ value, onChange, placeholder = 'City, State', className }: Props) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync when parent resets the form
  useEffect(() => { setInputValue(value); }, [value]);

  // Fetch predictions from backend proxy on each keystroke
  useEffect(() => {
    if (inputValue.length < 2) { setSuggestions([]); return; }
    const controller = new AbortController();
    fetch(`https://api.mynetwrk.com/places/autocomplete?input=${encodeURIComponent(inputValue)}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'OK') setSuggestions(data.predictions ?? []);
        else setSuggestions([]);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [inputValue]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={cn(
            'flex h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-1 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
            'placeholder:text-slate-400 transition-colors',
            className
          )}
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          <ul>
            {suggestions.map((s) => (
              <li
                key={s.place_id}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent input blur before selection fires
                  setInputValue(s.description);
                  onChange(s.description);
                  setSuggestions([]);
                  setOpen(false);
                }}
                className="flex items-start gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-teal-50 hover:text-teal-700 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                <div>
                  <div className="font-medium">{s.structured_formatting?.main_text ?? s.description}</div>
                  {s.structured_formatting?.secondary_text && (
                    <div className="text-xs text-slate-500">{s.structured_formatting.secondary_text}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="px-3 py-1.5 text-[10px] text-slate-400 border-t border-slate-100">
            Powered by Google
          </div>
        </div>
      )}
    </div>
  );
}
