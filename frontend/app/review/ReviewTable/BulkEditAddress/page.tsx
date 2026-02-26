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

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'PR', 'DC'
];

interface BulkAddressFormData {
  from_first_name: string;
  from_last_name: string;
  from_address: string;
  from_address2: string;
  from_city: string;
  from_state: string;
  from_zip: string;
  phone_num1: string;
  phone_num2: string;
}

const BulkEditAddressPage = () => {
  const { savedAddresses, shipments, setShipments } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<BulkAddressFormData>({
    defaultValues: {
      from_first_name: '',
      from_last_name: '',
      from_address: '',
      from_address2: '',
      from_city: '',
      from_state: '',
      from_zip: '',
      phone_num1: '',
      phone_num2: '',
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

  const handleAddressSelect = (addressId: string) => {
    const address = savedAddresses.find(a => a.id === Number(addressId));
    if (!address) return;

    setValue('from_first_name', address.first_name || '');
    setValue('from_last_name', address.last_name || '');
    setValue('from_address', address.address_line1 || '');
    setValue('from_address2', address.address_line2 || '');
    setValue('from_city', address.city || '');
    setValue('from_state', address.state || '');
    setValue('from_zip', address.zip_code || '');
  };

  const onSubmit = async (data: BulkAddressFormData) => {
    if (selectedIds.length === 0) return;

    try {
      // FIXED: Correct API call format
      const response = await api.bulkUpdateShipments(selectedIds, {
        from_first_name: data.from_first_name,
        from_last_name: data.from_last_name,
        from_address: data.from_address,
        from_address2: data.from_address2,
        from_city: data.from_city,
        from_state: data.from_state,
        from_zip: data.from_zip,
        phone_num1: data.phone_num1,
        phone_num2: data.phone_num2
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
          <h1 className="text-2xl font-bold text-gray-900">Bulk Edit Addresses</h1>
          <p className="text-sm text-gray-500 mt-1">
            Editing {selectedIds.length} selected shipments
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Saved Addresses */}
            {savedAddresses.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Use Saved Address
                </label>
                <select
                  onChange={(e) => handleAddressSelect(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a saved address</option>
                  {savedAddresses.map(addr => (
                    <option key={addr.id} value={addr.id}>
                      {addr.name} - {addr.address_line1}, {addr.city}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  This will update the Ship From address for all selected shipments
                </p>
              </div>
            )}

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ This will update the Ship From address and contact information for all {selectedIds.length} selected shipments.
              </p>
            </div>

            {/* Ship From Address */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 text-gray-900">Ship From Address</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    {...register('from_first_name', { required: 'First name is required' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {errors.from_first_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.from_first_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    {...register('from_last_name', { required: 'Last name is required' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {errors.from_last_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.from_last_name.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1
                </label>
                <input
                  {...register('from_address', { required: 'Address is required' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                {errors.from_address && (
                  <p className="mt-1 text-xs text-red-600">{errors.from_address.message}</p>
                )}
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  {...register('from_address2')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    {...register('from_city', { required: 'City is required' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {errors.from_city && (
                    <p className="mt-1 text-xs text-red-600">{errors.from_city.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    {...register('from_state', { required: 'State is required' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select</option>
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.from_state && (
                    <p className="mt-1 text-xs text-red-600">{errors.from_state.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    {...register('from_zip', { required: 'ZIP code is required' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {errors.from_zip && (
                    <p className="mt-1 text-xs text-red-600">{errors.from_zip.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 text-gray-900">Contact Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number 1
                  </label>
                  <input
                    {...register('phone_num1')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number 2
                  </label>
                  <input
                    {...register('phone_num2')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
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

export default BulkEditAddressPage;