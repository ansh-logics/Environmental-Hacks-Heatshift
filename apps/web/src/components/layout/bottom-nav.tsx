import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { NAV_ITEMS } from '../../lib/constants';
import { NAV_ICONS } from '../ui/icons';

/**
 * Thumb-reachable primary navigation for phones only; the tablet header and the
 * desktop sidebar take over at wider breakpoints. Each target is >= 48px tall.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-sand-200 bg-white/95 pb-safe backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.icon];
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold',
                    isActive ? 'text-heat-accent-dark' : 'text-ink-500',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={22} />
                    {item.label}
                    <span
                      className={cn(
                        'h-1 w-8 rounded-full',
                        isActive ? 'bg-heat-accent' : 'bg-transparent',
                      )}
                      aria-hidden
                    />
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
