import { useEffect, useRef, useState, type ReactNode } from "react"
import type { RowData } from "@tanstack/react-table"
import { CheckIcon, SearchIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import type {
  EntityTablePageRequest,
  EntityTableServerFn,
} from "@/components/entity-table-page"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toastServerError } from "@/lib/toast-server-error"

export interface MultiEntityPickerProps<
  TData extends RowData,
  TInput extends object = Record<never, never>,
> {
  serverFn: EntityTableServerFn<TData, TInput>
  request?: TInput
  selectedItems: TData[]
  onChange: (items: TData[]) => void
  getItemId: (item: TData) => string
  getItemLabel: (item: TData) => string
  renderItem?: (item: TData) => ReactNode
  placeholder: string
  inputId?: string
  invalid?: boolean
  maxSelected?: number
}

const pageSize = 5

export function MultiEntityPicker<
  TData extends RowData,
  TInput extends object = Record<never, never>,
>({
  serverFn,
  request,
  selectedItems,
  onChange,
  getItemId,
  getItemLabel,
  renderItem,
  placeholder,
  inputId,
  invalid,
  maxSelected = 25,
}: MultiEntityPickerProps<TData, TInput>) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [pageIndex, setPageIndex] = useState(0)
  const [items, setItems] = useState<TData[]>([])
  const [hasNextPage, setHasNextPage] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setIsLoading(true)
    const pageRequest = {
      ...request,
      limit: pageSize,
      offset: pageIndex * pageSize,
      query,
    } as EntityTablePageRequest<TInput>

    void serverFn({ data: pageRequest })
      .then((result) => {
        if (cancelled) return
        if (!result.ok) {
          setItems([])
          setHasNextPage(false)
          toastServerError(result.error)
          return
        }
        setItems(result.data.data)
        setHasNextPage(result.data.hasNextPage)
      })
      .catch(() => {
        if (!cancelled) {
          setItems([])
          setHasNextPage(false)
          toast.error(t("picker.loadFailed"))
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, pageIndex, query, request, serverFn])

  const isSelected = (item: TData) =>
    selectedItems.some((selected) => getItemId(selected) === getItemId(item))
  const toggle = (item: TData) => {
    const id = getItemId(item)
    if (isSelected(item)) {
      onChange(selectedItems.filter((selected) => getItemId(selected) !== id))
    } else if (selectedItems.length < maxSelected) {
      onChange([...selectedItems, item])
    }
  }

  return (
    <div className="min-w-0 space-y-2">
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (!next && inputRef.current === document.activeElement) return
          setOpen(next)
        }}
      >
        <PopoverTrigger render={<div className="block w-full" />}>
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              id={inputId}
              value={query}
              onFocus={() => setOpen(true)}
              onChange={(event) => {
                setQuery(event.target.value)
                setPageIndex(0)
                setOpen(true)
              }}
              placeholder={placeholder}
              autoComplete="off"
              aria-invalid={invalid}
              aria-label={placeholder}
            />
          </InputGroup>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] min-w-80 max-w-[calc(100vw-2rem)] gap-0 p-0"
          initialFocus={false}
        >
          <div className="max-h-52 overflow-y-auto p-1" aria-busy={isLoading}>
            {items.length ? (
              items.map((item) => {
                const selected = isSelected(item)
                const unavailable =
                  selectedItems.length >= maxSelected && !selected
                return (
                  <button
                    key={getItemId(item)}
                    type="button"
                    aria-pressed={selected}
                    disabled={unavailable}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => {
                      toggle(item)
                      setOpen(true)
                      window.requestAnimationFrame(() =>
                        inputRef.current?.focus(),
                      )
                    }}
                  >
                    <span className="min-w-0 flex-1">
                      {renderItem?.(item) ?? getItemLabel(item)}
                    </span>
                    {selected && <CheckIcon className="size-4 text-blue-600" />}
                  </button>
                )
              })
            ) : isLoading ? (
              <p className="p-3 text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : (
              <p className="p-3 text-sm text-muted-foreground">
                {t("picker.noChoices")}
              </p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1 border-t bg-muted/30 p-2">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="justify-start"
              onClick={() => setPageIndex((index) => index - 1)}
              disabled={pageIndex === 0 || isLoading}
            >
              {t("picker.previous")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setOpen(false)}
            >
              {t("picker.done")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="justify-end"
              onClick={() => setPageIndex((index) => index + 1)}
              disabled={!hasNextPage || isLoading}
            >
              {t("picker.next")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1" aria-label={t("common.selectedItems")}>
          {selectedItems.map((item) => {
            const label = getItemLabel(item)
            return (
              <Badge
                key={getItemId(item)}
                variant="secondary"
                className="gap-1 whitespace-normal"
              >
                {label}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t("picker.removeItem", { label })}
                  onClick={() => toggle(item)}
                >
                  <XIcon />
                </Button>
              </Badge>
            )
          })}
        </div>
      )}
      {selectedItems.length === maxSelected && (
        <p className="text-xs text-muted-foreground">
          {t("picker.maximumSelected", { count: maxSelected })}
        </p>
      )}
    </div>
  )
}
