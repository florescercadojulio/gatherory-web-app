import { useEffect, useRef, useState, type ReactNode } from "react"
import type { RowData } from "@tanstack/react-table"
import { CheckCircle2Icon, PencilIcon, SearchIcon } from "lucide-react"
import { Popover as PopoverPrimitive } from "radix-ui"

import type {
  EntityTablePageRequest,
  EntityTableServerFn,
} from "@/components/entity-table-page"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

export interface EntityPickerProps<
  TData extends RowData,
  TInput extends object = Record<never, never>,
> {
  serverFn: EntityTableServerFn<TData, TInput>
  request?: TInput
  selectedItem: TData | null
  onSelect: (item: TData) => void
  onClear: () => void
  getItemId: (item: TData) => string
  getItemLabel: (item: TData) => string
  renderItem?: (item: TData) => ReactNode
  placeholder: string
  inputId?: string
  invalid?: boolean
  query?: string
  onQueryChange?: (query: string) => void
  emptyMessage?: ReactNode
  required?: boolean
  maxLength?: number
  onBlur?: () => void
}

const pageSize = 5

export function EntityPicker<
  TData extends RowData,
  TInput extends object = Record<never, never>,
>({
  serverFn,
  request,
  selectedItem,
  onSelect,
  onClear,
  getItemId,
  getItemLabel,
  renderItem,
  placeholder,
  inputId,
  invalid,
  query: controlledQuery,
  onQueryChange,
  emptyMessage = "No choices found.",
  required,
  maxLength,
  onBlur,
}: EntityPickerProps<TData, TInput>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [localQuery, setLocalQuery] = useState("")
  const query = controlledQuery ?? localQuery
  const [pageIndex, setPageIndex] = useState(0)
  const [items, setItems] = useState<TData[]>([])
  const [hasNextPage, setHasNextPage] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()

  const setQuery = (value: string) => {
    setLocalQuery(value)
    onQueryChange?.(value)
  }
  const openPicker = () => {
    if (!selectedItem) {
      setOpen(true)
      setIsLoading(true)
    }
  }

  useEffect(() => {
    if (!open || selectedItem) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError(undefined)
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
            setError(result.error.userMessage)
            return
          }
          setItems(result.data.data)
          setHasNextPage(result.data.hasNextPage)
        })
        .catch(() => {
          if (!cancelled) {
            setItems([])
            setHasNextPage(false)
            setError("Unable to load choices.")
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false)
        })
    }, 150)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, pageIndex, query, request, selectedItem, serverFn])

  const chooseAnother = () => {
    const previousLabel = selectedItem ? getItemLabel(selectedItem) : ""
    onClear()
    setQuery(previousLabel)
    setPageIndex(0)
    setOpen(true)
    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && inputRef.current === document.activeElement) return
        setOpen(next)
      }}
    >
      <PopoverPrimitive.Anchor className="block w-full">
        <InputGroup data-disabled={selectedItem ? true : undefined}>
          <InputGroupAddon>
            {selectedItem ? (
              <CheckCircle2Icon className="text-blue-600 dark:text-blue-400" />
            ) : (
              <SearchIcon />
            )}
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            id={inputId}
            required={required}
            maxLength={maxLength}
            onBlur={onBlur}
            value={selectedItem ? getItemLabel(selectedItem) : query}
            onFocus={openPicker}
            onChange={(event) => {
              setQuery(event.target.value)
              setItems([])
              setHasNextPage(false)
              setPageIndex(0)
              openPicker()
            }}
            placeholder={placeholder}
            autoComplete="off"
            readOnly={Boolean(selectedItem)}
            aria-invalid={invalid}
            aria-label={placeholder}
          />
          {selectedItem && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label={`Choose another ${placeholder.toLowerCase()}`}
                title="Choose another"
                onPointerDown={(event) => event.preventDefault()}
                onClick={chooseAnother}
              >
                <PencilIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      </PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-lg"
        >
          <div className="max-h-52 overflow-y-auto p-1" aria-busy={isLoading}>
            {error ? (
              <p className="p-3 text-sm text-destructive">{error}</p>
            ) : items.length ? (
              items.map((item) => (
                <button
                  key={getItemId(item)}
                  type="button"
                  className="flex w-full rounded-lg px-3 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted"
                  onClick={() => {
                    onSelect(item)
                    setOpen(false)
                  }}
                >
                  {renderItem?.(item) ?? getItemLabel(item)}
                </button>
              ))
            ) : isLoading ? (
              <p className="p-3 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <p className="p-3 text-sm text-muted-foreground">{emptyMessage}</p>
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
              Previous
            </Button>
            <Button type="button" variant="ghost" size="xs" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="justify-end"
              onClick={() => setPageIndex((index) => index + 1)}
              disabled={!hasNextPage || isLoading}
            >
              Next
            </Button>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
