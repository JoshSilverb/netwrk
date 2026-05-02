'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { ContactCard } from '@/components/contacts/ContactCard';
import { ContactSheet } from '@/components/contacts/ContactSheet';
import { AddContactSheet } from '@/components/contacts/AddContactSheet';
import { useContacts, useTags } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Contact } from '@/types';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'DATE_ADDED', label: 'Date added' },
  { value: 'LAST_CONTACT_NEWEST', label: 'Last contact (newest)' },
  { value: 'LAST_CONTACT_OLDEST', label: 'Last contact (oldest)' },
  { value: 'ALPHABETICAL', label: 'Alphabetical' },
  { value: 'NEXT_CONTACT_DATE', label: 'Next contact date' },
  { value: 'RELEVANCE', label: 'Relevance' },
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [afterDate, setAfterDate] = useState('');
  const [beforeDate, setBeforeDate] = useState('');

  const { data: contacts, isLoading } = useContacts({
    q: q || undefined,
    sort,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    afterDate: afterDate || undefined,
    beforeDate: beforeDate || undefined,
  });

  const { data: allTags } = useTags();
  const filteredTags = (allTags ?? []).filter((t) =>
    t.toLowerCase().includes(tagSearch.toLowerCase())
  );

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/contacts?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam('q', searchInput);
  }

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
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Sort by</p>
              <Select value={sort} onValueChange={(v) => updateParam('sort', v ?? '')}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue>
                    {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Tags</p>
              <Input
                placeholder="Search tags…"
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="bg-white text-xs h-8"
              />
              {filteredTags.length > 0 && (
                <div className="max-h-48 overflow-y-auto flex flex-wrap gap-1.5 py-1">
                  {filteredTags.map((tag) => (
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
                  ))}
                </div>
              )}
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
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search contacts"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200"
              />
            </form>
            {!isLoading && contacts !== undefined && (
              <span className="text-sm text-slate-500 whitespace-nowrap flex-shrink-0">
                {contacts.length} result{contacts.length !== 1 ? 's' : ''}
              </span>
            )}
            <Button
              onClick={() => setAddSheetOpen(true)}
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex-shrink-0 font-medium text-sm"
              variant="outline"
            >
              Add contact +
            </Button>
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
            ) : contacts?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <p className="text-base">No contacts found</p>
                <p className="text-sm mt-1">Add your first contact to get started.</p>
              </div>
            ) : (
              <div>
                {contacts?.map((contact) => (
                  <ContactCard key={contact.contact_id} contact={contact} onClick={openContact} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ContactSheet contact={selectedContact} open={sheetOpen} onOpenChange={setSheetOpen} />
      <AddContactSheet open={addSheetOpen} onOpenChange={setAddSheetOpen} />
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
