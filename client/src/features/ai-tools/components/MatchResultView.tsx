'use client';

import { panelClassName } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { JobMatcherOutput } from '../types/ai-tools.types';

export function MatchResultView({
  match,
  className,
}: {
  match: JobMatcherOutput;
  className?: string;
}) {
  const scoreColor =
    match.compatibility_score >= 75
      ? 'text-green-600 dark:text-green-400'
      : match.compatibility_score >= 50
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-destructive';

  return (
    <div className={cn(panelClassName, 'space-y-4 p-4', className)}>
      <div className="flex items-end gap-3">
        <p className={cn('text-4xl font-bold', scoreColor)}>
          {Math.round(match.compatibility_score)}%
        </p>
        <p className="pb-1 text-sm text-muted-foreground">compatibility</p>
      </div>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          Matching skills
        </h4>
        <ul className="flex flex-wrap gap-2">
          {match.matching_skills.length > 0 ? (
            match.matching_skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full bg-green-500/10 px-3 py-1 text-sm text-foreground"
              >
                {skill}
              </li>
            ))
          ) : (
            <li className="text-sm text-muted-foreground">None identified</li>
          )}
        </ul>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          Missing skills
        </h4>
        <ul className="flex flex-wrap gap-2">
          {match.missing_skills.length > 0 ? (
            match.missing_skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full bg-destructive/10 px-3 py-1 text-sm text-foreground"
              >
                {skill}
              </li>
            ))
          ) : (
            <li className="text-sm text-muted-foreground">None identified</li>
          )}
        </ul>
      </section>

      <section>
        <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
          Reasoning
        </h4>
        <p className="text-sm leading-relaxed text-foreground">{match.reasoning}</p>
      </section>
    </div>
  );
}
