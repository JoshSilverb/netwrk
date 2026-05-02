'use client';

import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import api from '@/lib/axios';
import { clearToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

  return (
    <AppShell>
      <div className="max-w-xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-xl font-semibold text-slate-900">Account</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-slate-500">Username</p>
              <p className="text-sm font-medium text-slate-900">{user?.username ?? '—'}</p>
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
