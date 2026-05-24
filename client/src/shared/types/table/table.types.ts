import { ColumnDef } from '@tanstack/react-table';

export type DataTableProps<T> = {
  data: T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  searchKeys?: (keyof T)[];
  defaultPageSize?: number;
};
