// frontend/src/components/shipping/ShippingTable.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  PaginationState  
} from '@tanstack/react-table';
import { useApp } from '@/app/context/AppContext';
import { ShipmentRecord } from '@/src/types/index';
import * as api from '@/src/services/api';
import toast from 'react-hot-toast';
import { 
  TrashIcon, 
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import StepHeader from '@/src/components/uploadHeader';
import BulkshippingActions from '@/app/shipping/BulkshippingActions';
import axios from 'axios';
import { useRouter } from 'next/navigation'; 


// Helper function to truncate text
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};


const ShippingTable: React.FC = () => {
  const { shipments, setShipments, selectedRows, setSelectedRows, setCurrentStep, updateShipmentById } = useApp();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });
  const router = useRouter();
   const handleServiceChange = async (id: number, service: string) => {
    try {
      const response = await api.updateShipment(id, { shipping_service: service });
      updateShipmentById(id, response.data); // Use updateShipmentById
      toast.success(`Shipping service updated to ${service}`);
    } catch (error) {
      toast.error('Failed to update shipping service');
    }
  };

  // const handleBulkServiceChange = async (service: string) => {
  //   try {
  //     const response = await api.bulkUpdateShipments(
  //       selectedRows,
  //       {
  //         shipping_service: service
  //       }
  //     );
      
  //     // Update local state
  //     const updatedIds = response.data.map((r: any) => r.id);
  //     setShipments(shipments.map(s => 
  //       updatedIds.includes(s.id) ? response.data.find((r: any) => r.id === s.id) : s
  //     ));
      
  //     toast.success(`Updated ${selectedRows.length} shipments to ${service}`);
  //   } catch (error) {
  //     toast.error('Failed to update shipping services');
  //   }
  // };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this shipment?')) return;
    
    try {
      await api.deleteShipment(id);
      setShipments(shipments.filter(s => s.id !== id));
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
      toast.success('Shipment deleted');
    } catch (error) {
      toast.error('Failed to delete shipment');
    }
  };


  const columns = useMemo<ColumnDef<ShipmentRecord>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        ),
        size: 50,
      },
      {
        accessorKey: 'order_no',
        header: 'Order #',
        cell: info => {
          const value = info.getValue<string>();
          return (
            <div className="text-sm font-medium text-gray-900" title={value}>
              {truncateText(value, 15)}
            </div>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'to_address_formatted',
        header: 'Ship To',
        cell: info => {
          const value = info.getValue<string>();
          return (
            <div className="text-sm text-gray-900" title={value}>
              {truncateText(value, 30)}
            </div>
          );
        },
        size: 200,
      },
      {
        accessorKey: 'package_details',
        header: 'Package',
        cell: info => {
          const value = info.getValue<string>();
          return (
            <div className="text-sm text-gray-600" title={value}>
              {truncateText(value, 20)}
            </div>
          );
        },
        size: 150,
      },
      {
        accessorKey: 'shipping_service',
        header: 'Shipping Service',
        cell: info => {
          const service = info.getValue<string>();
          return (
            <span className={`px-2 py-1 text-xs rounded-full inline-block text-center ${
              service === 'ground' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {service || 'Not set'}
            </span>
          );
        },
        size: 100,
      },{
      accessorKey: 'price',
              header: 'Price',
              cell: info => {
                const shipment = info.row.original as ShipmentRecord;
                const service = shipment.shipping_service;
                const price = shipment.shipping_price;
                return (
                  <span className="px-2 py-1 text-xs rounded-full inline-block text-center bg-gray-100 text-gray-800">
                    ${price}
                  </span>
                );
              },
              size: 100,
            },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: info => {
          const status = info.getValue<string>();
          const colors = {
            pending: 'bg-yellow-100 text-yellow-800',
            processed: 'bg-green-100 text-green-800',
            error: 'bg-red-100 text-red-800',
          };
          return (
            <span className={`px-2 py-1 text-xs rounded-full inline-block text-center ${colors[status as keyof typeof colors] || colors.pending}`}>
              {truncateText(status, 10)}
            </span>
          );
        },
        size: 100,
      },
     
    ],
    []
  );

  // Create the table instance with pagination
  const table = useReactTable({
    data: shipments,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
      rowSelection: Object.fromEntries(selectedRows.map(id => [id, true])),
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' 
        ? updater(Object.fromEntries(selectedRows.map(id => [id, true])))
        : updater;
      setSelectedRows(Object.keys(newSelection).map(Number));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
  });

  // Check if all selected shipments have shipping service
  const canProceedToPurchase = () => {
    const selectedShipments = shipments.filter(s => selectedRows.includes(s.id));
    return selectedShipments.length > 0 && selectedShipments.every(s => s.shipping_service);
  };

  const handleProceedToPurchase = () => {
    if (!canProceedToPurchase()) {
      if (selectedRows.length === 0) {
        toast.error('Please select at least one shipment');
      } else {
        toast.error('Please select shipping service for all selected shipments');
      }
      return;
    }
    
  };

  return (
    <div className="space-y-4">
      <StepHeader />
      
      {/* Header with search and bulk actions */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search shipments..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* {selectedRows.length > 0 && (
          <BulkshippingActions 
            selectedIds={selectedRows} 
            onBulkServiceChange={handleBulkServiceChange}
          />
        )} */}
      </div>

      {/* Table with fixed layout */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={header.column.getCanSort() ? 'cursor-pointer select-none flex items-center' : ''}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <span className="ml-1">↑</span>,
                            desc: <span className="ml-1">↓</span>,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map(row => (
                <tr 
                  key={row.id} 
                  className={`
                    ${row.getIsSelected() ? 'bg-blue-50' : ''} 
                    hover:bg-gray-50 transition-colors
                  `}
                >
                  {row.getVisibleCells().map(cell => (
                    <td 
                      key={cell.id} 
                      className="px-4 py-3 whitespace-nowrap"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination and Navigation Footer */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left side - Stats */}
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                shipments.length
              )}
            </span>{' '}
            of <span className="font-medium">{shipments.length}</span> shipments
            {selectedRows.length > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({selectedRows.length} selected)
              </span>
            )}
          </div>

          {/* Center - Page navigation */}
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="First page"
            >
              <ChevronDoubleLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            
            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: table.getPageCount() }, (_, i) => i + 1)
                .filter(pageNum => {
                  const currentPage = table.getState().pagination.pageIndex + 1;
                  const totalPages = table.getPageCount();
                  return (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    Math.abs(pageNum - currentPage) <= 2
                  );
                })
                .map((pageNum, index, array) => {
                  if (index > 0 && pageNum - array[index - 1] > 1) {
                    return (
                      <React.Fragment key={`ellipsis-${pageNum}`}>
                        <span className="px-3 py-2 text-gray-400">...</span>
                        <button
                          onClick={() => table.setPageIndex(pageNum - 1)}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            table.getState().pagination.pageIndex === pageNum - 1
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      </React.Fragment>
                    );
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => table.setPageIndex(pageNum - 1)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        table.getState().pagination.pageIndex === pageNum - 1
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
            </div>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Last page"
            >
              <ChevronDoubleRightIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Right side - Navigation buttons and page size selector */}
          <div className="flex items-center space-x-4">
            {/* Page size selector */}
            <select
              value={table.getState().pagination.pageSize}
              onChange={e => {
                table.setPageSize(Number(e.target.value));
              }}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {[15, 25, 50, 100].map(pageSize => (  
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </select>

            {/* Navigation buttons */}
            <div className="flex space-x-2 border-l pl-4">
              <button
                onClick={() => {
                  router.push('/shipping/ShippingTable');
                  setCurrentStep(3);
                }}
                className="flex items-center px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Back to Shipments
              </button>
              <button
                onClick={handleProceedToPurchase}
                className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedRows.length === 0}
              >
                Proceed to Purchase
                <TruckIcon className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Warning if selected shipments don't have shipping service */}
        {selectedRows.length > 0 && shipments.filter(s => selectedRows.includes(s.id)).some(s => !s.shipping_service) && (
          <div className="mt-3 text-sm text-yellow-600 flex items-center justify-center">
            <span className="bg-yellow-50 px-3 py-1 rounded-full">
              ⚠️ Some selected shipments don't have a shipping service selected. Please select one before proceeding.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingTable;