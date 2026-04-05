'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Search, Clock, FlaskConical, ScanEye, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Analyze', icon: Search },
  { href: '/history', label: 'History', icon: Clock },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside
      className="sidebar-always-dark flex h-full w-[220px] shrink-0 flex-col border-r border-white/[0.06]"
      style={{ background: '#0F1117' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.06]">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-mod-text">
          <ScanEye className="h-4 w-4 text-white" strokeWidth={2} />
        </div>
        <div>
          <span
            className="block text-sm font-semibold tracking-tight text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            TruthLens
          </span>
          <span className="block text-[10px] text-surface-400 font-mono-num">
            v2.1.0-rc
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-2 pb-2 text-[10px] uppercase tracking-widest text-surface-600 font-semibold">
          Workspace
        </p>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={cn(
                  'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-surface-800 text-white'
                    : 'text-surface-400 hover:bg-[#1A1E2A] hover:text-[#D0D3E0]',
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-mod-text" />
                )}
                <Icon
                  className="h-4 w-4 shrink-0"
                  strokeWidth={isActive ? 2 : 1.5}
                />
                <span style={{ fontFamily: 'var(--font-body)' }}>{label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] px-3 py-3 space-y-2">
        {/* University label */}
        {/* <div className="px-2">
          <p className="text-[10px] text-[#3D4259] leading-tight">University of Moratuwa</p>
          <p className="text-[10px] text-[#3D4259]">Level 4 Research Project</p>
        </div> */}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-surface-400 hover:bg-[#1A1E2A] hover:text-[#D0D3E0] transition-colors"
          aria-label="Toggle theme"
        >
          {mounted ? (
            theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
          <span>{mounted && theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </aside>
  );
}
