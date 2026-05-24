'use client';

import { cn } from '@/lib/utils';
import {
  TOOL_CATEGORIES,
  ToolId,
  toolsInCategory,
} from '../config/tools-registry';

interface ToolSidebarProps {
  activeTool: ToolId;
  onSelect: (id: ToolId) => void;
}

export function ToolSidebar({ activeTool, onSelect }: ToolSidebarProps) {
  return (
    <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
      {TOOL_CATEGORIES.map((category) => (
        <div key={category.id} className="space-y-2">
          <div className="px-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {category.label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground/80">
              {category.description}
            </p>
          </div>
          <ul className="space-y-1">
            {toolsInCategory(category.id).map((tool) => {
              const isActive = activeTool === tool.id;
              const Icon = tool.icon;

              return (
                <li key={tool.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(tool.id)}
                    className={cn(
                      'group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                        : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary-foreground/15'
                          : 'bg-muted group-hover:bg-background',
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-tight">
                        {tool.label}
                      </span>
                      <span
                        className={cn(
                          'mt-0.5 block text-xs leading-snug',
                          isActive
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground',
                        )}
                      >
                        {tool.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}
