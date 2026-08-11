import React, { type SetStateAction } from "react";
import Skeleton from "react-loading-skeleton";
import type { Table } from "@tanstack/react-table";
import { cn } from "@/utils/className";
import { Button } from "@/components/ui/button";
import LimitSelector from "../limit-selector";

type Props<T extends any> = {
  table: Table<T>;
  prevButtonProps: React.ComponentProps<typeof Button>;
  nextButtonProps: React.ComponentProps<typeof Button>;
  loading: boolean;
  pagination: boolean;
  page: number;
  setPage: (value: React.SetStateAction<number>) => void;
  limit: number;
  setLimit: (value: React.SetStateAction<number>) => void;
};

export default function TablePaginationFooter<T extends any = any>({
  table,
  prevButtonProps,
  nextButtonProps,
  loading = false,
  pagination = true,
  page = 0,
  setPage,
  limit = 20,
  setLimit,
  ...props
}: Partial<Props<T>> & Omit<React.ComponentProps<"div">, keyof Props<T>>) {
  return (
    <div
      {...props}
      className={cn(
        "flex items-center justify-between space-x-2 py-4",
        props?.className,
      )}
    >
      {/* <div className="text-muted-foreground text-sm">
                {table.getFilteredSelectedRowModel().rows?.length} of{" "}
                {Math.min(table.getFilteredRowModel().rows?.length)} row(s) selected.
              </div> */}
      <div className="flex gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          disabled={!table?.getCanPreviousPage()}
          {...prevButtonProps}
          className={cn("", prevButtonProps?.className)}
          onClick={(e) => {
            table?.previousPage();
            prevButtonProps?.onClick?.(e);
          }}
        >
          Previous
        </Button>
        <p className="text-lg font-medium">
          Page :{" "}
          {loading ? (
            <Skeleton containerClassName="rounded-md" height={20} width={40} />
          ) : (
            <>
              {page + 1} / {table?.getPageCount()}
            </>
          )}
        </p>
        <Button
          variant="outline"
          size="sm"
          disabled={!table?.getCanNextPage()}
          {...nextButtonProps}
          className={cn("", nextButtonProps?.className)}
          onClick={(e) => {
            table?.nextPage();
            nextButtonProps?.onClick?.(e);
          }}
        >
          Next
        </Button>
      </div>
      {!!pagination && (
        <div className="space-x-2">
          <div className="flex gap-2 items-center">
            Limit Records :
            <LimitSelector
              defaultLimit={20}
              onLimitChange={(limit) => {
                setLimit?.(limit);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
