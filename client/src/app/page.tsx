import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">AI Integration</h1>
        <p className="mt-2 text-muted-foreground">
          MERN starter with provider-agnostic AI: chat memory, content tools, and
          more.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/chat">AI Chat</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/tools">Content Tools</Link>
        </Button>
      </div>
    </main>
  );
}
