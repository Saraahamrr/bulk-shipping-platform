// frontend/src/components/review/BulkActions.tsx
'use client';
import React from 'react';
import { useApp } from '@/app/context/AppContext';
import * as api from '@/src/services/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface BulkshippingActionsProps {
  selectedIds: number[];
}

const BulkshippingActions: React.FC<BulkshippingActionsProps> = ({ selectedIds }) => {
  const { setShipments, shipments } = useApp();
  const router = useRouter();

  
  // NEW: Bulk edit shipping details
  const handleBulkEditShipping = () => {
    const idsParam = selectedIds.join(',');
    router.push(`/shipping/ShippingTable/BulkEditShipping?ids=${idsParam}`);
  };

  return (
    <div className="flex items-center space-x-3 bg-blue-50 px-4 py-2 rounded-lg">
      <span className="text-sm font-medium text-blue-700">
        {selectedIds.length} selected
      </span>
      
      <div className="h-4 w-px bg-blue-200" />
      
      
  
      
      {/* NEW: Bulk Edit Shipping Button */} 
      <button
        onClick={handleBulkEditShipping}
        className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 transition-colors flex items-center"
      >
        <span>Bulk Edit Shipping</span>
      </button>
      

    </div>
  );
};

export default BulkshippingActions;