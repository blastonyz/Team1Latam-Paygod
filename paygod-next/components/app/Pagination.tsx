import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  rangeLabel: string;
  currentPage?: number;
  totalPages?: number;
}

export function Pagination({ rangeLabel, currentPage = 1, totalPages = 25 }: PaginationProps) {
  const pages: (number | "...")[] = [1, 2, 3, "...", totalPages];
  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-[12px] text-[#888]">{rangeLabel}</span>
      <div className="flex items-center gap-1">
        <button
          className="h-8 w-8 inline-flex items-center justify-center text-[#888] hover:text-white transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="h-8 w-8 inline-flex items-center justify-center text-[#888] text-xs">
              …
            </span>
          ) : (
            <button
              key={p}
              className="h-8 min-w-8 px-2 inline-flex items-center justify-center text-xs font-medium transition-colors"
              style={
                p === currentPage
                  ? { backgroundColor: "#ED3134", color: "#fff" }
                  : { color: "#888", backgroundColor: "transparent" }
              }
            >
              {p}
            </button>
          ),
        )}
        <button
          className="h-8 w-8 inline-flex items-center justify-center text-[#888] hover:text-white transition-colors"
          aria-label="Next"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
