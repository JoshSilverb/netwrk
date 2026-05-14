'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const navItems = [
  { href: '/contacts', label: 'Contacts' },
  { href: '/map', label: 'Map' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Top navbar */}
      <header className="flex-shrink-0 bg-slate-900 flex items-center px-6 py-0 h-16">
        <Link href="/contacts" className="flex items-center gap-2.5 flex-1 group">
          <img
            src="/netwrk-icon-square.png"
            alt="Netwrk logo"
            className="h-15 w-15 rounded-full"
          />
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-teal-400 transition-colors">
            Netwrk
          </span>
        </Link>

        <nav className="flex items-center gap-1 mr-3">
          {navItems.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User avatar */}
        <Link href="/account" className="ml-4 flex-shrink-0">
          {user?.profile_pic_url ? (
            <img
              src={user.profile_pic_url}
              alt={user.username}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-700 hover:ring-teal-500 transition-all"
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-slate-600 hover:bg-slate-500 transition-colors ring-2 ring-slate-700 hover:ring-teal-500 flex items-center justify-center">
              <User className="h-4 w-4 text-slate-300" />
            </div>
          )}
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
