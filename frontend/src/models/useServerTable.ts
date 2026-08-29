import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { fetchTableRows } from "@/models/serverTable";
import { tableRowsKey } from "@/models/queryKeys";
import type { TableSchema } from "@/models/tableSchema";
import { useTableSchema } from "@/models/useTableSchema";

// All table state (sort, direction, page, search, every filter) lives in the URL, so a
// view is shareable and the back button works — the same pattern TeamStatsPage uses.
// `fixedParams` are forced into every request and hidden from the filter UI — for a
// table scoped by its route (a league page pins `league`), not by a user control.
export function useServerTable(resource: string, fixedParams: Record<string, string> = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const merged = new URLSearchParams(searchParams);
  for (const [key, value] of Object.entries(fixedParams)) merged.set(key, value);
  const query = merged.toString();

  const schemaQuery = useTableSchema(
    resource,
    fixedParams.league ?? searchParams.get("league") ?? "",
  );
  const schema = schemaQuery.data;

  const dataQuery = useQuery({
    queryKey: tableRowsKey(resource, query),
    queryFn: () => fetchTableRows(resource, query),
    enabled: schema !== undefined,
    placeholderData: keepPreviousData,
  });

  const sort = searchParams.get("sort") ?? schema?.sort.default.key ?? "";
  const dir =
    (searchParams.get("dir") as "asc" | "desc" | null) ?? schema?.sort.default.dir ?? "desc";
  const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
  const search = searchParams.get("q") ?? "";

  function update(changes: Record<string, string | null>, resetPage = true) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    if (resetPage && !("page" in changes)) next.delete("page");
    setSearchParams(next, { replace: true });
  }

  function filterValue(schemaRef: TableSchema, key: string): string {
    return (
      searchParams.get(key) ?? schemaRef.filters.find((filter) => filter.key === key)?.default ?? ""
    );
  }

  return {
    schema,
    isPending: schemaQuery.isPending || dataQuery.isPending,
    isError: schemaQuery.isError || dataQuery.isError,
    rows: dataQuery.data?.data ?? [],
    meta: dataQuery.data?.meta,
    sort,
    dir,
    page,
    search,
    filterValue: (key: string) => (schema ? filterValue(schema, key) : ""),
    toggleSort: (key: string) =>
      update({ sort: key, dir: sort === key && dir === "desc" ? "asc" : "desc" }),
    setPage: (next: number) => update({ page: String(next) }, false),
    setFilter: (key: string, value: string) => update({ [key]: value || null }),
    setSearch: (value: string) => update({ q: value || null }),
  };
}
