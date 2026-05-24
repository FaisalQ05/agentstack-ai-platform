'use client';

import { panelClassName } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { JobExtractorOutput } from '../types/ai-tools.types';

export function JobResultView({
  job,
  className,
}: {
  job: JobExtractorOutput;
  className?: string;
}) {
  return (
    <div className={cn(panelClassName, 'space-y-4 p-4', className)}>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
        <p className="text-sm text-muted-foreground">
          {job.company} · {job.location}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {job.job_type} · {job.seniority_level}
          {job.salary_range ? ` · ${job.salary_range}` : ''}
        </p>
      </div>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
          Required skills
        </h4>
        <ul className="flex flex-wrap gap-2">
          {job.required_skills.map((skill) => (
            <li
              key={skill}
              className="rounded-full bg-primary/10 px-3 py-1 text-sm text-foreground"
            >
              {skill}
            </li>
          ))}
        </ul>
      </section>

      {job.preferred_skills && job.preferred_skills.length > 0 ? (
        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Preferred skills
          </h4>
          <ul className="flex flex-wrap gap-2">
            {job.preferred_skills.map((skill) => (
              <li
                key={skill}
                className="rounded-full bg-muted px-3 py-1 text-sm text-foreground"
              >
                {skill}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
