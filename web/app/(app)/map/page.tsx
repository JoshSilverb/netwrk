'use client';

import { useState, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { MapView, parseCoordinate } from '@/components/map/MapView';
import { MapSidebar } from '@/components/map/MapSidebar';
import { ContactSheet } from '@/components/contacts/ContactSheet';
import { useContacts } from '@/hooks/useContacts';
import { Contact } from '@/types';

export default function MapPage() {
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: contacts, isLoading } = useContacts({ sort: 'DATE_ADDED' });

  // Only contacts with parseable coordinates
  const mappedContacts = useMemo(
    () => (contacts ?? []).filter((c) => !!parseCoordinate(c.coordinate)),
    [contacts]
  );

  // Group by location string, sorted alphabetically within each group
  const groups = useMemo(() => {
    const map = new Map<string, { contacts: Contact[] }>();
    for (const c of mappedContacts) {
      if (!map.has(c.location)) map.set(c.location, { contacts: [] });
      map.get(c.location)!.contacts.push(c);
    }
    return Array.from(map.entries())
      .map(([location, { contacts }]) => ({
        location,
        coords: parseCoordinate(contacts[0].coordinate)!,
        contacts: [...contacts].sort((a, b) => a.fullname.localeCompare(b.fullname)),
      }))
      .sort((a, b) => a.location.localeCompare(b.location));
  }, [mappedContacts]);

  function openContact(contact: Contact) {
    setSelectedContact(contact);
    setSheetOpen(true);
  }

  return (
    <AppShell>
      <div className="flex h-full overflow-hidden">
        <MapSidebar
          groups={groups}
          activeLocation={activeLocation}
          totalMapped={mappedContacts.length}
          onContactClick={openContact}
          onLocationClick={setActiveLocation}
          isLoading={isLoading}
        />

        {/* Map area */}
        <div className="flex-1 relative">
          {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
            <NoApiKeyBanner />
          ) : (
            <MapView
              groups={groups}
              activeLocation={activeLocation}
              onLocationSelect={setActiveLocation}
              onContactClick={openContact}
            />
          )}
        </div>
      </div>

      <ContactSheet
        contact={selectedContact}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </AppShell>
  );
}

function NoApiKeyBanner() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-50 gap-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <p className="text-slate-800 font-semibold text-lg mb-2">Maps API key not configured</p>
        <p className="text-slate-500 text-sm leading-relaxed">
          Set <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-700">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in{' '}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-700">.env.local</code> to enable the map.
        </p>
      </div>
    </div>
  );
}
