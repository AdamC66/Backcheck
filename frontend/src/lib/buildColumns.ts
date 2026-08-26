import type { ReactNode } from "react";
import type { CellContext, ColumnHelper } from "@tanstack/react-table";

export interface ColumnSpec<Row, Value = unknown> {
  // A plain field key, or an accessor function for a derived value (e.g. a computed
  // percentage) — id is required in the function case since there's no key to infer it from.
  name: Extract<keyof Row, string> | ((row: Row) => Value);
  id?: string;
  // Short text shown in the column head, e.g. "CF".
  header: string;
  // Full-word tooltip on hover, e.g. "Corsi for" — defaults to header when the
  // abbreviation is already self-explanatory (a name column, say).
  title?: string;
  align?: "left" | "right";
  isRowHeader?: boolean;
  emphasize?: boolean;
  // Gets the whole cell context, same as a raw TanStack column def — call
  // info.getValue() directly, or spread it into a rendering component.
  cell?: (info: CellContext<Row, Value>) => ReactNode;
}

// Turns a plain array of column specs into TanStack column defs in one pass, so a stat
// table is just data (what columns, in what order) rather than a repeated
// columnHelper.accessor call per column.
export function buildColumns<Row>(
  columnHelper: ColumnHelper<Row>,
  // Each column's Value genuinely differs, the same reason DataTable's own `columns`
  // prop is typed this way — a heterogeneous array can't carry one shared Value generic.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  specs: ColumnSpec<Row, any>[],
) {
  return specs.map((spec) => {
    const accessorFn =
      typeof spec.name === "function" ? spec.name : (row: Row) => row[spec.name as keyof Row];
    const id = spec.id ?? (typeof spec.name === "string" ? spec.name : undefined);

    if (id === undefined) {
      throw new Error("ColumnSpec.id is required when name is an accessor function");
    }

    return columnHelper.accessor(accessorFn, {
      id,
      header: spec.header,
      meta: {
        title: spec.title ?? spec.header,
        align: spec.align,
        isRowHeader: spec.isRowHeader,
        emphasize: spec.emphasize,
      },
      ...(spec.cell ? { cell: spec.cell } : {}),
    });
  });
}
