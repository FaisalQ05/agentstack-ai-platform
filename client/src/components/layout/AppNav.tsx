import Link from 'next/link';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Home' },
  { href: '/chat', label: 'Chat' },
  { href: '/tools', label: 'Tools' },
];

export function AppNav({ className }: { className?: string }) {
  return (
    <nav
      className={cn(
        'flex flex-wrap items-center gap-4 text-sm text-muted-foreground',
        className,
      )}
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="transition-colors hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
