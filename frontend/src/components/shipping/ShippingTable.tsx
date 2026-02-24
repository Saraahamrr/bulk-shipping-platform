// frontend/src/components/shipping/ShippingTable.tsx
import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';
import { useApp } from '@/src/context/AppContext';
import { ShipmentRecord } from '@/src/types/index';
import { SavedAddress, SavedPackage } from '@/src/types';
import * as api from '@/src/services/api';
import toast from 'react-hot-toast';
import { TrashIcon } from '@heroicons/react/24/outline';

const ShippingTable: React.FC = () => {
  const { shipments, setShipments, selectedRows, setSelectedRows } = useApp();
  const [sorting, setSorting] = useState<SortingState>([]);

  const handleServiceChange = async (id: number, service: string) => {
    try {
      const response = await api.updateShipment(id, { shipping_service: service });
      setShipments(shipments.map(s => s.id === id ? response.data : s));
    } catch (error) {
      toast.error('Failed to update shipping service');
    }
  };

  const handleBulkServiceChange = async (service: string) => {
    try {
      const response = await api.bulkUpdateShipments({
        record_ids: selectedRows,
        shipping_service: service,
      });
      
      // Update local state
      const updatedIds = response.data.map((r: any) => r.id);
      setShipments(shipments.map(s => 
        updatedIds.includes(s.id) ? response.data.find((r: any) => r.id === s.id) : s
      ));
      
      toast.success(`Updated ${selectedRows.length} shipments`);
    } catch (error) {
      toast.error('Failed to update shipping services');
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
        id: 'shipping',
        header: 'Shipping Service',
        cell: ({ row }) => {
          const shipment = row.original;
          const groundPrice = shipment.calculate_shipping_price?.() || 
            (shipment.shipping_service === 'ground' ? shipment.shipping_price : 
            2.50 + ((shipment.weight_lbs * 16 + shipment.weight_oz) * 0.05));
          const priorityPrice = shipment.calculate_shipping_price?.() || 
            (shipment.shipping_service === 'priority' ? shipment.shipping_price : 
            5.00 + ((shipment.weight_lbs * 16 + shipment.weight_oz) * 0.10));

          return (
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`service-${shipment.id}`}
                  value="ground"
                  checked={shipment.shipping_service === 'ground'}
                  onChange={() => handleServiceChange(shipment.id, 'ground')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">
                  Ground Shipping - ${groundPrice.toFixed(2)}
                </span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`service-${shipment.id}`}
                  value="priority"
                  checked={shipment.shipping_service === 'priority'}
                  onChange={() => handleServiceChange(shipment.id, 'priority')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">
                  Priority Mail - ${priorityPrice.toFixed(2)}
                </span>
              </label>
            </div>
          );
        },
      },
      {
        id: 'price',
        header: 'Price',
        cell: ({ row }) => (
          <div className="text-sm font-medium text-gray-900">
            ${row.original.shipping_price.toFixed(2)}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            onClick={() => handleDelete(row.original.id)}
            className="text-red-600 hover:text-red-800"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        ),
      },
    ],
    []
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

  const table = useReactTable({
    data: shipments,
    columns,
    state: {
      sorting,
      rowSelection: Object.fromEntries(selectedRows.map(id => [id, true])),
    },
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === 'function' 
        ? updater(Object.fromEntries(selectedRows.map(id => [id, true])))
        : updater;
      setSelectedRows(Object.keys(newSelection).map(Number));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  });

  return (
    <div className="space-y-4">
      {selectedRows.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedRows.length} shipments selected
            </span>
            <div className="flex space-x-3">
              <button
                onClick={() => handleBulkServiceChange('ground')}
                className="px-3 py-1 text-sm bg-white text-blue-700 border border-blue-300 rounded hover:bg-blue-50"
              >
                Set to Ground
              </button>
              <button
                onClick={() => handleBulkServiceChange('priority')}
                className="px-3 py-1 text-sm bg-white text-blue-700 border border-blue-300 rounded hover:bg-blue-50"
              >
                Set to Priority
              </button>
              <button
                onClick={() => handleBulkServiceChange('cheapest')}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Use Most Affordable
              </button>
            </div>
          </div>
        </div>
      )}

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
                    {flexRender(header.column.columnDef.header, header.getContext())}
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
    </div>
  );
};

export default ShippingTable;