import { DesktopSidebar } from './desktop-sidebar';
import { TopBar } from './top-bar';
import { BottomNav } from './bottom-nav';
import { Outlet } from 'react-router-dom';

/**
 * Responsive shell:
 *   < 768px   compact header + fixed bottom navigation
 *   768-1023  compact header with tab navigation
 *   >= 1024   persistent left sidebar, no bottom navigation
 */
export function AppShell() {
  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-panel"
      >
        Skip to content
      </a>

      <DesktopSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main
          id="main"
          className="mx-auto w-full max-w-shell flex-1 space-y-4 px-4 pb-nav pt-4 md:space-y-6 md:px-6 md:pb-10 md:pt-6 lg:px-8 xl:px-10"
        >
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
