// app/review/ReviewTable/BulkEditShipping/page.tsx
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

// Shipping service options with price ranges
const SHIPPING_SERVICES = [
  {
    name: 'Priority Mail',
    priceRange: { min: 4.00, max: 8.00 },
    description: 'Faster delivery (2-3 business days)',
  },
  {
    name: 'Ground Shipping',
    priceRange: { min: 2.00, max: 5.00 },
    description: 'Economy option (5-7 business days)',
  },
  // Additional services for reference
  {
    name: 'USPS First Class',
    priceRange: { min: 3.00, max: 6.00 },
    description: 'USPS First Class Mail',
  },
  {
    name: 'USPS Priority Mail Express',
    priceRange: { min: 15.00, max: 30.00 },
    description: 'Overnight delivery',
  },
  {
    name: 'UPS Ground',
    priceRange: { min: 5.00, max: 12.00 },
    description: 'UPS Ground shipping',
  },
  {
    name: 'UPS 2nd Day Air',
    priceRange: { min: 12.00, max: 25.00 },
    description: '2 business day delivery',
  },
  {
    name: 'UPS Next Day Air',
    priceRange: { min: 20.00, max: 40.00 },
    description: 'Next business day delivery',
  },
  {
    name: 'FedEx Ground',
    priceRange: { min: 5.00, max: 12.00 },
    description: 'FedEx Ground economy',
  },
  {
    name: 'FedEx 2Day',
    priceRange: { min: 12.00, max: 25.00 },
    description: '2 business day delivery',
  },
  {
    name: 'FedEx Priority Overnight',
    priceRange: { min: 20.00, max: 40.00 },
    description: 'Next business day delivery',
  },
  {
    name: 'DHL Express',
    priceRange: { min: 15.00, max: 35.00 },
    description: 'International express',
  },
  {
    name: 'DHL Ground',
    priceRange: { min: 4.00, max: 10.00 },
    description: 'DHL ground economy',
  },
];

const SHIPMENT_STATUSES = [
  'pending',
  'processed',
  'shipped',
  'delivered',
  'cancelled',
  'on hold',
];

interface BulkShippingFormData {
  shipping_service: string;
  shipping_price: string;
  status: string;
  apply_to_all: boolean;
}

const BulkEditShippingPage = () => {
  const { shipments, setShipments } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>('');
  const [priceSuggestion, setPriceSuggestion] = useState<{ min: number; max: number } | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BulkShippingFormData>({
    defaultValues: {
      shipping_service: '',
      shipping_price: '',
      status: '',
      apply_to_all: true,
    },
  });

  const applyToAll = watch('apply_to_all');
  const watchShippingService = watch('shipping_service');

  // Update price suggestion when service changes
  useEffect(() => {
    if (watchShippingService) {
      const service = SHIPPING_SERVICES.find(s => s.name === watchShippingService);
      if (service) {
        setPriceSuggestion(service.priceRange);
        // Optional: Auto-suggest a price in the middle of the range
        const suggestedPrice = ((service.priceRange.min + service.priceRange.max) / 2).toFixed(2);
        setValue('shipping_price', suggestedPrice);
      } else {
        setPriceSuggestion(null);
      }
    } else {
      setPriceSuggestion(null);
    }
  }, [watchShippingService, setValue]);

  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      const idArray = ids.split(',').map(Number);
      setSelectedIds(idArray);
    }
    setLoading(false);
  }, [searchParams]);

  const onSubmit = async (data: BulkShippingFormData) => {
    if (selectedIds.length === 0) return;

    // Prepare update data - only include fields that have values
    const updateData: Partial<ShipmentRecord> = {};
    if (data.shipping_service) updateData.shipping_service = data.shipping_service;
    if (data.shipping_price) updateData.shipping_price = parseFloat(data.shipping_price);
    if (data.status) updateData.status = data.status as ShipmentRecord['status'];

    if (Object.keys(updateData).length === 0) {
      toast.error('Please fill at least one field to update');
      return;
    }

    try {
      const response = await api.bulkUpdateShipments(selectedIds, updateData);

      // Update context with updated shipments
      const updatedShipments = response.data;
      setShipments(shipments.map(s => {
        const updated = updatedShipments.find((u: ShipmentRecord) => u.id === s.id);
        return updated || s;
      }));

      toast.success(`Updated ${selectedIds.length} shipments successfully`);
      router.push('/shipping/ShippingTable');
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
            href="/shipping/ShippingTable"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Shipping Services
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Edit Shipping Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            Editing {selectedIds.length} selected shipments
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Recommended Shipping Options */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Recommended Shipping Options</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-3 rounded border border-blue-100">
                  <p className="font-medium text-blue-900">Priority Mail</p>
                  <p className="text-blue-700">$4.00 - $8.00</p>
                  <p className="text-xs text-blue-600 mt-1">Faster delivery (2-3 business days)</p>
                </div>
                <div className="bg-white p-3 rounded border border-blue-100">
                  <p className="font-medium text-blue-900">Ground Shipping</p>
                  <p className="text-blue-700">$2.00 - $5.00</p>
                  <p className="text-xs text-blue-600 mt-1">Economy option (5-7 business days)</p>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ This will update the shipping details for all {selectedIds.length} selected shipments.
                {applyToAll ? ' All fields will be applied to all shipments.' : ' Only filled fields will be applied.'}
              </p>
            </div>

            {/* Shipping Service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Service
              </label>
              <select
                {...register('shipping_service')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select shipping service (optional)</option>
                {SHIPPING_SERVICES.map(service => (
                  <option key={service.name} value={service.name}>
                    {service.name} (${service.priceRange.min.toFixed(2)} - ${service.priceRange.max.toFixed(2)}) - {service.description}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to keep current values
              </p>
            </div>

            {/* Shipping Price with suggestion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('shipping_price')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
              {priceSuggestion && (
                <p className="mt-1 text-xs text-blue-600">
                  Suggested price range: ${priceSuggestion.min.toFixed(2)} - ${priceSuggestion.max.toFixed(2)}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to keep current values
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select status (optional)</option>
                {SHIPMENT_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to keep current values
              </p>
            </div>

            {/* Apply to all option */}
            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('apply_to_all')}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Apply all fields to all shipments (if unchecked, only filled fields will be applied)
              </label>
            </div>

            {/* Current values preview
            {selectedIds.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Current values for first shipment:</h3>
                {(() => {
                  const firstShipment = shipments.find(s => s.id === selectedIds[0]);
                  return firstShipment ? (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Shipping Service: {firstShipment.shipping_service || 'Not set'}</p>
                      <p>Shipping Price: {firstShipment.shipping_price != null ? `$${firstShipment.shipping_price.toFixed(2)}` : 'Not set'}</p>
                      <p>Status: {firstShipment.status || 'Not set'}</p>
                    </div>
                  ) : null;
                })()}
              </div>
            )} */}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Link
                href="/shipping/ShippingTable"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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

export default BulkEditShippingPage;