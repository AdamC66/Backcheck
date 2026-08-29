import { request } from "@/lib/apiClient";
import type { ColumnFormat } from "@/lib/columnFormatters";

export interface TableColumn {
  key: string;
  label: string;
  title: string;
  format: ColumnFormat;
  sortable: boolean;
  group: string;
}

export interface TableFilterOption {
  value: string | number;
  label: string;
}

export interface TableFilter {
  key: string;
  type: "select" | "segmented";
  label: string;
  default?: string;
  options: TableFilterOption[];
}

export interface TableSearch {
  param: string;
  placeholder: string;
}

export interface TableSort {
  default: { key: string; dir: "asc" | "desc" };
}

export interface TableSchema {
  columns: TableColumn[];
  filters: TableFilter[];
  search: TableSearch | null;
  sort: TableSort;
}

// `query` carries the params whose value changes the option lists (league drives the
// team and season options), so the schema refetches when they do.
export function fetchTableSchema(resource: string, query: string): Promise<TableSchema> {
  const suffix = query === "" ? "" : `?${query}`;
  return request<TableSchema>(`/${resource}/schema${suffix}`);
}
