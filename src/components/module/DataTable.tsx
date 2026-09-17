import { ReactNode, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { tableAnchor } from '@/lib/tour/anchors';

export interface DataTableColumn<T> {
  /** Stable key, also used as the sort key when `sortable` */
  key: string;
  header: string;
  /** Cell renderer. Falls back to the raw value at `key`. */
  render?: (row: T) => ReactNode;
  /** Value used for sorting; defaults to the raw value at `key` */
  sortValue?: (row: T) => string | number | null | undefined;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export interface DataTableFilter<T> {
  key: string;
  label: string;
  options: string[];
  /** How to read the value being filtered from a row */
  accessor: (row: T) => string | null | undefined;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  /** Fields scanned by the search box */
  searchAccessor?: (row: T) => string;
  searchPlaceholder?: string;
  filters?: DataTableFilter<T>[];
  onRowClick?: (row: T) => void;
  pageSize?: number;
  emptyMessage?: string;
  toolbarExtra?: ReactNode;
  /** Opts the table into guided tours as `table:{tourId}` and `table:{tourId}:toolbar`. */
  tourId?: string;
}

const ALL = '__all__';

/**
 * Generic table with search, select filters, client-side sorting and paging.
 *
 * Client-side on purpose: every demo dataset fits comfortably in memory, and it
 * keeps each module from having to build its own query-param plumbing.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  searchAccessor,
  searchPlaceholder = 'Buscar...',
  filters = [],
  onRowClick,
  pageSize = 15,
  emptyMessage = 'Sin resultados',
  toolbarExtra,
  tourId,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let out = rows;

    if (search && searchAccessor) {
      const q = search.toLowerCase();
      out = out.filter((row) => searchAccessor(row).toLowerCase().includes(q));
    }

    for (const filter of filters) {
      const value = selected[filter.key];
      if (value && value !== ALL) {
        out = out.filter((row) => filter.accessor(row) === value);
      }
    }

    if (sort) {
      const column = columns.find((c) => c.key === sort.key);
      const read = (row: T) => {
        if (column?.sortValue) return column.sortValue(row);
        return (row as Record<string, unknown>)[sort.key] as string | number | null;
      };
      out = [...out].sort((a, b) => {
        const va = read(a);
        const vb = read(b);
        if (va === vb) return 0;
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        const cmp = typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb), 'es');
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }

    return out;
  }, [rows, search, searchAccessor, filters, selected, sort, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: string) => {
    setPage(0);
    setSort((current) => {
      if (current?.key !== key) return { key, dir: 'asc' };
      if (current.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  };

  return (
    <div className="space-y-3">
      {(searchAccessor || filters.length > 0 || toolbarExtra) && (
        <div data-tour={tableAnchor(tourId, 'toolbar')} className="flex flex-wrap items-center gap-2">
          {searchAccessor ? (
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder={searchPlaceholder}
                className="pl-8"
              />
            </div>
          ) : null}

          {filters.map((filter) => (
            <Select
              key={filter.key}
              value={selected[filter.key] ?? ALL}
              onValueChange={(value) => {
                setSelected((s) => ({ ...s, [filter.key]: value }));
                setPage(0);
              }}
            >
              <SelectTrigger className="w-auto min-w-[150px]">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{filter.label}: todos</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {toolbarExtra}
        </div>
      )}

      <div data-tour={tableAnchor(tourId, 'root')} className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center',
                    column.sortable && 'cursor-pointer select-none hover:text-foreground',
                    column.className,
                  )}
                  onClick={column.sortable ? () => toggleSort(column.key) : undefined}
                >
                  {column.header}
                  {sort?.key === column.key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((column) => (
                    <TableCell key={column.key}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(onRowClick && 'cursor-pointer')}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        column.align === 'right' && 'text-right tabular-nums',
                        column.align === 'center' && 'text-center',
                        column.className,
                      )}
                    >
                      {column.render
                        ? column.render(row)
                        : String((row as Record<string, unknown>)[column.key] ?? '—')}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > pageSize ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} de {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="px-2">{safePage + 1} / {totalPages}</span>
            <Button variant="outline" size="icon" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
