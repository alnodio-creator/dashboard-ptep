import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { Loader2 } from "lucide-react";

export default function PaginationDataTable({
  totalPages,
  currentPage,
  onChangePage,
  isLoading = false,
}: {
  totalPages: number;
  currentPage: number;
  onChangePage: (page: number) => void;
  isLoading?: boolean;
}) {
  if (totalPages <= 0) return null;

  const handleChangePage = (page: number) => {
    if (isLoading || page === currentPage) return;

    onChangePage(page);
  };

  return (
    <Pagination>
      <PaginationContent>
        {/* PREVIOUS */}
        <PaginationItem>
          <PaginationPrevious
            aria-disabled={isLoading || currentPage === 1}
            className={
              isLoading || currentPage === 1
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
            onClick={() => {
              if (currentPage > 1 && !isLoading) {
                handleChangePage(currentPage - 1);
              }
            }}
          />
        </PaginationItem>

        {/* LOADING */}
        {isLoading ? (
          <PaginationItem>
            <div className="flex h-9 items-center gap-2 px-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          </PaginationItem>
        ) : (
          <>
            {/* PAGE NUMBER */}
            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;

              if (
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === currentPage}
                      onClick={() => handleChangePage(page)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              }

              if (
                (page === currentPage - 2 && page > 1) ||
                (page === currentPage + 2 && page < totalPages)
              ) {
                return (
                  <PaginationItem key={`ellipsis-${page}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              return null;
            })}
          </>
        )}

        {/* NEXT */}
        <PaginationItem>
          <PaginationNext
            aria-disabled={isLoading || currentPage === totalPages}
            className={
              isLoading || currentPage === totalPages
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
            onClick={() => {
              if (currentPage < totalPages && !isLoading) {
                handleChangePage(currentPage + 1);
              }
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
