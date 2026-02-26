'use client';

import React, { useEffect, useState, Suspense } from 'react';
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

// Separate component that uses useSearchParams
const BulkEditPackageContent = () => {
  const { savedPackages, shipments, setShipments } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [packageName, setPackageName] = useState('');

  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<BulkPackageFormData>({
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

  const handleSaveToFavorites = async () => {
    const formData = getValues();
    
    // Validate required fields
    if (!formData.length || !formData.width || !formData.height || 
        (formData.weight_lbs === 0 && formData.weight_oz === 0)) {
      toast.error('Please fill in all package details first');
      return;
    }

    setShowSaveDialog(true);
  };

  const confirmSavePackage = async () => {
    if (!packageName.trim()) {
      toast.error('Please enter a name for this package');
      return;
    }
    

    const formData = getValues();

    try {
      const packageData = {
        name: packageName.trim(),
        length: formData.length,
        width: formData.width,
        height: formData.height,
        weight_lbs: formData.weight_lbs,
        weight_oz: formData.weight_oz,
      };

      // Call API to save package
      await api.createSavedPackage(packageData);
      
      toast.success('Package saved to favorites');
      setShowSaveDialog(false);
      setPackageName('');
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Failed to save package');
    }
  };

  const onSubmit = async (data: BulkPackageFormData) => {
    if (selectedIds.length === 0) return;

    try {
      const response = await api.bulkUpdateShipments(selectedIds, {
        length: data.length,
        width: data.width,
        height: data.height,
        weight_lbs: data.weight_lbs,
        weight_oz: data.weight_oz
      });

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
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-900">Package Dimensions (inches)</h3>
                <button
                  type="button"
                  onClick={handleSaveToFavorites}
                  className="inline-flex items-center px-3 py-1 text-sm text-yellow-600 hover:text-yellow-700 border border-yellow-300 rounded-md hover:bg-yellow-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Add to Favorites
                </button>
              </div>
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

      {/* Save Package Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Save Package to Favorites</h3>
            <p className="text-sm text-gray-500 mb-4">
              Give this package a name to easily use it again later.
            </p>
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="e.g., Small Box, Large Envelope, etc."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <div className="text-sm text-gray-500 mb-4">
              <p>Dimensions: {getValues().length}" x {getValues().width}" x {getValues().height}"</p>
              <p>Weight: {getValues().weight_lbs} lbs {getValues().weight_oz} oz</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setPackageName('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSavePackage}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Save Package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main page component with Suspense boundary
const BulkEditPackagePage = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <BulkEditPackageContent />
    </Suspense>
  );
};

export default BulkEditPackagePage;