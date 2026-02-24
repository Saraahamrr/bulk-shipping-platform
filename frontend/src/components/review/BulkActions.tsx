// frontend/src/components/review/BulkActions.tsx
import React, { useState } from 'react';
import { useApp } from '@/src/context/AppContext';
import * as api from '@/src/services/api';
import toast from 'react-hot-toast';

interface BulkActionsProps {
  selectedIds: number[];
}

const BulkActions: React.FC<BulkActionsProps> = ({ selectedIds }) => {
  const { savedAddresses, savedPackages, setShipments, shipments } = useApp();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);

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

  const handleAddressSelect = async (addressId: string) => {
    const address = savedAddresses.find(a => a.id === Number(addressId));
    if (!address) return;

    try {
      const response = await api.bulkUpdateShipments({
        record_ids: selectedIds,
        from_first_name: address.first_name,
        from_last_name: address.last_name,
        from_address: address.address_line1,
        from_address2: address.address_line2,
        from_city: address.city,
        from_state: address.state,
        from_zip: address.zip_code,
      });

      // Update local state
      const updatedIds = response.data.map((r: any) => r.id);
      setShipments(shipments.map(s => 
        updatedIds.includes(s.id) ? response.data.find((r: any) => r.id === s.id) : s
      ));

      toast.success(`Updated ${selectedIds.length} shipments`);
      setShowAddressModal(false);
    } catch (error) {
      toast.error('Failed to update shipments');
    }
  };

  const handlePackageSelect = async (packageId: string) => {
    const pkg = savedPackages.find(p => p.id === Number(packageId));
    if (!pkg) return;

    try {
      const response = await api.bulkUpdateShipments({
        record_ids: selectedIds,
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
        weight_lbs: pkg.weight_lbs,
        weight_oz: pkg.weight_oz,
      });

      // Update local state
      const updatedIds = response.data.map((r: any) => r.id);
      setShipments(shipments.map(s => 
        updatedIds.includes(s.id) ? response.data.find((r: any) => r.id === s.id) : s
      ));

      toast.success(`Updated ${selectedIds.length} shipments`);
      setShowPackageModal(false);
    } catch (error) {
      toast.error('Failed to update shipments');
    }
  };

  return (
    <>
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-600">
          {selectedIds.length} selected
        </span>
        
        <button
          onClick={() => setShowAddressModal(true)}
          className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
        >
          Change Address
        </button>
        
        <button
          onClick={() => setShowPackageModal(true)}
          className="px-3 py-1 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100"
        >
          Change Package
        </button>
        
        <button
          onClick={handleDeleteSelected}
          className="px-3 py-1 text-sm bg-red-50 text-red-700 rounded hover:bg-red-100"
        >
          Delete Selected
        </button>
      </div>

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Select Ship From Address</h3>
            <div className="space-y-2">
              {savedAddresses.map(address => (
                <button
                  key={address.id}
                  onClick={() => handleAddressSelect(address.id!.toString())}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="font-medium">{address.name}</div>
                  <div className="text-sm text-gray-600">
                    {address.address_line1}
                    {address.address_line2 && `, ${address.address_line2}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {address.city}, {address.state} {address.zip_code}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAddressModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package Selection Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Select Package</h3>
            <div className="space-y-2">
              {savedPackages.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => handlePackageSelect(pkg.id!.toString())}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="font-medium">{pkg.name}</div>
                  <div className="text-sm text-gray-600">
                    {pkg.length}x{pkg.width}x{pkg.height} inches
                  </div>
                  <div className="text-sm text-gray-600">
                    Weight: {pkg.weight_lbs} lb {pkg.weight_oz} oz
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowPackageModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActions;