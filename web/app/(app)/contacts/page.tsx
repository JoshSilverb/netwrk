'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { ContactCard } from '@/components/contacts/ContactCard';
import { ContactSheet } from '@/components/contacts/ContactSheet';
import { AddContactSheet } from '@/components/contacts/AddContactSheet';
import { ImportSheet } from '@/components/contacts/ImportSheet';
import { useContacts, useTags } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Contact } from '@/types';
import { Search, Upload, X, ChevronDown } from 'lucide-react';
import { Popover } from '@base-ui/react/popover';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'DATE_ADDED',          label: 'Date added' },
  { value: 'LAST_CONTACT_NEWEST', label: 'Last contact (newest)' },
  { value: 'LAST_CONTACT_OLDEST', label: 'Last contact (oldest)' },
  { value: 'ALPHABETICAL',        label: 'Alphabetical' },
  { value: 'NEXT_CONTACT_DATE',   label: 'Next contact date' },
  { value: 'RELEVANCE',           label: 'Relevance' },
];

function ContactsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const sort = searchParams.get('sort') ?? 'DATE_ADDED';

  const [searchInput, setSearchInput] = useState(q);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [importSheetOpen, setImportSheetOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [afterDate, setAfterDate] = useState('');
  const [beforeDate, setBeforeDate] = useState('');
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [tagPopoverSearch, setTagPopoverSearch] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchParamsRef = useRef(searchParams);
  useEffect(() => { searchParamsRef.current = searchParams; }, [searchParams]);
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const searchMode: 'Name' | 'Semantic' =
    sort === 'RELEVANCE' || searchInput.trim().split(/\s+/).filter(Boolean).length > 2
      ? 'Semantic'
      : 'Name';

  const effectiveSort = searchMode === 'Semantic' ? 'RELEVANCE' : sort;

  const { data: contacts, isLoading } = useContacts({
    q: searchMode === 'Semantic' ? (q || undefined) : undefined,
    sort: effectiveSort,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    afterDate: afterDate || undefined,
    beforeDate: beforeDate || undefined,
  });

  const displayedContacts =
    searchMode === 'Name' && searchInput.trim()
      ? (contacts ?? []).filter((c) =>
          c.fullname.toLowerCase().includes(searchInput.toLowerCase())
        )
      : (contacts ?? []);

  const { data: allTags } = useTags();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/contacts?${params.toString()}`);
  }

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      if (value) { params.set('q', value); } else { params.delete('q'); }
      router.replace(`/contacts?${params.toString()}`);
    }, 350);
  }, [router]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function openContact(contact: Contact) {
    setSelectedContact(contact);
    setSheetOpen(true);
  }

  return (
    <AppShell>
      <div className="flex h-full">
        {/* Filter sidebar */}
        <aside className="w-60 flex-shrink-0 border-r border-slate-200 bg-slate-100 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Sort by */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sort by</p>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateParam('sort', opt.value)}
                  className={cn(
                    'w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors',
                    sort === opt.value
                      ? 'bg-slate-800 text-white font-medium'
                      : 'text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Last contacted */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Last contacted</p>
              <div className="space-y-1.5">
                <p className="text-xs text-slate-500">After</p>
                <Input
                  type="date"
                  value={afterDate}
                  onChange={(e) => setAfterDate(e.target.value)}
                  className="bg-white text-xs h-8"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-slate-500">Before</p>
                <Input
                  type="date"
                  value={beforeDate}
                  onChange={(e) => setBeforeDate(e.target.value)}
                  className="bg-white text-xs h-8"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search + result count + add button */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 bg-white">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                ref={searchInputRef}
                placeholder="Search contacts"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className={cn(
                  'pl-9 bg-slate-50 border-slate-200',
                  searchInput.length > 0 ? 'pr-20' : 'pr-14'
                )}
              />
              {searchInput.length === 0 && (
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs text-slate-400 bg-slate-100 border border-slate-200 rounded font-mono pointer-events-none">
                  ⌘K
                </kbd>
              )}
              {searchInput.length > 0 && (
                <span className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-xs font-medium pointer-events-none',
                  searchMode === 'Semantic' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                )}>
                  {searchMode}
                </span>
              )}
            </div>
            {!isLoading && contacts !== undefined && (
              <span className="text-sm text-slate-500 whitespace-nowrap flex-shrink-0">
                {displayedContacts.length} result{displayedContacts.length !== 1 ? 's' : ''}
              </span>
            )}
            <Button
              onClick={() => setImportSheetOpen(true)}
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex-shrink-0 font-medium text-sm"
              variant="outline"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload spreadsheet
            </Button>
            <Button
              onClick={() => setAddSheetOpen(true)}
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex-shrink-0 font-medium text-sm"
              variant="outline"
            >
              Add contact +
            </Button>
          </div>

          {/* Active filter chips row */}
          <div className="flex items-center gap-2 px-6 py-2 border-b border-slate-200 bg-white flex-wrap min-h-[44px]">
            <Popover.Root open={tagPopoverOpen} onOpenChange={(open) => {
              setTagPopoverOpen(open);
              if (!open) setTagPopoverSearch('');
            }}>
              <Popover.Trigger className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer',
                selectedTags.length > 0 || tagPopoverOpen
                  ? 'bg-teal-50 border-teal-400 text-teal-700'
                  : 'bg-white border-slate-300 text-slate-500 hover:border-teal-400 hover:text-teal-700'
              )}>
                + Tag <ChevronDown className="h-3 w-3" />
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner side="bottom" align="start" sideOffset={4}>
                  <Popover.Popup className="z-50 w-60 rounded-lg border border-slate-200 bg-white shadow-lg p-2 space-y-2 outline-none">
                    <input
                      autoFocus
                      placeholder="Search tags…"
                      value={tagPopoverSearch}
                      onChange={(e) => setTagPopoverSearch(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <div className="max-h-48 overflow-y-auto flex flex-wrap gap-1.5 py-1">
                      {(allTags ?? [])
                        .filter(t => t.toLowerCase().includes(tagPopoverSearch.toLowerCase()))
                        .map(tag => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                              selectedTags.includes(tag)
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400 hover:text-teal-700'
                            )}
                          >
                            {tag}
                          </button>
                        ))
                      }
                      {(allTags ?? []).filter(t =>
                        t.toLowerCase().includes(tagPopoverSearch.toLowerCase())
                      ).length === 0 && (
                        <p className="text-xs text-slate-400 py-1 px-1">No tags match</p>
                      )}
                    </div>
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>

            {selectedTags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 border border-teal-300 text-teal-700">
                {tag}
                <button onClick={() => toggleTag(tag)} className="hover:text-teal-900 transition-colors" aria-label={`Remove ${tag} filter`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {afterDate && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600">
                After {afterDate}
                <button onClick={() => setAfterDate('')} className="hover:text-slate-900" aria-label="Clear after date">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {beforeDate && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-600">
                Before {beforeDate}
                <button onClick={() => setBeforeDate('')} className="hover:text-slate-900" aria-label="Clear before date">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>

          {/* Contact list */}
          <div className="flex-1 overflow-auto bg-slate-50">
            {isLoading ? (
              <div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-200">
                    <div className="h-12 w-12 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-40 bg-slate-200 animate-pulse rounded" />
                      <div className="h-3 w-72 bg-slate-200 animate-pulse rounded" />
                    </div>
                    <div className="h-3 w-20 bg-slate-200 animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : displayedContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <p className="text-base">No contacts found</p>
                <p className="text-sm mt-1">Add your first contact to get started.</p>
              </div>
            ) : (
              <div>
                {displayedContacts.map((contact) => (
                  <ContactCard key={contact.contact_id} contact={contact} onClick={openContact} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ContactSheet contact={selectedContact} open={sheetOpen} onOpenChange={setSheetOpen} />
      <AddContactSheet open={addSheetOpen} onOpenChange={setAddSheetOpen} />
      <ImportSheet open={importSheetOpen} onOpenChange={setImportSheetOpen} contacts={contacts ?? []} />
    </AppShell>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<AppShell><div className="p-6 text-slate-400">Loading…</div></AppShell>}>
      <ContactsInner />
    </Suspense>
  );
}
