'use client';

import { useState, useEffect, useRef } from 'react';
import { useCreateContact } from '@/hooks/useContacts';
import { useUserSearch, useUserById } from '@/hooks/useUsers';
import { UserSearchResult, LinkedUserProfile } from '@/types';
import { FrequencyUnit } from '@/lib/reminder';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, X, User, MapPin, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';
import { TagAutocomplete } from '@/components/ui/tag-autocomplete';

const PLATFORM_OPTIONS = ['email', 'phone', 'instagram', 'linkedin', 'twitter', 'other'];

interface SocialEntry {
  label: string;
  address: string;
}

const emptyForm = () => ({
  fullname: '',
  location: '',
  metthrough: '',
  userbio: '',
  lastcontact: '',
  frequencyEnabled: false,
  frequencyValue: '1',
  frequencyUnit: 'months' as FrequencyUnit,
});

interface AddContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Mode = 'manual' | 'netwrk';

export function AddContactSheet({ open, onOpenChange }: AddContactSheetProps) {
  const [mode, setMode] = useState<Mode>('manual');

  // Manual mode state
  const [form, setForm] = useState(emptyForm());
  const [tags, setTags] = useState<string[]>([]);
  const [socials, setSocials] = useState<SocialEntry[]>([]);

  // Netwrk user mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | LinkedUserProfile | null>(null);
  const [userIdInput, setUserIdInput] = useState('');
  const [lookupUserId, setLookupUserId] = useState<string | null>(null);
  const [netwrkMetthrough, setNetwrkMetthrough] = useState('');
  const [netwrkError, setNetwrkError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const createContact = useCreateContact();
  const { data: searchResults = [] } = useUserSearch(debouncedQuery);
  const { data: lookedUpUser } = useUserById(lookupUserId);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // When lookup resolves, set as selected user
  useEffect(() => {
    if (lookedUpUser) {
      setSelectedUser(lookedUpUser);
      setLookupUserId(null);
    }
  }, [lookedUpUser]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function resetNetwrkState() {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedUser(null);
    setUserIdInput('');
    setLookupUserId(null);
    setNetwrkMetthrough('');
    setNetwrkError('');
    setShowDropdown(false);
  }

  function handleModeChange(m: Mode) {
    setMode(m);
    resetNetwrkState();
    setForm(emptyForm());
    setTags([]);
    setSocials([]);
  }

  function addSocial() {
    setSocials((prev) => [...prev, { label: 'email', address: '' }]);
  }

  function updateSocial(index: number, field: keyof SocialEntry, value: string) {
    setSocials((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function removeSocial(index: number) {
    setSocials((prev) => prev.filter((_, i) => i !== index));
  }

  function buildReminderPeriod() {
    if (!form.frequencyEnabled) return { weeks: null, months: null };
    const n = parseInt(form.frequencyValue) || null;
    return form.frequencyUnit === 'weeks'
      ? { weeks: n, months: null }
      : { weeks: null, months: n };
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createContact.mutateAsync({
      fullname: form.fullname,
      location: form.location,
      metthrough: form.metthrough,
      userbio: form.userbio,
      lastcontact: form.lastcontact || new Date().toISOString().slice(0, 10),
      tags,
      socials,
      reminderPeriod: buildReminderPeriod(),
    });
    setForm(emptyForm());
    setTags([]);
    setSocials([]);
    onOpenChange(false);
  }

  async function handleNetwrkSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setNetwrkError('');
    try {
      await createContact.mutateAsync({
        fullname: selectedUser.fullname,
        location: '',
        metthrough: netwrkMetthrough,
        userbio: '',
        lastcontact: new Date().toISOString().slice(0, 10),
        tags: [],
        socials: [],
        reminderPeriod: { weeks: null, months: null },
        linked_user_id: selectedUser.user_id,
      });
      resetNetwrkState();
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      if (msg?.includes('already added')) {
        setNetwrkError('You\'ve already added this person as a contact.');
      } else {
        setNetwrkError('Something went wrong. Please try again.');
      }
    }
  }

  function handleSelectUser(u: UserSearchResult) {
    setSelectedUser(u);
    setSearchQuery(u.fullname);
    setShowDropdown(false);
  }

  function handleUserIdLookup() {
    if (userIdInput.trim()) {
      setLookupUserId(userIdInput.trim());
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { handleModeChange('manual'); } onOpenChange(o); }}>
      <SheetContent className="w-[40vw] min-w-[360px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add contact</SheetTitle>
        </SheetHeader>
        <Separator className="my-4" />

        {/* Mode toggle */}
        <div className="flex rounded-md border border-slate-200 overflow-hidden text-sm mb-4 mx-4">
          {(['manual', 'netwrk'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              className={cn(
                'flex-1 px-3 py-2 transition-colors',
                mode === m
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              {m === 'manual' ? 'Add manually' : 'Find a Netwrk user'}
            </button>
          ))}
        </div>

        {mode === 'manual' ? (
          <form onSubmit={handleManualSubmit} className="space-y-4 px-4">
            <div className="space-y-2">
              <Label htmlFor="fullname">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullname"
                value={form.fullname}
                onChange={(e) => setForm((f) => ({ ...f, fullname: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <LocationAutocomplete
                value={form.location}
                onChange={(v) => setForm((f) => ({ ...f, location: v }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metthrough">How you met</Label>
              <Input
                id="metthrough"
                value={form.metthrough}
                onChange={(e) => setForm((f) => ({ ...f, metthrough: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userbio">Notes</Label>
              <Textarea
                id="userbio"
                value={form.userbio}
                onChange={(e) => setForm((f) => ({ ...f, userbio: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastcontact">Last contact date</Label>
              <Input
                id="lastcontact"
                type="date"
                value={form.lastcontact}
                onChange={(e) => setForm((f) => ({ ...f, lastcontact: e.target.value }))}
              />
            </div>

            <FrequencyField
              enabled={form.frequencyEnabled}
              value={form.frequencyValue}
              unit={form.frequencyUnit}
              onToggle={(enabled) => setForm((f) => ({ ...f, frequencyEnabled: enabled }))}
              onValueChange={(v) => setForm((f) => ({ ...f, frequencyValue: v }))}
              onUnitChange={(u) => setForm((f) => ({ ...f, frequencyUnit: u }))}
            />

            <div className="space-y-2">
              <Label>Tags</Label>
              <TagAutocomplete
                tags={tags}
                onAdd={(t) => setTags((prev) => [...prev, t])}
                onRemove={(t) => setTags((prev) => prev.filter((x) => x !== t))}
              />
            </div>

            <div className="space-y-2">
              <Label>Contact info</Label>
              <div className="space-y-2">
                {socials.map((s, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Select
                      value={s.label}
                      onValueChange={(v) => updateSocial(i, 'label', v ?? 'email')}
                    >
                      <SelectTrigger className="w-32 flex-shrink-0">
                        <SelectValue>{s.label}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORM_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={s.address}
                      onChange={(e) => updateSocial(i, 'address', e.target.value)}
                      placeholder="Value"
                    />
                    <button
                      type="button"
                      onClick={() => removeSocial(i)}
                      className="text-slate-400 hover:text-red-500 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addSocial}>
                <Plus className="h-3 w-3 mr-1" />
                Add contact info
              </Button>
            </div>

            <Separator />

            <Button type="submit" className="w-full" disabled={createContact.isPending}>
              {createContact.isPending ? 'Saving…' : 'Save contact'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 px-4">
            {/* Username autocomplete */}
            <div className="space-y-2" ref={searchRef}>
              <Label>Search by username</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  className="pl-8"
                  placeholder="Search username…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedUser(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
                    {searchResults.map((u) => (
                      <button
                        key={u.user_id}
                        type="button"
                        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-slate-50 text-sm"
                        onClick={() => handleSelectUser(u)}
                      >
                        {u.profile_pic_url ? (
                          <img src={u.profile_pic_url} className="h-7 w-7 rounded-full object-cover bg-slate-200" alt="" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                        <span className="font-medium">{u.fullname}</span>
                        <span className="text-slate-400">@{u.username}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* User ID lookup */}
            <div className="space-y-2">
              <Label>Add by user ID</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste user ID…"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleUserIdLookup} disabled={!userIdInput.trim()}>
                  Look up
                </Button>
              </div>
            </div>

            {/* Selected user preview */}
            {selectedUser && (
              <>
                <Separator />
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {selectedUser.profile_pic_url ? (
                      <img src={selectedUser.profile_pic_url} className="h-14 w-14 rounded-full object-cover bg-slate-200" alt="" />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="h-7 w-7 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{selectedUser.fullname}</p>
                      <p className="text-sm text-slate-500">@{selectedUser.username}</p>
                    </div>
                  </div>
                  {selectedUser.location && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {selectedUser.location}
                    </div>
                  )}
                  {selectedUser.bio && (
                    <p className="text-sm text-slate-600">{selectedUser.bio}</p>
                  )}
                </div>

                <form onSubmit={handleNetwrkSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="netwrk-metthrough">How you met</Label>
                    <Input
                      id="netwrk-metthrough"
                      value={netwrkMetthrough}
                      onChange={(e) => setNetwrkMetthrough(e.target.value)}
                      placeholder="e.g. Conference in NYC"
                    />
                  </div>
                  {netwrkError && <p className="text-sm text-red-500">{netwrkError}</p>}
                  <Button type="submit" className="w-full" disabled={createContact.isPending}>
                    {createContact.isPending ? 'Adding…' : 'Add contact'}
                  </Button>
                </form>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface FrequencyFieldProps {
  enabled: boolean;
  value: string;
  unit: FrequencyUnit;
  onToggle: (enabled: boolean) => void;
  onValueChange: (v: string) => void;
  onUnitChange: (u: FrequencyUnit) => void;
}

export function FrequencyField({ enabled, value, unit, onToggle, onValueChange, onUnitChange }: FrequencyFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Contact frequency</Label>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(!enabled)}
          className={cn(
            'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
            enabled ? 'bg-teal-600' : 'bg-slate-300'
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200',
              enabled ? 'translate-x-4' : 'translate-x-0'
            )}
          />
        </button>
      </div>
      {enabled && (
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            min="1"
            value={value}
            onChange={(e) => onValueChange(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-20 bg-white"
          />
          <div className="flex rounded-md border border-slate-200 overflow-hidden text-sm">
            {(['weeks', 'months'] as FrequencyUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => onUnitChange(u)}
                className={cn(
                  'px-3 py-1.5 transition-colors',
                  unit === u
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
