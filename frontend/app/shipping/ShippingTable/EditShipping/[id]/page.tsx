// app/review/ReviewTable/EditShipping/[id]/page.tsx
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

// Common shipping services
const SHIPPING_SERVICES = [
  'USPS First Class',
  'USPS Priority Mail',
  'USPS Priority Mail Express',
  'UPS Ground',
  'UPS 2nd Day Air',
  'UPS Next Day Air',
  'FedEx Ground',
  'FedEx 2Day',
  'FedEx Priority Overnight',
  'DHL Express',
  'DHL Ground',
];

const SHIPMENT_STATUSES = [
  'pending',
  'processed',
  'error',
  'shipped',
  'delivered',
  'cancelled',
  'on hold',
];

interface ShippingFormData {
  shipping_service: string;
  shipping_price: string;
  status: string;
}

const EditShippingPage = () => {
  const { shipments, setShipments } = useApp();
  const router = useRouter();
  const params = useParams();
  const [shipment, setShipment] = useState<ShipmentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ShippingFormData>({
    defaultValues: {
      shipping_service: '',
      shipping_price: '',
      status: '',
    },
  });

  useEffect(() => {
    const id = Number(params.id);
    const foundShipment = shipments.find(s => s.id === id);
    
    if (foundShipment) {
      setShipment(foundShipment);
      setValue('shipping_service', foundShipment.shipping_service || '');
      setValue('shipping_price', foundShipment.shipping_price?.toString() || '');
      setValue('status', foundShipment.status || '');
      setLoading(false);
    } else {
      fetchShipment(id);
    }
  }, [params.id, shipments, setValue]);

  const fetchShipment = async (id: number) => {
    try {
      const response = await api.getshipment(id);
      setShipment(response.data);
      setValue('shipping_service', response.data.shipping_service || '');
      setValue('shipping_price', response.data.shipping_price?.toString() || '');
      setValue('status', response.data.status || '');
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load shipment');
      router.push('/shipping/ShippingTable');
    }
  };

  const onSubmit = async (data: ShippingFormData) => {
    if (!shipment) return;

    try {
      const updateData = {
        shipping_service: data.shipping_service,
        shipping_price: data.shipping_price ? parseFloat(data.shipping_price) : undefined,
        status: data.status,
      };

      const response = await api.updateShipment(shipment.id, updateData);
      
      setShipments(shipments.map(s => 
        s.id === shipment.id ? response.data : s
      ));
      
      toast.success('Shipping details updated successfully');
      router.push('/shipping/ShippingTable');
    } catch (error) {
      toast.error('Failed to update shipping details');
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
            href="/shipping/ShippingTable"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Shipping Services
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Shipping Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            Order #{shipment.order_no}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Shipping Service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Service
              </label>
              <select
                {...register('shipping_service', { required: 'Shipping service is required' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select shipping service</option>
                {SHIPPING_SERVICES.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
              {errors.shipping_service && (
                <p className="mt-1 text-xs text-red-600">{errors.shipping_service.message}</p>
              )}
            </div>

            {/* Shipping Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('shipping_price', { 
                  required: 'Shipping price is required',
                  min: { value: 0, message: 'Price must be 0 or greater' }
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
              {errors.shipping_price && (
                <p className="mt-1 text-xs text-red-600">{errors.shipping_price.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                {...register('status', { required: 'Status is required' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select status</option>
                {SHIPMENT_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>
              )}
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
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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

export default EditShippingPage;