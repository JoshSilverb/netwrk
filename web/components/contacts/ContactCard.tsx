'use client';

import { Contact } from '@/types';
import { User } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
  onClick: (contact: Contact) => void;
}

export function ContactCard({ contact, onClick }: ContactCardProps) {
  return (
    <div
      className="flex items-center gap-4 px-6 py-4 border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
      onClick={() => onClick(contact)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {(() => {
          const pic = contact.is_linked
            ? (contact.linked_user_profile_pic_url || contact.profile_pic_url)
            : contact.profile_pic_url;
          return pic ? (
            <img src={pic} alt={contact.fullname} className="h-12 w-12 rounded-full object-cover bg-slate-200" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center">
              <User className="h-5 w-5 text-slate-400" />
            </div>
          );
        })()}
      </div>

      {/* Name + bio */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-base leading-snug">{contact.fullname}</p>
        {(() => {
          const displayBio = contact.userbio || (contact.is_linked ? contact.linked_user_bio : null);
          const isProfileBio = contact.is_linked && !contact.userbio && !!contact.linked_user_bio;
          return displayBio ? (
            <p className="text-sm text-slate-500 mt-0.5 line-clamp-1 flex items-center gap-1.5">
              {isProfileBio && <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />}
              {displayBio}
            </p>
          ) : null;
        })()}
      </div>

      {/* Location */}
      {(contact.is_linked ? (contact.linked_user_location || contact.location) : contact.location) && (
        <p className="flex-shrink-0 text-sm text-slate-500 ml-4">
          {contact.is_linked ? (contact.linked_user_location || contact.location) : contact.location}
        </p>
      )}
    </div>
  );
}
