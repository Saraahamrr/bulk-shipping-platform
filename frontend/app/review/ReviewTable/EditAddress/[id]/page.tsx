'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useApp } from '@/app/context/AppContext';
import { ShipmentRecord } from '@/src/types/index';
import { useRouter, useParams } from 'next/navigation';
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

interface AddressFormData {
  from_first_name: string;
  from_last_name: string;
  from_address: string;
  from_address2: string;
  from_city: string;
  from_state: string;
  from_zip: string;
  to_first_name: string;
  to_last_name: string;
  to_address: string;
  to_address2: string;
  to_city: string;
  to_state: string;
  to_zip: string;
  phone_num1: string;
  phone_num2: string;
}

const EditAddressPage = () => {
  const { savedAddresses, shipments, setShipments } = useApp();
  const router = useRouter();
  const params = useParams();
  const [shipment, setShipment] = useState<ShipmentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<AddressFormData>({
    defaultValues: {
      from_first_name: '',
      from_last_name: '',
      from_address: '',
      from_address2: '',
      from_city: '',
      from_state: '',
      from_zip: '',
      to_first_name: '',
      to_last_name: '',
      to_address: '',
      to_address2: '',
      to_city: '',
      to_state: '',
      to_zip: '',
      phone_num1: '',
      phone_num2: '',
    },
  });

  useEffect(() => {
    const id = Number(params.id);
    // Find shipment in context
    const foundShipment = shipments.find(s => s.id === id);
    
    if (foundShipment) {
      setShipment(foundShipment);
      setValue('from_first_name', foundShipment.from_first_name || '');
      setValue('from_last_name', foundShipment.from_last_name || '');
      setValue('from_address', foundShipment.from_address || '');
      setValue('from_address2', foundShipment.from_address2 || '');
      setValue('from_city', foundShipment.from_city || '');
      setValue('from_state', foundShipment.from_state || '');
      setValue('from_zip', foundShipment.from_zip || '');
      setValue('to_first_name', foundShipment.to_first_name || '');
      setValue('to_last_name', foundShipment.to_last_name || '');
      setValue('to_address', foundShipment.to_address || '');
      setValue('to_address2', foundShipment.to_address2 || '');
      setValue('to_city', foundShipment.to_city || '');
      setValue('to_state', foundShipment.to_state || '');
      setValue('to_zip', foundShipment.to_zip || '');
      setValue('phone_num1', foundShipment.phone_num1 || '');
      setValue('phone_num2', foundShipment.phone_num2 || '');
      setLoading(false);
    } else {
      // If not in context, fetch it
      fetchShipment(id);
    }
  }, [params.id, shipments, setValue]);

  const fetchShipment = async (id: number) => {
    try {
      // Assuming you have a getShipmentById endpoint
      const response = await api.getshipment(id);
      setShipment(response.data);
      setValue('from_first_name', response.data.from_first_name || '');
      setValue('from_last_name', response.data.from_last_name || '');
      setValue('from_address', response.data.from_address || '');
      setValue('from_address2', response.data.from_address2 || '');
      setValue('from_city', response.data.from_city || '');
      setValue('from_state', response.data.from_state || '');
      setValue('from_zip', response.data.from_zip || '');
      setValue('to_first_name', response.data.to_first_name || '');
      setValue('to_last_name', response.data.to_last_name || '');
      setValue('to_address', response.data.to_address || '');
      setValue('to_address2', response.data.to_address2 || '');
      setValue('to_city', response.data.to_city || '');
      setValue('to_state', response.data.to_state || '');
      setValue('to_zip', response.data.to_zip || '');
      setValue('phone_num1', response.data.phone_num1 || '');
      setValue('phone_num2', response.data.phone_num2 || '');
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load shipment');
      router.push('/review/ReviewTable');
    }
  };

  const handleAddressSelect = (addressId: string, type: 'from' | 'to') => {
    const address = savedAddresses.find(a => a.id === Number(addressId));
    if (!address) return;

    if (type === 'from') {
      setValue('from_first_name', address.first_name || '');
      setValue('from_last_name', address.last_name || '');
      setValue('from_address', address.address_line1 || '');
      setValue('from_address2', address.address_line2 || '');
      setValue('from_city', address.city || '');
      setValue('from_state', address.state || '');
      setValue('from_zip', address.zip_code || '');
    }
  };

  const onSubmit = async (data: AddressFormData) => {
    if (!shipment) return;

    try {
      const response = await api.updateShipment(shipment.id, data);
      
      // Update context
      setShipments(shipments.map(s => 
        s.id === shipment.id ? response.data : s
      ));
      
      toast.success('Address details updated successfully');
      router.push('/review/ReviewTable');
    } catch (error) {
      toast.error('Failed to update address details');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Shipment not found</p>
        <Link href="/review/ReviewTable" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          Return to Review
        </Link>
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Address Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            Order #{shipment.order_no}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Ship From Address */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 text-gray-900">Ship From Address</h3>
              
              {savedAddresses.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Use Saved Address
                  </label>
                  <select
                    onChange={(e) => handleAddressSelect(e.target.value, 'from')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select a saved address</option>
                    {savedAddresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.name} - {addr.address_line1}, {addr.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

            {/* Ship To Address */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4 text-gray-900">Ship To Address</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    {...register('to_first_name', { required: 'First name is required' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {errors.to_first_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.to_first_name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    {...register('to_last_name', { required: 'Last name is required' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {errors.to_last_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.to_last_name.message}</p>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 1
                </label>
                <input
                  {...register('to_address', { required: 'Address is required' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                {errors.to_address && (
                  <p className="mt-1 text-xs text-red-600">{errors.to_address.message}</p>
                )}
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address Line 2
                </label>
                <input
                  {...register('to_address2')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    {...register('to_city', { required: 'City is required' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {errors.to_city && (
                    <p className="mt-1 text-xs text-red-600">{errors.to_city.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    {...register('to_state', { required: 'State is required' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select</option>
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.to_state && (
                    <p className="mt-1 text-xs text-red-600">{errors.to_state.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    {...register('to_zip', { required: 'ZIP code is required' })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {errors.to_zip && (
                    <p className="mt-1 text-xs text-red-600">{errors.to_zip.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Phone Numbers */}
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
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditAddressPage;