import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AppNav } from './AppNav';
import { ThemeToggle } from './ThemeToggle';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
  wide?: boolean;
}

export function AppShell({
  children,
  title,
  description,
  wide = false,
}: AppShellProps) {
  return (
    <div
      className={cn(
        'mx-auto flex min-h-screen w-full flex-col gap-4 p-4 md:p-6',
        wide ? 'max-w-7xl' : 'max-w-6xl',
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-0.5">
          {title ? (
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          ) : null}
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <AppNav />
          <ThemeToggle />
        </div>
      </header>
      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}
