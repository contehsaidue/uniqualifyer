import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCcwDotIcon,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

interface GenericTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  pagination?: PaginationState;
  defaultPageSize?: number;
  pageSize?: number;
  schoolOptions?: string[];
  user?: { school?: { name?: string } };
  hideSchoolFilter?: boolean;
}

export function GenericTable<TData>({
  data,
  columns,
  pageSize = 5,
  hideSchoolFilter = true,
}: GenericTableProps<TData>) {
  const pageSizeOptions = useMemo(() => [5, 10, 20, 30], []);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [schoolFilter, setSchoolFilter] = useState<string>("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize,
  });

  // Extract unique school names from the data (handles both structures)
  const schoolOptions = useMemo(() => {
    const schools = new Set<string>();
    data.forEach((item) => {
      if (item && typeof item === "object") {
        // Check for direct school property first
        if ("school" in item && typeof item.school === "string") {
          schools.add(item.school);
        }
        // Check for nested user.school property
        else if (
          "user" in item &&
          item.user &&
          typeof item.user === "object" &&
          "school" in item.user &&
          typeof (item.user as { school?: string }).school === "string"
        ) {
          const schoolName = (item.user as { school?: string }).school;
          if (schoolName) schools.add(schoolName);
        }
      }
    });
    return Array.from(schools).sort();
  }, [data]);

  // Get school name from item (handles both structures)
  const getSchoolName = (item: any): string | null => {
    if (!item || typeof item !== "object") return null;

    // Check for direct school property first
    if ("school" in item && typeof item.school === "string") {
      return item.school;
    }
    // Check for nested user.school property
    else if (
      "user" in item &&
      item.user &&
      typeof item.user === "object" &&
      "school" in item.user &&
      typeof (item.user as { school?: string }).school === "string"
    ) {
      return (item.user as { school?: string }).school || null;
    }
    return null;
  };

  // Combined filtered data
  const filteredData = useMemo(() => {
    // First apply school filter if set
    let result = data;
    if (schoolFilter) {
      result = result.filter((item) => {
        const itemSchool = getSchoolName(item);
        return itemSchool === schoolFilter;
      });
    }

    // Then apply global filter if set
    if (globalFilter) {
      const lowerFilter = globalFilter.toLowerCase();
      result = result.filter((item) => {
        // Search through all string properties of the item
        if (typeof item === "object" && item !== null) {
          return Object.values(item).some((val) => {
            if (typeof val === "string") {
              return val.toLowerCase().includes(lowerFilter);
            }
            if (typeof val === "object" && val !== null) {
              return Object.values(val).some(
                (nestedVal) =>
                  typeof nestedVal === "string" &&
                  nestedVal.toLowerCase().includes(lowerFilter)
              );
            }
            return false;
          });
        }
        return false;
      });
    }

    return result;
  }, [data, schoolFilter, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true,
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="w-full">
      {/* Filter Controls */}
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Box - Full width on mobile, flexible on larger screens */}
        <div className="relative flex-grow w-full sm:w-auto">
          <input
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(String(e.target.value))}
            placeholder="Search across all columns..."
            className="w-full pl-5 pr-10 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            name="globalFilter"
          />
          <Search
            className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500"
            size={20}
          />
        </div>

        {/* School Filter Dropdown - Conditionally rendered */}
        {!hideSchoolFilter && (
          <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Schools</option>
              {schoolOptions.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>

            {/* Reset Filters Button */}
            <button
              onClick={() => {
                setGlobalFilter("");
                setSchoolFilter("");
              }}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              <RefreshCcwDotIcon size={16} />
              <span className="whitespace-nowrap">Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* Responsive Table Container with proper scrolling */}
      <div className="w-full overflow-x-auto bg-white shadow-sm rounded-lg">
        <div className="min-w-full inline-block align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? "cursor-pointer flex items-center"
                            : "",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="ml-1" size={14} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows?.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-md text-gray-700"
                        style={{
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-4 text-gray-500"
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">Show</span>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600 ml-2">entries</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft size={18} className="text-gray-600" />
          </button>
          <button
            className="p-1 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft size={18} className="text-gray-600" />
          </button>

          <div className="flex items-center gap-1 mx-2">
            <span className="text-sm text-gray-600">
              Page{" "}
              <strong>
                {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount() || 1}
              </strong>
            </span>
          </div>

          <button
            className="p-1 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight size={18} className="text-gray-600" />
          </button>
          <button
            className="p-1 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight size={18} className="text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
