import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { panelClassName } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { MessageSquare, Sparkles, Wand2 } from 'lucide-react';

const features = [
  {
    title: 'AI Chat',
    description:
      'Conversational AI with PostgreSQL memory and live token streaming over SSE.',
    href: '/chat',
    icon: MessageSquare,
  },
  {
    title: 'Content Tools',
    description:
      'Summarize, rewrite, extract keywords, and generate descriptions via micro-endpoints.',
    href: '/tools',
    icon: Wand2,
  },
];

export default function Home() {
  return (
    <AppShell
      title="AI Integration"
      description="Provider-agnostic MERN stack starter for OpenAI and Groq"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <article
            key={feature.href}
            className={cn(panelClassName, 'flex flex-col gap-4 p-6')}
          >
            <feature.icon className="size-8 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {feature.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
            <Button asChild className="mt-auto w-fit">
              <Link href={feature.href}>Open {feature.title}</Link>
            </Button>
          </article>
        ))}
      </div>

      <section
        className={cn(
          panelClassName,
          'mt-4 flex items-start gap-3 p-5 text-sm text-muted-foreground',
        )}
      >
        <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>
          Swap providers with one env change: set <code className="text-foreground">AI_PROVIDER</code> to{' '}
          <code className="text-foreground">openai</code> or{' '}
          <code className="text-foreground">groq</code> in{' '}
          <code className="text-foreground">server/.env</code>.
        </p>
      </section>
    </AppShell>
  );
}
