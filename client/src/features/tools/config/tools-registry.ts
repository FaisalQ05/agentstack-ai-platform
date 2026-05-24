import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  FileText,
  FileUser,
  GitCompare,
  Hash,
  PenLine,
  ScrollText,
  Sparkles,
} from 'lucide-react';

export type ContentToolId =
  | 'summarize'
  | 'rewrite'
  | 'extract-keywords'
  | 'generate-description';

export type StructuredToolId = 'cv-parse' | 'job-extract' | 'job-match';

export type ToolId = ContentToolId | StructuredToolId;

export type ToolCategory = 'content' | 'structured';

export interface ToolDefinition {
  id: ToolId;
  category: ToolCategory;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const TOOL_CATEGORIES: {
  id: ToolCategory;
  label: string;
  description: string;
}[] = [
  {
    id: 'content',
    label: 'Content',
    description: 'Summarize, rewrite & generate copy',
  },
  {
    id: 'structured',
    label: 'Structured',
    description: 'CV, jobs & matching (JSON)',
  },
];

export const TOOLS: ToolDefinition[] = [
  {
    id: 'summarize',
    category: 'content',
    label: 'Summarize',
    description: 'Shorten long text into a clear summary',
    icon: ScrollText,
  },
  {
    id: 'rewrite',
    category: 'content',
    label: 'Rewrite',
    description: 'Rephrase content in a different style',
    icon: PenLine,
  },
  {
    id: 'extract-keywords',
    category: 'content',
    label: 'Keywords',
    description: 'Pull key terms from any text',
    icon: Hash,
  },
  {
    id: 'generate-description',
    category: 'content',
    label: 'Description',
    description: 'Generate product or article copy',
    icon: Sparkles,
  },
  {
    id: 'cv-parse',
    category: 'structured',
    label: 'CV Parser',
    description: 'Extract structured profile from résumé text',
    icon: FileUser,
  },
  {
    id: 'job-extract',
    category: 'structured',
    label: 'Job Extractor',
    description: 'Parse job postings into structured entities',
    icon: Briefcase,
  },
  {
    id: 'job-match',
    category: 'structured',
    label: 'Job Matcher',
    description: 'Score candidate fit against a job record',
    icon: GitCompare,
  },
];

export function getTool(id: ToolId): ToolDefinition {
  const tool = TOOLS.find((t) => t.id === id);
  if (!tool) throw new Error(`Unknown tool: ${id}`);
  return tool;
}

export function toolsInCategory(category: ToolCategory): ToolDefinition[] {
  return TOOLS.filter((t) => t.category === category);
}
