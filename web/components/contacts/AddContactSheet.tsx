'use client';

import { useState } from 'react';
import { useCreateContact } from '@/hooks/useContacts';
import { frequencyToReminderPeriod, FREQUENCY_OPTIONS } from '@/lib/reminder';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, X } from 'lucide-react';

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
  frequency: '',
});

interface AddContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddContactSheet({ open, onOpenChange }: AddContactSheetProps) {
  const [form, setForm] = useState(emptyForm());
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [socials, setSocials] = useState<SocialEntry[]>([]);
  const createContact = useCreateContact();

  function addTag() {
    const trimmed = tagInput.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    setTags((prev) => [...prev, trimmed]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createContact.mutateAsync({
      fullname: form.fullname,
      location: form.location,
      metthrough: form.metthrough,
      userbio: form.userbio,
      lastcontact: form.lastcontact || new Date().toISOString().slice(0, 10),
      tags,
      socials,
      reminderPeriod: frequencyToReminderPeriod(form.frequency),
    });
    setForm(emptyForm());
    setTags([]);
    setSocials([]);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[40vw] min-w-[360px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add contact</SheetTitle>
        </SheetHeader>
        <Separator className="my-4" />
        <form onSubmit={handleSubmit} className="space-y-4 px-4">
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
            <Input
              id="location"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="City, State"
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

          <div className="space-y-2">
            <Label>Planned contact frequency</Label>
            <Select
              value={form.frequency}
              onValueChange={(v) => setForm((f) => ({ ...f, frequency: v ?? '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency…" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag…"
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Socials */}
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
                      <SelectValue />
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
      </SheetContent>
    </Sheet>
  );
}
