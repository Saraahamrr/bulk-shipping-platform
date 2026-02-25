'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useApp } from '@/app/context/AppContext';
import { ShipmentRecord } from '@/src/types/index';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EditPackageModalProps {
  shipment: ShipmentRecord;
  onSave: (data: Partial<ShipmentRecord>) => void;
  onClose: () => void;
}

const EditPackageModal: React.FC<EditPackageModalProps> = ({
  shipment,
  onSave,
  onClose,
}) => {
  const { savedPackages } = useApp();
  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      length: shipment.length,
      width: shipment.width,
      height: shipment.height,
      weight_lbs: shipment.weight_lbs,
      weight_oz: shipment.weight_oz,
    },
  });

  const handlePackageSelect = (packageId: string) => {
    const pkg = savedPackages.find(p => p.id === Number(packageId));
    if (!pkg) return;

    setValue('length', pkg.length);
    setValue('width', pkg.width);
    setValue('height', pkg.height);
    setValue('weight_lbs', pkg.weight_lbs);
    setValue('weight_oz', pkg.weight_oz);
  };

  const onSubmit = (data: any) => {
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Edit Package Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Saved Packages */}
            {savedPackages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Use Saved Package
                </label>
                <select
                  onChange={(e) => handlePackageSelect(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select a saved package</option>
                  {savedPackages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Dimensions */}
            <div>
              <h3 className="font-medium mb-3">Package Dimensions (inches)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Length</label>
                  <input
                    {...register('length', { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Width</label>
                  <input
                    {...register('width', { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Height</label>
                  <input
                    {...register('height', { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Weight */}
            <div>
              <h3 className="font-medium mb-3">Weight</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Pounds (lbs)</label>
                  <input
                    {...register('weight_lbs', { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ounces (oz)</label>
                  <input
                    {...register('weight_oz', { valueAsNumber: true })}
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPackageModal;