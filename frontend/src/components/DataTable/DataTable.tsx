import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

// Column-level display hints TanStack has no opinion on, declared here so a column
// definition stays the one source of truth for both its data and how it renders.
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    title?: string;
    align?: "left" | "right";
    isRowHeader?: boolean;
    emphasize?: boolean;
  }
}

export interface DataTableProps<Row> {
  // Matches TanStack's own TableOptions.columns shape — each column's value type
  // genuinely differs, which is what useReactTable itself requires here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<Row, any>[];
  data: Row[];
  initialSorting?: SortingState;
  getRowId?: (row: Row) => string;
}

const HEADER_CELL = "px-3 py-2 font-medium whitespace-nowrap";
const CELL = "px-3 py-2 whitespace-nowrap";

export function DataTable<Row>({
  columns,
  data,
  initialSorting = [],
  getRowId,
}: DataTableProps<Row>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId,
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-3xl border-collapse text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase"
            >
              {headerGroup.headers.map((header) => {
                const align = header.column.columnDef.meta?.align ?? "right";

                return (
                  <th
                    key={header.id}
                    scope="col"
                    title={header.column.columnDef.meta?.title}
                    className={`${HEADER_CELL} ${align === "left" ? "text-left" : "text-right"}`}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={`hover:text-slate-800 ${
                          header.column.getIsSorted() ? "text-slate-900" : ""
                        }`}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc"
                          ? " ▲"
                          : header.column.getIsSorted() === "desc"
                            ? " ▼"
                            : ""}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-100 last:border-0">
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta;
                const align = meta?.align ?? "right";
                const alignClass = align === "left" ? "text-left" : "text-right tabular-nums";
                const toneClass = meta?.emphasize
                  ? "font-semibold text-slate-900"
                  : "text-slate-700";
                const content = flexRender(cell.column.columnDef.cell, cell.getContext());

                return meta?.isRowHeader ? (
                  <th
                    key={cell.id}
                    scope="row"
                    className={`${CELL} ${alignClass} font-medium text-slate-800`}
                  >
                    {content}
                  </th>
                ) : (
                  <td key={cell.id} className={`${CELL} ${alignClass} ${toneClass}`}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
