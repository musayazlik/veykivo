"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  functionalUpdate,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type ColumnFiltersState,
  type FilterFn,
  type PaginationState,
  type RowData,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CirclePlus,
  MoreHorizontal,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SelectField } from "./controls";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------ Özellik kaydı

/** Çoklu seçim filtresi: hücre değeri (veya dizi değerlerinden biri) seçilenler arasındaysa satır kalır. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inArray: FilterFn<any, any> = (row, columnId, value: string[]) => {
  if (!value?.length) return true;
  const cell = row.getValue(columnId);
  return Array.isArray(cell) ? cell.some((c) => value.includes(String(c))) : value.includes(String(cell));
};
inArray.autoRemove = (v: unknown) => !Array.isArray(v) || v.length === 0;

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString, inArray },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text, datetime: sortFn_datetime, basic: sortFn_basic },
});

export type AdminTableFeatures = typeof features;
export const columnHelperFor = <T extends RowData>() => createColumnHelper<typeof features, T>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AdminColumn<T extends RowData> = ColumnDef<AdminTableFeatures, T, any>;

// ------------------------------------------------------------------ Tipler

export type FacetOption = { value: string; label: string; color?: string };
export type Facet = { columnId: string; title: string; options: FacetOption[] };

export type RowAction = {
  label: string;
  icon?: LucideIcon;
  /** Panel içi yönlendirme */
  href?: string;
  /** Yeni sekmede açılır (ör. "Sitede gör") */
  externalHref?: string;
  onSelect?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
};

/** Sunucu tarafı sayfalanan listeler için sorgu durumu (ör. talepler, yorumlar). */
export type TableQuery = { search: string; filters: Record<string, string[]>; pageIndex: number; pageSize: number };

export type ServerMode = {
  rowCount: number;
  query: TableQuery;
  onQueryChange: (query: TableQuery) => void;
  /** Sunucu yalnızca tek değerli filtreyi destekliyorsa facet tekli seçim gibi davranır. */
  singleValueFacets?: boolean;
};

const PAGE_SIZES = ["10", "20", "50", "100"];

// ------------------------------------------------------------------ Bileşen

