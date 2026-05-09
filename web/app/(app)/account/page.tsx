'use client';

import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import api from '@/lib/axios';
import { clearToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
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

export default function AccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  function handleLogout() {
    clearToken();
    router.push('/login');
  }

  async function handleDeleteAccount() {
    try {
      await api.post('/deleteUser', {});
    } catch {
      // ignore
    }
    clearToken();
    router.push('/login');
  }

  async function togglePublic() {
    if (!user) return;
    await api.post('/updateUserDetails', {
      username: user.username,
      fullname: user.fullname,
      bio: user.bio,
      image_object_key: '',
      location: user.location,
      is_public: !user.is_public,
    });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CURRENT_USER });
  }

  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-xl font-semibold text-slate-900">Account</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">Full name</p>
              <p className="text-sm font-medium text-slate-900">{user?.fullname ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Username</p>
              <p className="text-sm font-medium text-slate-900">@{user?.username ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm font-medium text-slate-900">{user?.email ?? '—'}</p>
            </div>
            {user?.location && (
              <div>
                <p className="text-xs text-slate-500">Location</p>
                <p className="text-sm font-medium text-slate-900">{user.location}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500">Contacts</p>
              <p className="text-sm font-medium text-slate-900">{user?.num_contacts ?? '—'}</p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Public profile</p>
                <p className="text-xs text-slate-500">Discoverable by other Netwrk users</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={user?.is_public ?? false}
                onClick={togglePublic}
                className={cn(
                  'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
                  user?.is_public ? 'bg-teal-600' : 'bg-slate-300'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200',
                    user?.is_public ? 'translate-x-4' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="space-y-3">
          <Button variant="outline" onClick={handleLogout} className="w-full">
            Log out
          </Button>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50" />
              }
            >
              Delete account
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes your account and all your contacts. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-500 hover:bg-red-600">
                  Delete account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </AppShell>
  );
}
