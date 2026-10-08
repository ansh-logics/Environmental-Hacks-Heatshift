import { NavLink } from 'react-router-dom';
import { APP_NAME } from '@heatshift/shared';
import { NAV_ITEMS } from '../../lib/constants';
import { ConnectionStatus } from '../ui/status-dot';
import { useConnection } from '../../app/providers';
import { cn } from '../../lib/utils';

/**
 * Header for widths below the desktop sidebar: brand + connection on mobile,
 * plus compact tab navigation once there is room (tablet, 768-1023px).
 */
export function TopBar() {
  const { connection } = useConnection();

  return (
    <header className="sticky top-0 z-20 border-b border-sand-200 bg-sand-50/95 pt-safe backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-shell items-center gap-3 px-4 py-3 md:px-6">
        <NavLink to="/" className="flex shrink-0 items-center gap-2">
          <img src="/icons/icon-192.png" alt="" className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-extrabold tracking-tight">{APP_NAME}</span>
        </NavLink>

        <nav aria-label="Primary" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold transition-colors',
                      isActive
                        ? 'bg-white text-heat-accent-dark shadow-card'
                        : 'text-ink-500 hover:text-ink-900',
                    )
                  }
                >
                  {item.longLabel}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <ConnectionStatus
          connection={connection}
          className={cn('ml-auto md:ml-2', connection === 'checking' && 'text-ink-500')}
        />
      </div>
    </header>
  );
}
