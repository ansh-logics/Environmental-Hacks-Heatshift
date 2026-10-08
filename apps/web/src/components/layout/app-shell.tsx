import { Link, Outlet } from 'react-router-dom';
import { APP_NAME, ROUTES } from '@heatshift/shared';
import { BottomNav } from './bottom-nav';
import { StatusDot } from '../ui/status-dot';
import { useApiStatus } from '../../hooks/use-api-status';

export function AppShell() {
  const { connection } = useApiStatus();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-sand-300 bg-sand-50/95 pt-safe backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <Link to={ROUTES.home} className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="" className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-extrabold tracking-tight">{APP_NAME}</span>
          </Link>
          <StatusDot connection={connection} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 space-y-4 px-4 pb-nav pt-4">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