export function DataTable<T extends RowData>({
  columns,
  data,
  isLoading,
  searchPlaceholder = "Ara…",
  searchText,
  facets = [],
  rowActions,
  toolbar,
  emptyState,
  initialSorting = [],
  initialPageSize = 10,
  server,
  getRowClassName,
}: {
  columns: AdminColumn<T>[];
  data: T[] | undefined;
  isLoading?: boolean;
  searchPlaceholder?: string;
  /** İstemci modunda aramanın baktığı metin (başlık, slug, e-posta…). */
  searchText?: (row: T) => string;
  facets?: Facet[];
  rowActions?: (row: T) => RowAction[];
  /** Arama çubuğunun sağındaki ek eylemler (ör. "Yeni ekle"). */
  toolbar?: React.ReactNode;
  emptyState?: React.ReactNode;
  initialSorting?: SortingState;
  initialPageSize?: number;
  server?: ServerMode;
  getRowClassName?: (row: T) => string | undefined;
}) {
  const router = useRouter();
  const rows = useMemo(() => data ?? [], [data]);

  // İstemci modunda durum burada tutulur; sunucu modunda sorgudan türetilir.
  const [localSearch, setLocalSearch] = useState("");
  const [localFilters, setLocalFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [localPagination, setLocalPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: initialPageSize });

  const search = server ? server.query.search : localSearch;
  const columnFilters: ColumnFiltersState = server
    ? Object.entries(server.query.filters).filter(([, v]) => v.length).map(([id, value]) => ({ id, value }))
    : localFilters;
  const pagination: PaginationState = server
    ? { pageIndex: server.query.pageIndex, pageSize: server.query.pageSize }
    : localPagination;

  const updateServer = (patch: Partial<TableQuery>) => server?.onQueryChange({ ...server.query, ...patch });

  const allColumns = useMemo<AdminColumn<T>[]>(() => {
    if (!rowActions) return columns;
    const helper = columnHelperFor<T>();
    return [
      ...columns,
      helper.display({
        id: "actions",
        header: () => <span className="sr-only">İşlemler</span>,
        cell: ({ row }) => <RowActionsMenu actions={rowActions(row.original)} onNavigate={(href) => router.push(href)} />,
      }) as AdminColumn<T>,
    ];
  }, [columns, rowActions, router]);

  const table = useTable({
    features,
    columns: allColumns,
    data: rows,
    state: { globalFilter: search, columnFilters, sorting, pagination },
    onGlobalFilterChange: (u: Updater<string>) => {
      const next = functionalUpdate(u, search) ?? "";
      if (server) updateServer({ search: next, pageIndex: 0 });
      else setLocalSearch(next);
    },
    onColumnFiltersChange: (u: Updater<ColumnFiltersState>) => {
      const next = functionalUpdate(u, columnFilters);
      if (server) updateServer({ filters: Object.fromEntries(next.map((f) => [f.id, f.value as string[]])), pageIndex: 0 });
      else setLocalFilters(next);
    },
    onSortingChange: setSorting,
    onPaginationChange: (u: Updater<PaginationState>) => {
      const next = functionalUpdate(u, pagination);
      if (server) updateServer({ pageIndex: next.pageIndex, pageSize: next.pageSize });
      else setLocalPagination(next);
    },
    globalFilterFn: (row, _columnId, value: string) =>
      !value || (searchText ? searchText(row.original) : "").toLocaleLowerCase("tr").includes(value.toLocaleLowerCase("tr")),
    getColumnCanGlobalFilter: () => true,
    manualFiltering: Boolean(server),
    manualPagination: Boolean(server),
    rowCount: server?.rowCount,
    autoResetPageIndex: !server,
  });

  const filteredCount = server ? server.rowCount : table.getFilteredRowModel().rows.length;
  const hasFilters = Boolean(search) || columnFilters.length > 0;
  const pageRows = table.getRowModel().rows;
  const { pageIndex, pageSize } = pagination;
  const pageCount = Math.max(1, table.getPageCount());

  return (
    <div className="space-y-3">
      {/* Araç çubuğu */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          placeholder={searchPlaceholder}
          debounce={server ? 300 : 0}
          onChange={(v) => table.setGlobalFilter(v)}
        />
        {facets.map((f) => (
          <FacetFilter
            key={f.columnId}
            facet={f}
            selected={(columnFilters.find((c) => c.id === f.columnId)?.value as string[]) ?? []}
            counts={server ? undefined : countFacet(rows, table, f.columnId)}
            single={server?.singleValueFacets}
            onChange={(values) => table.getColumn(f.columnId)?.setFilterValue(values.length ? values : undefined)}
          />
        ))}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              table.setGlobalFilter("");
              table.setColumnFilters([]);
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground hover:bg-mist hover:text-ink"
          >
            <X aria-hidden className="size-3.5" /> Temizle
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">{toolbar}</div>
      </div>

      {/* Tablo */}
      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-left text-[0.925rem]">
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => {
                    const isActions = header.column.id === "actions";
                    const canSort = !isActions && header.column.getCanSort() && !server;
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                        className={cn(
                          "h-11 border-b border-line bg-paper/70 px-4 text-xs font-semibold tracking-wide whitespace-nowrap text-muted-foreground",
                          isActions && "sticky right-0 w-14 bg-paper",
                        )}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="-mx-2 inline-flex items-center gap-1.5 rounded px-2 py-1 hover:bg-mist hover:text-ink"
                          >
                            <table.FlexRender header={header} />
                            {sorted === "asc" ? (
                              <ArrowUp aria-hidden className="size-3.5 text-ink" />
                            ) : sorted === "desc" ? (
                              <ArrowDown aria-hidden className="size-3.5 text-ink" />
                            ) : (
                              <ArrowUpDown aria-hidden className="size-3.5 opacity-40" />
                            )}
                          </button>
                        ) : (
                          <table.FlexRender header={header} />
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: Math.min(pageSize, 6) }, (_, i) => (
                  <tr key={i}>
                    {allColumns.map((_, j) => (
                      <td key={j} className="border-b border-line px-4 py-3.5">
                        <div className="h-4 animate-pulse rounded bg-mist" style={{ width: `${45 + ((i * 7 + j * 13) % 45)}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={allColumns.length} className="px-4 py-14 text-center">
                    {hasFilters ? (
                      <div>
                        <p className="font-medium text-ink">Filtrelere uyan kayıt yok</p>
                        <button
                          type="button"
                          onClick={() => {
                            table.setGlobalFilter("");
                            table.setColumnFilters([]);
                          }}
                          className="mt-2 text-sm font-medium text-teal hover:underline"
                        >
                          Filtreleri temizle
                        </button>
                      </div>
                    ) : (
                      (emptyState ?? <p className="text-muted-foreground">Henüz kayıt yok.</p>)
                    )}
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id} className={cn("group/row transition-colors hover:bg-paper/60", getRowClassName?.(row.original))}>
                    {row.getAllCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          "border-b border-line px-4 py-3 align-middle group-last/row:border-b-0",
                          cell.column.id === "actions" &&
                            "sticky right-0 w-14 bg-white text-right shadow-[-10px_0_12px_-12px_rgb(14_42_47/0.35)] group-hover/row:bg-[color-mix(in_oklab,var(--paper)_60%,white)]",
                        )}
                      >
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Sayfalama */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper/40 px-4 py-2.5 text-sm">
          <p className="text-muted-foreground tabular-nums">
            {filteredCount === 0
              ? "Kayıt yok"
              : `${filteredCount} kayıttan ${pageIndex * pageSize + 1}–${Math.min((pageIndex + 1) * pageSize, filteredCount)} arası`}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Sayfa başına</span>
              <div className="w-20">
                <SelectField
                  value={String(pageSize)}
                  onChange={(v) => table.setPageSize(Number(v ?? 10))}
                  options={PAGE_SIZES.map((s) => ({ value: s, label: s }))}
                  className="h-8 min-h-8 data-[size=default]:h-8"
                />
              </div>
            </div>
            <nav aria-label="Sayfalama" className="flex items-center gap-1">
              <PageButton label="İlk sayfa" disabled={pageIndex === 0} onClick={() => table.setPageIndex(0)}>
                <ChevronsLeft className="size-4" />
              </PageButton>
              <PageButton label="Önceki sayfa" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
                <ChevronLeft className="size-4" />
              </PageButton>
              {pageNumbers(pageIndex, pageCount).map((n, i) =>
                n === null ? (
                  <span key={`gap-${i}`} className="px-1 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    aria-current={n === pageIndex ? "page" : undefined}
                    onClick={() => table.setPageIndex(n)}
                    className={cn(
                      "min-w-8 rounded-md px-2 py-1 font-medium tabular-nums transition-colors",
                      n === pageIndex ? "bg-ink text-on-ink" : "text-ink hover:bg-mist",
                    )}
                  >
                    {n + 1}
                  </button>
                ),
              )}
              <PageButton label="Sonraki sayfa" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
                <ChevronRight className="size-4" />
              </PageButton>
              <PageButton label="Son sayfa" disabled={pageIndex >= pageCount - 1} onClick={() => table.setPageIndex(pageCount - 1)}>
                <ChevronsRight className="size-4" />
              </PageButton>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Parçalar

function pageNumbers(current: number, count: number): (number | null)[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i);
  const set = new Set([0, count - 1, current - 1, current, current + 1].filter((n) => n >= 0 && n < count));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
}

function PageButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-md text-ink hover:bg-mist disabled:pointer-events-none disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
  debounce,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  debounce: number;
}) {
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setDraft(value);
  }
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="relative w-full sm:w-72">
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={draft}
        aria-label={placeholder}
        placeholder={placeholder}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          clearTimeout(timer.current);
          if (debounce) timer.current = setTimeout(() => onChange(next), debounce);
          else onChange(next);
        }}
        className="h-9 w-full rounded-md border border-input bg-white pr-3 pl-9 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-teal focus:ring-3 focus:ring-teal/20"
      />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function countFacet(rows: RowData[], table: { getColumn: (id: string) => any }, columnId: string) {
  const column = table.getColumn(columnId);
  const counts = new Map<string, number>();
  if (!column) return counts;
  const accessor = column.accessorFn as ((row: RowData, index: number) => unknown) | undefined;
  rows.forEach((row, i) => {
    const value = accessor ? accessor(row, i) : (row as Record<string, unknown>)[columnId];
    for (const v of Array.isArray(value) ? value : [value]) counts.set(String(v), (counts.get(String(v)) ?? 0) + 1);
  });
  return counts;
}

function FacetFilter({
  facet,
  selected,
  counts,
  single,
  onChange,
}: {
  facet: Facet;
  selected: string[];
  counts?: Map<string, number>;
  single?: boolean;
  onChange: (values: string[]) => void;
}) {
  const toggle = (v: string) => {
    if (single) onChange(selected.includes(v) ? [] : [v]);
    else onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };
  const labels = facet.options.filter((o) => selected.includes(o.value));

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md border border-dashed px-3 text-sm font-medium transition-colors data-popup-open:border-teal",
          selected.length ? "border-ink/40 bg-white text-ink" : "border-input bg-white text-ink/80 hover:border-ink/40",
        )}
      >
        <CirclePlus aria-hidden className="size-4 text-muted-foreground" />
        {facet.title}
        {labels.length > 0 && (
          <>
            <span aria-hidden className="h-4 w-px bg-line" />
            {labels.length > 2 ? (
              <span className="rounded bg-mist px-1.5 py-0.5 text-xs">{labels.length} seçili</span>
            ) : (
              labels.map((l) => (
                <span key={l.value} className="rounded bg-mist px-1.5 py-0.5 text-xs">
                  {l.label}
                </span>
              ))
            )}
          </>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 gap-0 p-1.5">
        <ul role="listbox" aria-label={facet.title} aria-multiselectable={!single}>
          {facet.options.map((o) => {
            const isSelected = selected.includes(o.value);
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggle(o.value)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-mist focus-visible:bg-mist focus-visible:outline-none"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center border",
                      single ? "rounded-full" : "rounded",
                      isSelected ? "border-ink bg-ink text-on-ink" : "border-input bg-white",
                    )}
                  >
                    {isSelected && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  {o.color && <span aria-hidden className="size-2.5 rounded-full" style={{ background: o.color }} />}
                  <span className="flex-1 truncate">{o.label}</span>
                  {counts && <span className="text-xs text-muted-foreground tabular-nums">{counts.get(o.value) ?? 0}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="mt-1 w-full rounded-md border-t border-line px-2.5 py-2 text-center text-sm font-medium text-muted-foreground hover:bg-mist hover:text-ink"
          >
            Seçimi temizle
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function RowActionsMenu({ actions, onNavigate }: { actions: RowAction[]; onNavigate: (href: string) => void }) {
  const visible = actions.filter(Boolean);
  if (visible.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="İşlemler"
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-mist hover:text-ink data-popup-open:bg-ink data-popup-open:text-on-ink"
      >
        <MoreHorizontal className="size-4.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {visible.map((a, i) => (
          <div key={`${a.label}-${i}`}>
            {a.separatorBefore && i > 0 && <DropdownMenuSeparator className="my-1 bg-line" />}
            <DropdownMenuItem
              variant={a.destructive ? "destructive" : "default"}
              disabled={a.disabled}
              onClick={() => {
                if (a.href) onNavigate(a.href);
                else if (a.externalHref) window.open(a.externalHref, "_blank", "noopener");
                else a.onSelect?.();
              }}
            >
              {a.icon && <a.icon aria-hidden />}
              {a.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
