import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react"
import {
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Page, ServerResult } from "@/server/result"

export const entityTableFeatures = tableFeatures({})

export type EntityTableColumnDef<TData extends RowData> = ColumnDef<
  typeof entityTableFeatures,
  TData,
  unknown
>

export type EntityTablePageRequest<
  TInput extends object = Record<never, never>,
> = {
  limit: number
  offset: number
  query: string
} & TInput

export type EntityTableServerFn<
  TData extends RowData,
  TInput extends object = Record<never, never>,
> = (args: {
  data: EntityTablePageRequest<TInput>
}) => Promise<ServerResult<Page<TData>>>

type SearchConfig = {
  placeholder?: string
  filters?: ReactNode
  appliedFilters?: ReactNode
}

export interface EntityTableConfig<
  TData extends RowData,
  TInput extends object = Record<never, never>,
> {
  serverFn: EntityTableServerFn<TData, TInput>
  request?: TInput
  columns: readonly EntityTableColumnDef<TData>[]
  getRowId: (row: TData) => string
  onRowClick?: (row: TData) => void
  search?: SearchConfig
  resourceControls?: ReactNode
  refreshKey?: string | number
  loadEnabled?: boolean
  paginationResetKey?: string | number
  pagination?: {
    initialPageSize?: number
    pageSizeOptions?: readonly number[]
  }
}

const defaultPageSizeOptions = [25, 50, 100] as const
const requestTimeoutMs = 15_000

function isInteractiveRowTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "a, button, input, select, textarea, [role='button'], [data-row-control]",
      ),
    )
  )
}

export function EntityTablePage<
  TData extends RowData,
  TInput extends object = Record<never, never>,
