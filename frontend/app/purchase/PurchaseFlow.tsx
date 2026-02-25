// frontend/src/components/purchase/PurchaseFlow.tsx
import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import * as api from '@/src/services/api';
import toast from 'react-hot-toast';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface PurchaseFlowProps {
  onComplete: () => void;
}

const PurchaseFlow: React.FC<PurchaseFlowProps> = ({ onComplete }) => {
  const { shipments, selectedRows, totalPrice, user, setCurrentStep } = useApp();
  const [labelFormat, setLabelFormat] = useState<'letter' | '4x6'>('letter');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);

  const selectedShipments = shipments.filter(s => selectedRows.includes(s.id));
  const grandTotal = selectedShipments.reduce((sum, s) => sum + s.shipping_price, 0);
  const canPurchase = termsAccepted && grandTotal > 0 && grandTotal <= (user?.account_balance || 0);

  const handlePurchase = async () => {
    if (!canPurchase) return;

    setIsProcessing(true);
    
    try {
      const response = await api.purchaseShipments(selectedRows, labelFormat);
      toast.success(response.data.message);
      setPurchaseComplete(true);
    } catch (error) {
      toast.error('Purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (purchaseComplete) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircleIcon className="w-10 h-10 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Labels Created Successfully!
        </h2>
        
        <p className="text-gray-600 mb-8">
          {selectedShipments.length} shipping labels have been generated.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Labels:</span>
            <span className="font-medium">{selectedShipments.length}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Format:</span>
            <span className="font-medium">{labelFormat === '4x6' ? '4x6 Thermal' : 'Letter/A4'}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
            <span>Total:</span>
            <span className="text-blue-600">${grandTotal.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              // Simulate download
              toast.success('Download started');
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Download Labels
          </button>
          <button
            onClick={() => {
              setCurrentStep(1);
              onComplete();
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Create New Batch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Complete Purchase</h2>
        
        {/* Label Format Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Select Label Format</h3>
          
          <div className="space-y-3">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="format"
                value="letter"
                checked={labelFormat === 'letter'}
                onChange={(e) => setLabelFormat(e.target.value as 'letter')}
                className="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium">Letter / A4 (8.5x11")</div>
                <div className="text-sm text-gray-500">Standard printer paper</div>
              </div>
            </label>
            
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="format"
                value="4x6"
                checked={labelFormat === '4x6'}
                onChange={(e) => setLabelFormat(e.target.value as '4x6')}
                className="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium">4x6 Thermal Label</div>
                <div className="text-sm text-gray-500">For thermal printers</div>
              </div>
            </label>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
          
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {selectedShipments.map((shipment, index) => (
              <div key={shipment.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {index + 1}. {shipment.order_no} - {shipment.to_first_name} {shipment.to_last_name}
                </span>
                <span className="font-medium">${shipment.shipping_price.toFixed(2)}</span>
              </div>
            ))}
            
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between font-bold">
                <span>Subtotal:</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Terms and Balance */}
        <div className="mb-8">
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-blue-800">Your Account Balance:</span>
              <span className="text-xl font-bold text-blue-600">
                ${user?.account_balance.toFixed(2)}
              </span>
            </div>
            {grandTotal > (user?.account_balance || 0) && (
              <p className="text-sm text-red-600 mt-2">
                Insufficient balance. Please add funds.
              </p>
            )}
          </div>
          
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              I agree to the Terms of Service and confirm that all shipping information is accurate.
              I understand that labels are non-refundable once purchased.
            </span>
          </label>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(3)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back
          </button>
          
          <button
            onClick={handlePurchase}
            disabled={!canPurchase || isProcessing}
            className={`
              px-8 py-3 rounded-lg font-semibold
              ${canPurchase && !isProcessing
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isProcessing ? 'Processing...' : `Purchase $${grandTotal.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseFlow;