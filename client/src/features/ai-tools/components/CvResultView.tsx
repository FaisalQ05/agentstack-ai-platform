'use client';

import { panelClassName } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { CvParserOutput } from '../types/ai-tools.types';

export function CvResultView({
  cv,
  className,
}: {
  cv: CvParserOutput;
  className?: string;
}) {
  return (
    <div className={cn(panelClassName, 'space-y-4 p-4', className)}>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{cv.fullName}</h3>
        <p className="text-sm text-muted-foreground">
          {[cv.email, cv.phone, cv.location]
            .filter(Boolean)
            .join(' · ') || 'No contact details'}
        </p>
      </div>

      <section>
        <h4 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
          Summary
        </h4>
        <p className="text-sm text-foreground">{cv.summary}</p>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          Skills
        </h4>
        <ul className="flex flex-wrap gap-2">
          {cv.skills.map((skill) => (
            <li
              key={skill}
              className="rounded-full bg-primary/10 px-3 py-1 text-sm text-foreground"
            >
              {skill}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          Experience
        </h4>
        <div className="space-y-3">
          {cv.experience.map((item) => (
            <article
              key={`${item.company}-${item.role}`}
              className="rounded-xl border border-border bg-muted/40 p-3"
            >
              <p className="font-medium text-foreground">
                {item.role} @ {item.company}
              </p>
              <p className="text-xs text-muted-foreground">{item.duration}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-foreground">
                {item.responsibilities.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          Education
        </h4>
        <div className="space-y-2">
          {cv.education.map((item) => (
            <p key={`${item.institution}-${item.degree}`} className="text-sm text-foreground">
              {item.degree} — {item.institution}
              {item.year ? ` (${item.year})` : ''}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
