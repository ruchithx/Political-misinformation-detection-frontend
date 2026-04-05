import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
        {/* Footer rate-limit notice */}
        <div className="border-t border-border bg-background px-6 py-2">
          <p className="text-[11px] text-muted-foreground font-mono-num">
            University of Moratuwa
          </p>
        </div>
      </div>
    </div>
  );
}
