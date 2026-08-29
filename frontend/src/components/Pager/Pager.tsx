import { Row } from "@/components/Row/Row";
import { Text } from "@/components/Text/Text";

export interface PagerProps {
  page: number;
  totalPages: number;
  totalCount?: number;
  onPageChange: (page: number) => void;
}

const BUTTON =
  "cursor-pointer border border-slate-300 px-2 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40";

export function Pager({ page, totalPages, totalCount, onPageChange }: PagerProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <Row justify="between" align="center">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={BUTTON}
      >
        Prev
      </button>
      <Text variant="caption" tone="muted">
        Page {page} of {totalPages}
        {totalCount === undefined ? "" : ` · ${totalCount} total`}
      </Text>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={BUTTON}
      >
        Next
      </button>
    </Row>
  );
}
