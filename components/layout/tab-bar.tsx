'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

// Bottom tab navigation shared across the 4 main screens (Home/Plan/
// Progress/Profile). Identical everywhere — only the active tab differs,
// derived from the current route rather than passed in as a prop.
// Glass surface per Design/design_handoff_home/README.md; no icons in the
// mock, just a small rose-gold underline indicator on the active tab.
const TABS = [
  { href: '/', label: 'Today' },
  { href: '/plan', label: 'Plan' },
  { href: '/progress', label: 'Progress' },
  { href: '/profile', label: 'Profile' },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-10 border-t border-(--glass-border)/15 bg-(--glass-bg)/52 backdrop-blur-[24px] backdrop-saturate-150">
      <div className="mx-auto grid max-w-md grid-cols-4 text-center text-[11px]">
        {TABS.map((tab) => {
          const isActive = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-1.5 py-3.5',
                isActive
                  ? 'font-semibold text-(--glass-foreground)'
                  : 'text-(--glass-foreground)/60'
              )}
            >
              <span
                className={cn(
                  'h-0.5 w-3.5 [clip-path:polygon(0_0,100%_0,calc(100%-4px)_100%,0_100%)]',
                  isActive ? 'bg-(--glass-accent)' : 'bg-transparent'
                )}
              />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
