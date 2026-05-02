import { AppShell } from '@/components/layout/AppShell';
import { Map } from 'lucide-react';

export default function MapPage() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
        <Map className="h-12 w-12" />
        <p className="text-lg font-medium">Map view coming soon</p>
        <p className="text-sm">Contact locations will appear here.</p>
      </div>
    </AppShell>
  );
}
