// frontend/src/components/review/BulkActions.tsx
'use client';
import React from 'react';
import { useApp } from '@/app/context/AppContext';
import * as api from '@/src/services/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface BulkActionsProps {
  selectedIds: number[];
}

const BulkActions: React.FC<BulkActionsProps> = ({ selectedIds }) => {
  const { setShipments, shipments } = useApp();
  const router = useRouter();

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} shipments?`)) return;
    
    try {
      await api.bulkDeleteShipments(selectedIds);
      setShipments(shipments.filter(s => !selectedIds.includes(s.id)));
      toast.success(`${selectedIds.length} shipments deleted`);
    } catch (error) {
      toast.error('Failed to delete shipments');
    }
  };

  const handleBulkEditAddress = () => {
    const idsParam = selectedIds.join(',');
    router.push(`/review/ReviewTable/BulkEditAddress?ids=${idsParam}`);
  };

  const handleBulkEditPackage = () => {
    const idsParam = selectedIds.join(',');
    router.push(`/review/ReviewTable/BulkEditPackage?ids=${idsParam}`);
  };

  // // NEW: Bulk edit shipping details
  // const handleBulkEditShipping = () => {
  //   const idsParam = selectedIds.join(',');
  //   router.push(`/review/ReviewTable/BulkEditShipping?ids=${idsParam}`);
  // };

  return (
    <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-lg">
      <span className="text-sm font-medium text-blue-700">
        {selectedIds.length} selected
      </span>
      
      <div className="h-4 w-px bg-blue-200" />
      
      <button
        onClick={handleBulkEditAddress}
        className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors flex items-center"
      >
        <span>Bulk Edit Address</span>
      </button>
      
      <button
        onClick={handleBulkEditPackage}
        className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-md hover:bg-green-700 transition-colors flex items-center"
      >
        <span>Bulk Edit Package</span>
      </button>
      
      {/* NEW: Bulk Edit Shipping Button */}
      {/* <button
        onClick={handleBulkEditShipping}
        className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 transition-colors flex items-center"
      >
        <span>Bulk Edit Shipping</span>
      </button> */}
      
      <button
        onClick={handleDeleteSelected}
        className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors flex items-center"
      >
        <span>Delete Selected</span>
      </button>
    </div>
  );
};

export default BulkActions;