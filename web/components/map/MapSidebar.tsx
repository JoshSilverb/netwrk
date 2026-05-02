'use client';

import { useState, useRef, useEffect } from 'react';
import { Contact } from '@/types';
import { User, Search, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationGroup {
  location: string;
  contacts: Contact[];
}

interface MapSidebarProps {
  groups: LocationGroup[];
  activeLocation: string | null;
  totalMapped: number;
  onContactClick: (contact: Contact) => void;
  onLocationClick: (location: string) => void;
  isLoading: boolean;
}

export function MapSidebar({
  groups,
  activeLocation,
  totalMapped,
  onContactClick,
  onLocationClick,
  isLoading,
}: MapSidebarProps) {
  const [query, setQuery] = useState('');
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeLocation && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeLocation]);

  const filtered = query.trim()
    ? groups
        .map((g) => ({
          ...g,
          contacts: g.contacts.filter(
            (c) =>
              c.fullname.toLowerCase().includes(query.toLowerCase()) ||
              c.location.toLowerCase().includes(query.toLowerCase())
          ),
        }))
        .filter((g) => g.contacts.length > 0)
    : groups;

  return (
    <aside className="w-80 flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">On the map</p>
        <p className="text-2xl font-bold text-white">{isLoading ? '—' : totalMapped}</p>
        <p className="text-xs text-slate-500 mt-0.5">{totalMapped === 1 ? 'contact' : 'contacts'} with locations</p>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-slate-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contacts…"
            className="w-full bg-slate-800 text-slate-200 placeholder:text-slate-500 text-sm pl-8 pr-3 py-2 rounded-md border border-slate-700 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-28 bg-slate-800 rounded animate-pulse" />
                {[0, 1].map((j) => (
                  <div key={j} className="flex gap-2 px-1">
                    <div className="h-8 w-8 rounded-full bg-slate-800 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-1">
                      <div className="h-2.5 w-24 bg-slate-800 rounded animate-pulse" />
                      <div className="h-2 w-16 bg-slate-800 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 px-6 text-center">
            <MapPin className="h-8 w-8 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400">
              {query ? 'No contacts match your search.' : 'None of your contacts have a location yet.'}
            </p>
          </div>
        ) : (
          filtered.map((group) => {
            const isActive = group.location === activeLocation;
            return (
              <div
                key={group.location}
                ref={isActive ? activeRef : undefined}
              >
                {/* Sticky group header */}
                <button
                  onClick={() => onLocationClick(group.location)}
                  className={cn(
                    'w-full flex items-center gap-2 px-4 py-2 text-left sticky top-0 z-10 transition-colors',
                    isActive
                      ? 'bg-teal-900/60 border-l-2 border-teal-400'
                      : 'bg-slate-900/95 border-l-2 border-transparent hover:bg-slate-800/60'
                  )}
                >
                  <MapPin className={cn('h-3 w-3 flex-shrink-0', isActive ? 'text-teal-400' : 'text-slate-500')} />
                  <span className={cn('text-xs font-semibold truncate', isActive ? 'text-teal-300' : 'text-slate-400')}>
                    {group.location}
                  </span>
                  <span className="ml-auto text-xs text-slate-600 flex-shrink-0">{group.contacts.length}</span>
                </button>

                {/* Contact rows */}
                {group.contacts.map((contact) => (
                  <button
                    key={contact.contact_id}
                    onClick={() => onContactClick(contact)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800/50 transition-colors text-left"
                  >
                    <div className="flex-shrink-0">
                      {contact.profile_pic_url ? (
                        <img
                          src={contact.profile_pic_url}
                          alt={contact.fullname}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{contact.fullname}</p>
                      {contact.lastcontact && (
                        <p className="text-xs text-slate-500 truncate">Last: {contact.lastcontact}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