>({
  config,
  emptyMessage = "No results found.",
  className,
  layout = "page",
}: {
  config: EntityTableConfig<TData, TInput>
  emptyMessage?: ReactNode
  className?: string
  layout?: "page" | "section"
}) {
  const pageSizeOptions =
    config.pagination?.pageSizeOptions ?? defaultPageSizeOptions
  const [rows, setRows] = useState<TData[]>([])
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(
    config.pagination?.initialPageSize ?? pageSizeOptions[0],
  )
  const [hasNextPage, setHasNextPage] = useState(false)
  const [search, setSearch] = useState("")
  const [appliedQuery, setAppliedQuery] = useState("")
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>()
  const searchRef = useRef<HTMLInputElement>(null)
  const [previousResetKey, setPreviousResetKey] = useState(
    config.paginationResetKey,
  )

  if (previousResetKey !== config.paginationResetKey) {
    setPreviousResetKey(config.paginationResetKey)
    setPageIndex(0)
  }

  const offset = pageIndex * pageSize
  const columns = useMemo(
    () => [
      {
        id: "row-number",
        header: "#",
        cell: ({ row }: { row: { index: number } }) => offset + row.index + 1,
      },
      ...config.columns,
    ],
    [config.columns, offset],
  )
  const table = useTable({
    columns,
    data: rows,
    features: entityTableFeatures,
    getRowId: config.getRowId,
  })

  useEffect(() => {
    let cancelled = false
    let timeoutId: number | undefined

    if (config.loadEnabled === false) {
      setRows([])
      setHasNextPage(false)
      setError(undefined)
      setIsLoading(false)
      return () => {
        cancelled = true
      }
    }

    setIsLoading(true)
    setError(undefined)

    const request = {
      ...config.request,
      limit: pageSize,
      offset,
      query: appliedQuery,
    } as EntityTablePageRequest<TInput>

    const timeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(
        () => reject(new Error("Table request timed out.")),
        requestTimeoutMs,
      )
    })

    void Promise.race([config.serverFn({ data: request }), timeout])
      .then((result) => {
        if (cancelled) return
        if (!result.ok) {
          setRows([])
          setHasNextPage(false)
          setError(result.error.userMessage)
          return
        }
        setRows(result.data.data)
        setHasNextPage(result.data.hasNextPage)
      })
      .catch(() => {
        if (!cancelled) {
          setRows([])
          setHasNextPage(false)
          setError("Unable to load this table. Please try again.")
        }
      })
      .finally(() => {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId)
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [
    appliedQuery,
    config.loadEnabled,
    config.refreshKey,
    config.request,
    config.serverFn,
    offset,
    pageSize,
    refreshVersion,
  ])

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((!event.metaKey && !event.ctrlKey) || event.altKey) return
      if (event.key !== "/" && event.code !== "Slash") return
      event.preventDefault()
      searchRef.current?.focus()
      searchRef.current?.select()
    }
    window.addEventListener("keydown", focusSearch)
    return () => window.removeEventListener("keydown", focusSearch)
  }, [])

  const clearSearch = () => {
    setSearch("")
    setPageIndex(0)
    setAppliedQuery("")
  }

  return (
    <section
      className={cn(
        layout === "page"
          ? "flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden bg-background px-2"
          : "flex flex-col gap-3",
        className,
      )}
    >
      <div className="shrink-0 border-b border-border/70 bg-background">
        {config.search && (
          <form
            className="flex flex-col gap-3 py-3"
            onSubmit={(event) => {
              event.preventDefault()
              setPageIndex(0)
              setAppliedQuery(search)
            }}
          >
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <div className="relative w-full flex-1">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={config.search.placeholder ?? "Search"}
                  aria-label={config.search.placeholder ?? "Search"}
                  className="h-9 bg-background/80 pr-20 pl-9"
                />
                {search ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
                    onClick={clearSearch}
                    aria-label="Clear search"
                  >
                    <XIcon />
                  </Button>
                ) : (
                  <KbdGroup className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
                    <Kbd>⌘</Kbd>
                    <Kbd>/</Kbd>
                  </KbdGroup>
                )}
              </div>
              <div className="flex w-full gap-1.5 sm:w-auto">
                <Button type="submit" className="flex-1 sm:flex-none" disabled={isLoading}>
                  Search
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setRefreshVersion((version) => version + 1)}
                  disabled={isLoading}
                  aria-label="Refresh table"
                >
                  <RefreshCwIcon className={isLoading ? "animate-spin" : ""} />
                </Button>
              </div>
            </div>
          </form>
        )}

        {(config.search?.filters ||
          config.search?.appliedFilters ||
          config.resourceControls) && (
          <div className="flex flex-col gap-4 border-t border-border/70 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {config.search?.filters && (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    <SlidersHorizontalIcon className="size-3" />
                    Filters
                  </div>
                  {config.search.filters}
                </div>
              )}
              {config.resourceControls && (
                <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                  {config.resourceControls}
                </div>
              )}
            </div>
            {config.search?.appliedFilters}
          </div>
        )}
      </div>

      <div
        className={cn(
          "relative",
          layout === "page"
            ? "min-h-0 min-w-0 flex-1 overflow-auto"
            : "min-w-0 overflow-x-auto",
        )}
      >
        {error ? (
          <p className="flex min-h-14 items-center text-sm text-destructive">{error}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-y border-border/70 bg-muted text-foreground">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="sticky top-0 z-10 h-10 bg-muted px-2 text-xs font-bold tracking-wider whitespace-nowrap uppercase"
                    >
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/30",
                    config.onRowClick &&
                      "cursor-pointer focus-visible:bg-muted/30 focus-visible:outline-none",
                  )}
                  {...(config.onRowClick
                    ? {
                        role: "link",
                        tabIndex: 0,
                        onClick: (event: ReactMouseEvent<HTMLTableRowElement>) => {
                          if (!isInteractiveRowTarget(event.target)) {
                            config.onRowClick?.(row.original)
                          }
                        },
                        onKeyDown: (
                          event: ReactKeyboardEvent<HTMLTableRowElement>,
                        ) => {
                          if (event.key !== "Enter" && event.key !== " ") return
                          if (isInteractiveRowTarget(event.target)) return
                          event.preventDefault()
                          config.onRowClick?.(row.original)
                        },
                      }
                    : {})}
                >
                  {row.getAllCells().map((cell) => (
                    <td key={cell.id} className="p-2 align-middle whitespace-nowrap">
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <footer className="flex min-h-10 shrink-0 flex-wrap items-center justify-between gap-4 border-t border-border/70 bg-background">
        <p className="text-xs tabular-nums text-muted-foreground">
          {isLoading ? "Loading…" : rows.length === 0 ? "No results" : `${rows.length} loaded`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageIndex(0)
              setPageSize(Number(value))
            }}
          >
            <SelectTrigger size="sm" className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setPageIndex((page) => page - 1)}
            disabled={pageIndex === 0 || isLoading}
          >
            <ChevronLeftIcon /> Previous
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setPageIndex((page) => page + 1)}
            disabled={!hasNextPage || isLoading}
          >
            Next <ChevronRightIcon />
          </Button>
        </div>
      </footer>
    </section>
  )
}
