'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { Contact } from '@/types';
import { User, X } from 'lucide-react';

export interface LatLng { lat: number; lng: number }

export function parseCoordinate(wkt: string | null | undefined): LatLng | null {
  if (!wkt) return null;
  const match = wkt.match(/POINT\(([^ ]+) ([^)]+)\)/);
  if (!match) return null;
  return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
}

interface LocationGroup {
  location: string;
  coords: LatLng;
  contacts: Contact[];
}

interface MapViewProps {
  groups: LocationGroup[];
  activeLocation: string | null;
  onLocationSelect: (location: string | null) => void;
  onContactClick: (contact: Contact) => void;
}

const DEFAULT_CENTER: LatLng = { lat: 40.7128, lng: -74.006 };
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID';

export function MapView(props: MapViewProps) {
  return (
    <APIProvider apiKey={API_KEY}>
      <MapInner {...props} />
    </APIProvider>
  );
}

function MapInner({ groups, activeLocation, onLocationSelect, onContactClick }: MapViewProps) {
  const map = useMap();
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  // Pan to active location when it changes
  useEffect(() => {
    if (!map || !activeLocation) return;
    const group = groups.find((g) => g.location === activeLocation);
    if (!group) return;
    map.panTo(group.coords);
    if (map.getZoom()! < 8) map.setZoom(10);
  }, [map, activeLocation, groups]);

  const activeGroup = groups.find((g) => g.location === activeLocation) ?? null;

  return (
    <Map
      defaultCenter={userLocation ?? DEFAULT_CENTER}
      defaultZoom={5}
      mapId={MAP_ID}
      gestureHandling="greedy"
      streetViewControl={false}
      mapTypeControl={false}
      fullscreenControl={false}
      onClick={() => onLocationSelect(null)}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Contact markers */}
      {groups.map((group) => {
        const isActive = group.location === activeLocation;
        return (
          <AdvancedMarker
            key={group.location}
            position={group.coords}
            onClick={(e) => { e.stop(); onLocationSelect(group.location); }}
          >
            <div
              className="relative flex items-center justify-center transition-all duration-200"
              style={{ filter: isActive ? 'drop-shadow(0 0 8px rgba(20,184,166,0.8))' : undefined }}
            >
              {/* Pin body */}
              <div
                className={`
                  flex items-center justify-center rounded-full font-semibold text-xs text-white
                  transition-all duration-200 cursor-pointer
                  ${isActive
                    ? 'w-9 h-9 bg-teal-500 ring-2 ring-white ring-offset-1 ring-offset-teal-500'
                    : 'w-7 h-7 bg-slate-700 hover:bg-slate-600 ring-1 ring-white/20'}
                `}
              >
                {group.contacts.length > 1 ? group.contacts.length : ''}
                {group.contacts.length === 1 && (
                  group.contacts[0].profile_pic_url
                    ? <img src={group.contacts[0].profile_pic_url} className="w-full h-full rounded-full object-cover" alt="" />
                    : <User className="w-3.5 h-3.5" />
                )}
              </div>
              {/* Pin tail */}
              <div
                className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0
                  border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent
                  ${isActive ? 'border-t-teal-500' : 'border-t-slate-700'}`}
              />
            </div>
          </AdvancedMarker>
        );
      })}

      {/* User location dot */}
      {userLocation && (
        <AdvancedMarker position={userLocation}>
          <div className="relative flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-blue-500 ring-2 ring-white shadow-lg z-10" />
            <div className="absolute w-10 h-10 rounded-full bg-blue-400/30 animate-ping" />
          </div>
        </AdvancedMarker>
      )}

      {/* Info window */}
      {activeGroup && (
        <InfoWindow
          position={activeGroup.coords}
          onCloseClick={() => onLocationSelect(null)}
          pixelOffset={[0, -20]}
        >
          <div className="min-w-[220px] max-w-[280px] p-0 font-sans">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="font-semibold text-slate-900 text-sm leading-tight">{activeGroup.location}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeGroup.contacts.length} {activeGroup.contacts.length === 1 ? 'contact' : 'contacts'}
                </p>
              </div>
            </div>

            {/* Contact rows */}
            <div className="space-y-2">
              {activeGroup.contacts.slice(0, 3).map((contact) => (
                <button
                  key={contact.contact_id}
                  onClick={() => onContactClick(contact)}
                  className="w-full flex items-center gap-2.5 hover:bg-slate-50 rounded-md p-1.5 -mx-1.5 transition-colors text-left group"
                >
                  {contact.profile_pic_url ? (
                    <img src={contact.profile_pic_url} alt={contact.fullname} className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate group-hover:text-teal-700">{contact.fullname}</p>
                    {contact.lastcontact && (
                      <p className="text-xs text-slate-400 truncate">Last: {contact.lastcontact}</p>
                    )}
                  </div>
                </button>
              ))}
              {activeGroup.contacts.length > 3 && (
                <p className="text-xs text-slate-400 text-center pt-1">
                  +{activeGroup.contacts.length - 3} more
                </p>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </Map>
  );
}
