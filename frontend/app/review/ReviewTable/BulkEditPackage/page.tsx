'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useApp } from '@/app/context/AppContext';
import { ShipmentRecord } from '@/src/types/index';
import { useRouter, useSearchParams } from 'next/navigation';
import * as api from '@/src/services/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface BulkPackageFormData {
  length: number;
  width: number;
  height: number;
  weight_lbs: number;
  weight_oz: number;
}

const BulkEditPackagePage = () => {
  const { savedPackages, shipments, setShipments } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<BulkPackageFormData>({
    defaultValues: {
      length: 0,
      width: 0,
      height: 0,
      weight_lbs: 0,
      weight_oz: 0,
    },
  });

  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      const idArray = ids.split(',').map(Number);
      setSelectedIds(idArray);
    }
    setLoading(false);
  }, [searchParams]);

  const handlePackageSelect = (packageId: string) => {
    const pkg = savedPackages.find(p => p.id === Number(packageId));
    if (!pkg) return;

    setValue('length', Number(pkg.length));
    setValue('width', Number(pkg.width));
    setValue('height', Number(pkg.height));
    setValue('weight_lbs', pkg.weight_lbs);
    setValue('weight_oz', pkg.weight_oz);
  };

  const onSubmit = async (data: BulkPackageFormData) => {
    if (selectedIds.length === 0) return;

    try {
      // FIXED: Correct API call format
      const response = await api.bulkUpdateShipments(selectedIds, {
        length: data.length,
        width: data.width,
        height: data.height,
        weight_lbs: data.weight_lbs,
        weight_oz: data.weight_oz
      });

      // Update context with updated shipments
      const updatedShipments = response.data;
      setShipments(shipments.map(s => {
        const updated = updatedShipments.find((u: ShipmentRecord) => u.id === s.id);
        return updated || s;
      }));

      toast.success(`Updated ${selectedIds.length} shipments successfully`);
      router.push('/review/ReviewTable');
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('Failed to update shipments');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/review/ReviewTable"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Review
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Edit Package Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            Editing {selectedIds.length} selected shipments
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Saved Packages */}
            {savedPackages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Use Saved Package
                </label>
                <select
                  onChange={(e) => handlePackageSelect(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a saved package</option>
                  {savedPackages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.length}x{pkg.width}x{pkg.height})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  This will update package details for all selected shipments
                </p>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ This will update package details for all {selectedIds.length} selected shipments.
              </p>
            </div>

            {/* Dimensions */}
            <div>
              <h3 className="font-medium mb-3 text-gray-900">Package Dimensions (inches)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Length</label>
                  <input
                    {...register('length', { 
                      valueAsNumber: true,
                      required: 'Length is required',
                      min: { value: 0.1, message: 'Length must be greater than 0' }
                    })}
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.length && (
                    <p className="mt-1 text-xs text-red-600">{errors.length.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Width</label>
                  <input
                    {...register('width', { 
                      valueAsNumber: true,
                      required: 'Width is required',
                      min: { value: 0.1, message: 'Width must be greater than 0' }
                    })}
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.width && (
                    <p className="mt-1 text-xs text-red-600">{errors.width.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Height</label>
                  <input
                    {...register('height', { 
                      valueAsNumber: true,
                      required: 'Height is required',
                      min: { value: 0.1, message: 'Height must be greater than 0' }
                    })}
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.height && (
                    <p className="mt-1 text-xs text-red-600">{errors.height.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Weight */}
            <div>
              <h3 className="font-medium mb-3 text-gray-900">Weight</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Pounds (lbs)</label>
                  <input
                    {...register('weight_lbs', { 
                      valueAsNumber: true,
                      required: 'Weight is required',
                      min: { value: 0, message: 'Weight cannot be negative' }
                    })}
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.weight_lbs && (
                    <p className="mt-1 text-xs text-red-600">{errors.weight_lbs.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ounces (oz)</label>
                  <input
                    {...register('weight_oz', { 
                      valueAsNumber: true,
                      min: { value: 0, message: 'Ounces cannot be negative' },
                      max: { value: 15.9, message: 'Ounces must be less than 16' }
                    })}
                    type="number"
                    step="0.1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.weight_oz && (
                    <p className="mt-1 text-xs text-red-600">{errors.weight_oz.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Link
                href="/review/ReviewTable"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update {selectedIds.length} Shipments
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BulkEditPackagePage;