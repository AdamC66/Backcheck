import { requestWithMeta, type Envelope } from "@/lib/apiClient";

export type TableRow = Record<string, unknown>;

export interface ServerTableMeta {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
  [key: string]: unknown;
}

export function fetchTableRows(
  resource: string,
  query: string,
): Promise<Envelope<TableRow[], ServerTableMeta>> {
  const suffix = query === "" ? "" : `?${query}`;
  return requestWithMeta<TableRow[], ServerTableMeta>(`/${resource}${suffix}`);
}
