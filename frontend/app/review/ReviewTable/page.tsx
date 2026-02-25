"use client";

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { useApp } from '@/app/context/AppContext';
import { ShipmentRecord } from '@/src/types/index';
import * as api from '@/src/services/api';
import toast from 'react-hot-toast';
import { PencilIcon, TrashIcon, MagnifyingGlassIcon, CubeIcon } from '@heroicons/react/24/outline';
import BulkActions from '../BulkActions';
import { useRouter } from 'next/navigation';

const ReviewTable: React.FC = () => {
  const { shipments, setShipments, selectedRows, setSelectedRows } = useApp();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [editingShipment, setEditingShipment] = useState<ShipmentRecord | null>(null);
  const router = useRouter();

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
      },
      {
        accessorKey: 'from_address_formatted',
        header: 'Ship From',
        cell: info => (
          <div className="text-sm text-gray-900">
            {info.getValue<string>() || <span className="text-gray-400">Not provided</span>}
          </div>
        ),
      },
      {
        accessorKey: 'to_address_formatted',
        header: 'Ship To',
        cell: info => (
          <div className="text-sm text-gray-900">{info.getValue<string>()}</div>
        ),
      },
      {
        accessorKey: 'package_details',
        header: 'Package',
        cell: info => (
          <div className="text-sm text-gray-600">{info.getValue<string>()}</div>
        ),
      },
      {
        accessorKey: 'order_no',
        header: 'Order #',
        cell: info => (
          <div className="text-sm font-medium text-gray-900">{info.getValue<string>()}</div>
        ),
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
            <span className={`px-2 py-1 text-xs rounded-full ${colors[status as keyof typeof colors] || colors.pending}`}>
              {status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex space-x-2">
            <button
              onClick={() => setEditingShipment(row.original)}
              className="text-blue-600 hover:text-blue-800"
              title="Edit Address"
              type="button"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push(`/review/ReviewTable/EditPackage/${row.original.id}`)}
              className="text-green-600 hover:text-green-800"
              title="Edit Package"
              type="button"
            >
              <CubeIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="text-red-600 hover:text-red-800"
              title="Delete"
              type="button"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [router] // Add router to dependencies
  );

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this shipment?')) return;
    
    try {
      await api.deleteShipment(id);
      setShipments(shipments.filter(s => s.id !== id));
      toast.success('Shipment deleted');
    } catch (error) {
      toast.error('Failed to delete shipment');
    }
  };

  const handleSaveEdit = async (updatedData: Partial<ShipmentRecord>) => {
    if (!editingShipment) return;
    
    try {
      const response = await api.updateShipment(editingShipment.id, updatedData);
      setShipments(shipments.map(s => 
        s.id === editingShipment.id ? response.data : s
      ));
      toast.success('Shipment updated');
      setEditingShipment(null);
    } catch (error) {
      toast.error('Failed to update shipment');
    }
  };
  const handleEditPackageClick = (shipment: ShipmentRecord) => {
    // pass shipment id or data as query param
    router.push(`/review/ReviewTable/EditPackage/${shipment.id}`);
  };

  // Create the table instance
  const table = useReactTable({
    data: shipments,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection: Object.fromEntries(selectedRows.map(id => [id, true])),
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' 
        ? updater(Object.fromEntries(selectedRows.map(id => [id, true])))
        : updater;
      setSelectedRows(Object.keys(newSelection).map(Number));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
  });

  return (
    <div className="space-y-4">
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
        
        {selectedRows.length > 0 && (
          <BulkActions selectedIds={selectedRows} />
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
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
              <tr key={row.id} className={row.getIsSelected() ? 'bg-blue-50' : ''}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* {editingShipment && editMode === 'address' && (
        <EditAddressModal
          shipment={editingShipment}
          onSave={handleSaveEdit}
          onClose={() => setEditingShipment(null)}
        />
      )}  */}
      {/* {shipments.map((shipment) => (
        <div key={shipment.id}>
          <span>{shipment.id}</span>
          <button onClick={() => handleEditPackageClick(shipment)}>
            Edit Package
          </button>
        </div>
      ))} */}
    </div>
  );
};

export default ReviewTable;