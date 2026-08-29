import { useMemo, type ReactNode } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable/DataTable";
import { Pager } from "@/components/Pager/Pager";
import { Row } from "@/components/Row/Row";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { Select } from "@/components/Select/Select";
import { Stack } from "@/components/Stack/Stack";
import { TextInput } from "@/components/TextInput/TextInput";
import { Text } from "@/components/Text/Text";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { formatCell } from "@/lib/columnFormatters";
import type { TableRow } from "@/models/serverTable";
import type { TableFilter } from "@/models/tableSchema";
import { useServerTable } from "@/models/useServerTable";

export type CellRenderers = Record<string, (value: unknown, row: TableRow) => ReactNode>;

export interface ServerDataTableProps {
  resource: string;
  cellRenderers?: CellRenderers;
  // Params forced on every request and hidden from the filter row (e.g. a league page
  // pinning `league` to its route).
  fixedParams?: Record<string, string>;
}

const columnHelper = createColumnHelper<TableRow>();

function FilterControl({
  filter,
  value,
  onChange,
}: {
  filter: TableFilter;
  value: string;
  onChange: (value: string) => void;
}) {
  const options = filter.options.map((option) => ({
    value: String(option.value),
    label: option.label,
  }));

  if (filter.type === "segmented") {
    return (
      <SegmentedControl label={filter.label} options={options} value={value} onChange={onChange} />
    );
  }

  return (
    <Select
      id={`filter-${filter.key}`}
      label={filter.label}
      options={options}
      // No schema default = optional filter; "All" is its cleared state, since a bare
      // <select value=""> otherwise shows option 0 as if it were applied.
      placeholder={filter.default === undefined ? "All" : undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function rowId(row: TableRow): string {
  const player = row.player as { id?: number } | undefined;
  return String(player?.id ?? JSON.stringify(row));
}

export function ServerDataTable({ resource, cellRenderers, fixedParams }: ServerDataTableProps) {
  const table = useServerTable(resource, fixedParams);
  const { schema, meta } = table;
  const debouncedSearch = useDebouncedCallback(table.setSearch, 300);

  const columns = useMemo(() => {
    if (schema === undefined) return [];

    return schema.columns.map((column) =>
      columnHelper.accessor((row) => row[column.key], {
        id: column.key,
        header: column.label,
        enableSorting: column.sortable,
        meta: {
          title: column.title,
          align: column.group === "identity" ? "left" : "right",
          isRowHeader: column.key === "player",
        },
        cell: (info) => {
          const render = cellRenderers?.[column.key];
          return render
            ? render(info.getValue(), info.row.original)
            : formatCell(info.getValue(), column.format);
        },
      }),
    );
  }, [schema, cellRenderers]);

  const sorting = useMemo(
    () => (table.sort === "" ? [] : [{ id: table.sort, desc: table.dir === "desc" }]),
    [table.sort, table.dir],
  );

  if (table.isError) {
    return <Text tone="danger">Could not load this table.</Text>;
  }

  if (schema === undefined) {
    return <Text tone="muted">Loading…</Text>;
  }

  return (
    <Stack gap="md">
      <Row gap="sm" wrap align="end">
        {schema.search ? (
          <TextInput
            id="table-search"
            label="Search"
            placeholder={schema.search.placeholder}
            defaultValue={table.search}
            onChange={(event) => debouncedSearch(event.target.value)}
          />
        ) : null}
        {schema.filters
          .filter((filter) => fixedParams?.[filter.key] === undefined)
          .map((filter) => (
            <FilterControl
              key={filter.key}
              filter={filter}
              value={table.filterValue(filter.key)}
              onChange={(value) => table.setFilter(filter.key, value)}
            />
          ))}
      </Row>

      <DataTable
        columns={columns}
        data={table.rows}
        getRowId={rowId}
        sorting={sorting}
        onSortingChange={(updater) => {
          const next = typeof updater === "function" ? updater(sorting) : updater;
          const first = next[0];
          if (first) table.toggleSort(first.id);
        }}
      />

      {meta ? (
        <Pager
          page={meta.page}
          totalPages={meta.total_pages}
          totalCount={meta.total_count}
          onPageChange={table.setPage}
        />
      ) : null}
    </Stack>
  );
}
