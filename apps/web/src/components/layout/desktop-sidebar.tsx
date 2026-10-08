import { NavLink } from 'react-router-dom';
import { APP_NAME, ROUTES } from '@heatshift/shared';
import { NAV_ITEMS } from '../../lib/constants';
import { NAV_ICONS } from '../ui/icons';
import { StatusDot } from '../ui/status-dot';
import { useConnection } from '../../app/providers';
import { cn } from '../../lib/utils';

/**
 * Desktop navigation (>= 1024px). Replaces the mobile bottom bar entirely, so it
 * is sticky and full-height rather than fixed to the bottom of the viewport.
 */
export function DesktopSidebar() {
  const { connection, health } = useConnection();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sand-200 bg-white lg:flex xl:w-72">
      <div className="px-5 py-5">
        <NavLink to={ROUTES.home} className="flex items-center gap-2.5">
          <img src="/icons/icon-192.png" alt="" className="h-9 w-9 rounded-xl" />
          <span className="text-lg font-extrabold tracking-tight">{APP_NAME}</span>
        </NavLink>
        <p className="mt-2 text-xs leading-snug text-ink-500">
          Heat safety for outdoor shift work
        </p>
      </div>

      <nav aria-label="Primary" className="flex-1 px-3">
        <p className="eyebrow px-2 pb-2 pt-3">Workspace</p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-heat-accent/10 text-heat-accent-dark'
                        : 'text-ink-700 hover:bg-sand-100',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        aria-hidden
                        className={cn(
                          'h-5 w-1 shrink-0 rounded-full',
                          isActive ? 'bg-heat-accent' : 'bg-transparent',
                        )}
                      />
                      <Icon size={20} className="shrink-0" />
                      {item.longLabel}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sand-200 p-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-sand-100 px-3 py-2.5">
          <StatusDot connection={connection} />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-ink-900">
              {connection === 'online'
                ? 'Connected'
                : connection === 'offline'
                  ? 'API unreachable'
                  : 'Checking API'}
            </p>
            <p className="truncate text-[0.7rem] text-ink-500">
              {connection === 'online'
                ? `Database ${health?.database ?? '-'} - v${health?.version ?? '-'}`
                : 'Open Connection details on My shift'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
