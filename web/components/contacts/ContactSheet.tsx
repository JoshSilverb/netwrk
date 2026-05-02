'use client';

import { useState } from 'react';
import { Contact, ContactPayload } from '@/types';
import { useUpdateContact, useDeleteContact } from '@/hooks/useContacts';
import { reminderPeriodToFrequency, frequencyToReminderPeriod, FREQUENCY_OPTIONS } from '@/lib/reminder';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Check, User, Plus } from 'lucide-react';

const PLATFORM_OPTIONS = ['email', 'phone', 'instagram', 'linkedin', 'twitter', 'other'];

interface EditForm {
  fullname: string;
  location: string;
  metthrough: string;
  userbio: string;
  lastcontact: string;
  frequency: string;
  tags: string[];
  tagInput: string;
  socials: { label: string; address: string }[];
}

interface ContactSheetProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactSheet({ contact, open, onOpenChange }: ContactSheetProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  function startEdit() {
    if (!contact) return;
    setForm({
      fullname: contact.fullname,
      location: contact.location ?? '',
      metthrough: contact.metthrough ?? '',
      userbio: contact.userbio ?? '',
      lastcontact: '',
      frequency: Object.entries({
        weekly: [1, null], biweekly: [2, null], monthly: [null, 1], quarterly: [null, 3], yearly: [null, 12]
      }).find(([, [w, m]]) => w === contact.remind_in_weeks && m === contact.remind_in_months)?.[0] ?? '',
      tags: [...(contact.tags ?? [])],
      tagInput: '',
      socials: (contact.socials ?? []).map((s) => ({ label: s.label, address: s.address })),
    });
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setForm(null);
  }

  async function saveEdit() {
    if (!contact || !form) return;
    const reminderPeriod = frequencyToReminderPeriod(form.frequency);
    const payload: ContactPayload & { contact_id: number } = {
      contact_id: contact.contact_id,
      fullname: form.fullname,
      location: form.location,
      metthrough: form.metthrough,
      userbio: form.userbio,
      lastcontact: form.lastcontact || contact.lastcontact?.split(', ').reverse().join('-') || '',
      tags: form.tags,
      socials: form.socials,
      reminderPeriod,
    };
    await updateContact.mutateAsync(payload);
    setEditing(false);
    setForm(null);
  }

  async function handleDelete() {
    if (!contact) return;
    await deleteContact.mutateAsync(contact.contact_id);
    onOpenChange(false);
  }

  if (!contact) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { setEditing(false); setForm(null); } onOpenChange(o); }}>
      <SheetContent className="w-[420px] min-w-[360px] flex flex-col p-0 bg-slate-100 overflow-hidden">

        {editing && form ? (
          /* ── Edit mode ── */
          <div className="flex flex-col h-full overflow-y-auto p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-800 mb-2">Edit contact</h2>

            <EditField label="Name">
              <Input
                value={form.fullname}
                onChange={(e) => setForm((f) => f && { ...f, fullname: e.target.value })}
              />
            </EditField>

            <EditField label="Location">
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => f && { ...f, location: e.target.value })}
              />
            </EditField>

            <EditField label="How you met">
              <Input
                value={form.metthrough}
                onChange={(e) => setForm((f) => f && { ...f, metthrough: e.target.value })}
              />
            </EditField>

            <EditField label="Notes">
              <Textarea
                value={form.userbio}
                onChange={(e) => setForm((f) => f && { ...f, userbio: e.target.value })}
                rows={3}
              />
            </EditField>

            <EditField label="Last contact date">
              <Input
                type="date"
                value={form.lastcontact}
                onChange={(e) => setForm((f) => f && { ...f, lastcontact: e.target.value })}
              />
            </EditField>

            <EditField label="Contact frequency">
              <Select
                value={form.frequency}
                onValueChange={(v) => setForm((f) => f && { ...f, frequency: v ?? '' })}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select frequency…">
                    {FREQUENCY_OPTIONS.find((o) => o.value === form.frequency)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditField>

            <EditField label="Tags">
              <div className="flex flex-wrap gap-1 mb-1">
                {form.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-xs text-slate-700">
                    {tag}
                    <button onClick={() => setForm((f) => f && { ...f, tags: f.tags.filter((t) => t !== tag) })} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag…"
                  value={form.tagInput}
                  onChange={(e) => setForm((f) => f && { ...f, tagInput: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && form.tagInput.trim()) {
                      e.preventDefault();
                      const t = form.tagInput.trim();
                      if (!form.tags.includes(t)) setForm((f) => f && { ...f, tags: [...f.tags, t], tagInput: '' });
                    }
                  }}
                  className="bg-white"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const t = form.tagInput.trim();
                    if (t && !form.tags.includes(t)) setForm((f) => f && { ...f, tags: [...f.tags, t], tagInput: '' });
                  }}
                >
                  Add
                </Button>
              </div>
            </EditField>

            <EditField label="Contact info">
              <div className="space-y-2">
                {form.socials.map((s, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Select
                      value={s.label}
                      onValueChange={(v) => setForm((f) => {
                        if (!f) return f;
                        const socials = [...f.socials];
                        socials[i] = { ...socials[i], label: v ?? 'email' };
                        return { ...f, socials };
                      })}
                    >
                      <SelectTrigger className="w-32 flex-shrink-0 bg-white">
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
                      onChange={(e) => setForm((f) => {
                        if (!f) return f;
                        const socials = [...f.socials];
                        socials[i] = { ...socials[i], address: e.target.value };
                        return { ...f, socials };
                      })}
                      placeholder="Value"
                      className="bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((f) => f && { ...f, socials: f.socials.filter((_, j) => j !== i) })}
                      className="text-slate-400 hover:text-red-500 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm((f) => f && { ...f, socials: [...f.socials, { label: 'email', address: '' }] })}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add contact info
                </Button>
              </div>
            </EditField>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={cancelEdit} className="flex-1">Cancel</Button>
              <Button onClick={saveEdit} disabled={updateContact.isPending} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white">
                <Check className="h-4 w-4 mr-1" />
                {updateContact.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          /* ── View mode ── */
          <>
            {/* Avatar + name */}
            <div className="flex flex-col items-center pt-10 pb-6 px-6">
              {contact.profile_pic_url ? (
                <img
                  src={contact.profile_pic_url}
                  alt={contact.fullname}
                  className="h-32 w-32 rounded-full object-cover bg-slate-200 border-2 border-slate-300"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center">
                  <User className="h-12 w-12 text-slate-400" />
                </div>
              )}
              <h2 className="mt-4 text-2xl font-bold text-slate-900 text-center">{contact.fullname}</h2>
            </div>

            {/* Info rows */}
            <div className="flex-1 overflow-y-auto px-6 space-y-5">
              <InfoRow label="Location" value={contact.location} />
              <InfoRow label="How you met" value={contact.metthrough} />
              <InfoRow label="Notes" value={contact.userbio} />

              <div>
                <p className="text-sm font-semibold text-slate-800 mb-2">Outreach</p>
                <div className="space-y-1">
                  <p className="text-sm text-slate-700">Last contact: <span className="text-slate-500">{contact.lastcontact || '—'}</span></p>
                  <p className="text-sm text-slate-700">Next contact: <span className="text-slate-500">{contact.nextcontact || '—'}</span></p>
                  <p className="text-sm text-slate-700">Frequency: <span className="text-slate-500">{reminderPeriodToFrequency(contact.remind_in_weeks, contact.remind_in_months)}</span></p>
                </div>
              </div>

              {(contact.tags?.length ?? 0) > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {(contact.socials?.length ?? 0) > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-2">Contact info</p>
                  <div className="space-y-1">
                    {contact.socials.map((s, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-slate-500 capitalize w-24 flex-shrink-0">{s.label}</span>
                        <span className="text-slate-700">{s.address}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 px-6 py-5 border-t border-slate-200">
              <Button
                onClick={startEdit}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold"
              >
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold" />
                  }
                >
                  Delete
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {contact.fullname}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove {contact.fullname} from your contacts. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <p className="text-sm text-slate-500 mt-0.5">{value || '—'}</p>
    </div>
  );
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-slate-500 uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}
