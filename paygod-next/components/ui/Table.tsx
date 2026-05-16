import * as React from "react";
import { cn } from "@/lib/utils";

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string | number;
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  className?: string;
  emptyMessage?: string;
  rowStyle?: (row: T) => React.CSSProperties | undefined;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  className,
  emptyMessage = "No data",
  rowStyle,
}: TableProps<T>) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm" style={{ minWidth: 640 }}>
        <thead>
          <tr className="bg-[var(--surface)]">
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ width: c.width }}
                className={cn(
                  "text-left px-4 py-3 text-[11px] font-medium tracking-[0.1em] uppercase text-[var(--text-secondary)]",
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-[var(--text-secondary)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "transition-colors duration-150 hover:bg-[var(--surface)]",
                  onRowClick && "cursor-pointer",
                )}
                style={{ borderBottom: "1px solid var(--border)", ...(rowStyle?.(row) ?? {}) }}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3 text-white", c.className)}>
                    {c.render ? c.render(row) : (row as any)[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
