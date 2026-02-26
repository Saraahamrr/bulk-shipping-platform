// frontend/src/app/shipping/LabelPurchase.tsx
'use client';

import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeftIcon, 
  DocumentArrowDownIcon, 
  PrinterIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

type LabelSize = 'letter' | 'a4' | '4x6';
type PurchaseStep = 'selection' | 'confirmation' | 'success';

interface LabelSummary {
  total: number;
  byService: Record<string, number>;
}

const LabelPurchase: React.FC = () => {
  const router = useRouter();
  const { shipments, selectedRows, updateShipmentById } = useApp();
  
  const [currentStep, setCurrentStep] = useState<PurchaseStep>('selection');
  const [labelSize, setLabelSize] = useState<LabelSize>('4x6');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  
  // Get selected shipments
  const selectedShipments = shipments.filter(s => selectedRows.includes(s.id));
  
  // Calculate totals
  const summary: LabelSummary = selectedShipments.reduce((acc, shipment) => {
    const service = shipment.shipping_service || 'unknown';
    acc.total += shipment.shipping_price || 0;
    acc.byService[service] = (acc.byService[service] || 0) + 1;
    return acc;
  }, { total: 0, byService: {} } as LabelSummary);

  const handlePurchase = async () => {
    if (!termsAccepted) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate API call to purchase labels
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update shipment statuses
      selectedShipments.forEach(shipment => {
        updateShipmentById(shipment.id, { 
          status: 'processed',
          label_purchased: true,
          label_size: labelSize,
          purchased_at: new Date().toISOString()
        });
      });
      
      setPurchaseComplete(true);
      setCurrentStep('success');
      toast.success('Labels purchased successfully!');
    } catch (error) {
      toast.error('Failed to purchase labels');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadLabels = () => {
    // Simulate downloading labels
    toast.success('Downloading labels...');
    // In a real implementation, this would trigger a download
    const link = document.createElement('a');
    link.href = '#'; // Would be actual PDF URL
    link.download = `labels-${new Date().toISOString()}.pdf`;
    link.click();
  };

  const handlePrintLabels = () => {
    // Simulate printing
    toast.success('Preparing labels for printing...');
    window.print();
  };

  const handleBackToShipments = () => {
    router.push('/shipping/ShippingTable');
  };

  // Selection Step
  if (currentStep === 'selection') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Select Label Format
          </h2>
          
          <div className="space-y-4">
            {/* Label Size Options */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setLabelSize('4x6')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  labelSize === '4x6'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium text-gray-900">4x6 inch</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Thermal label format<br />
                  Ideal for shipping labels
                </p>
                {labelSize === '4x6' && (
                  <span className="text-xs text-blue-600 mt-2 block">
                    ✓ Recommended for most carriers
                  </span>
                )}
              </button>

              <button
                onClick={() => setLabelSize('letter')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  labelSize === 'letter' || labelSize === 'a4'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium text-gray-900">Letter / A4</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Standard paper size<br />
                  8.5x11" or A4 format
                </p>
                <span className="text-xs text-gray-500 mt-2 block">
                  Requires cutting
                </span>
              </button>
            </div>

            {/* Summary of selected shipments */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Selected shipments:</span>
                  <span className="font-medium">{selectedShipments.length}</span>
                </div>
                {Object.entries(summary.byService).map(([service, count]) => (
                  <div key={service} className="flex justify-between text-sm text-gray-600">
                    <span>{service}:</span>
                    <span>{count}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total amount:</span>
                    <span className="text-lg text-blue-600">
                      ${summary.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4">
              <button
                onClick={handleBackToShipments}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Back
              </button>
              <button
                onClick={() => setCurrentStep('confirmation')}
                disabled={!labelSize}
                className="flex items-center px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Confirmation
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation Step
  if (currentStep === 'confirmation') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Confirm Label Purchase
          </h2>

          <div className="space-y-6">
            {/* Selected shipments list */}
            <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
              {selectedShipments.map((shipment) => (
                <div key={shipment.id} className="p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Order #{shipment.order_no}
                    </p>
                    <p className="text-xs text-gray-500">
                      {shipment.shipping_service} • {shipment.package_details}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    ${shipment.shipping_price?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Grand total */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Grand Total</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${summary.total.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Label format: {labelSize === '4x6' ? '4x6 inch thermal' : 'Letter/A4 paper'}
              </p>
            </div>

            {/* Terms acceptance */}
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                I confirm that all shipping information is correct and agree to the 
                <button className="text-blue-600 hover:underline mx-1">
                  terms of service
                </button>
                and shipping carrier agreements.
              </span>
            </label>

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep('selection')}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Back
              </button>
              <button
                onClick={handlePurchase}
                disabled={isProcessing || !termsAccepted}
                className="flex items-center px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Confirm Purchase'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success Step
  if (currentStep === 'success') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Labels Purchased Successfully!
            </h2>
            <p className="text-gray-600">
              {selectedShipments.length} shipping label{selectedShipments.length !== 1 ? 's' : ''} created
            </p>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Purchase Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order numbers:</span>
                <span className="font-medium">
                  {selectedShipments.map(s => s.order_no).join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Label format:</span>
                <span className="font-medium">
                  {labelSize === '4x6' ? '4x6 inch thermal' : 'Letter/A4 paper'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total paid:</span>
                <span className="font-medium text-green-600">
                  ${summary.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-xs">
                  TRX-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleDownloadLabels}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
              Download Labels
            </button>
            <button
              onClick={handlePrintLabels}
              className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <PrinterIcon className="w-5 h-5 mr-2" />
              Print Labels
            </button>
          </div>

          {/* Additional options */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleBackToShipments}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Shipments
            </button>
            <button
              onClick={() => {
                // Reset and go to new shipment creation
                router.push('/upload');
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Create New Shipments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default LabelPurchase;