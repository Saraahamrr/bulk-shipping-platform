// frontend/src/pages/index.tsx
import React, { useEffect } from 'react';
import { useApp } from '@/src/context/AppContext';
import FileUpload from '@/src/components/upload/FileUpload';
import ReviewTable from '@/src/components/review/ReviewTable';
import ShippingTable from '@/src/components/shipping/ShippingTable';
import PurchaseFlow from '@/src/components/purchase/PurchaseFlow';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function Home() {
  const { currentStep, setCurrentStep, shipments, selectedRows, setSelectedRows } = useApp();
  const router = useRouter();

  useEffect(() => {
    // Redirect to upload if no shipments and trying to access later steps
    if (shipments.length === 0 && currentStep > 1) {
      setCurrentStep(1);
    }
  }, [shipments, currentStep, setCurrentStep]);

  const handleBack = () => {
    if (currentStep === 2) {
      if (!confirm('Going back will clear all uploaded data. Are you sure?')) {
        return;
      }
      setCurrentStep(1);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleContinue = () => {
    if (currentStep === 1 && shipments.length === 0) {
      toast.error('Please upload a file first');
      return;
    }
    
    if (currentStep === 2 && shipments.length === 0) {
      toast.error('No shipments to process');
      return;
    }
    
    if (currentStep === 3 && selectedRows.length === 0) {
      toast.error('Please select at least one shipment');
      return;
    }
    
    setCurrentStep(currentStep + 1);
  };

  const handleUploadComplete = () => {
    // Auto-continue to step 2 after upload
    setCurrentStep(2);
  };

  const handlePurchaseComplete = () => {
    setSelectedRows([]);
  };

  return (
    <div className="space-y-6">
      {/* Step Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {currentStep === 1 && 'Upload Spreadsheet'}
          {currentStep === 2 && 'Review & Edit Shipments'}
          {currentStep === 3 && 'Select Shipping Services'}
          {currentStep === 4 && 'Purchase Labels'}
        </h1>
        
        <div className="flex space-x-3">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
          )}
          
          {currentStep < 4 && currentStep !== 1 && (
            <button
              onClick={handleContinue}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue
            </button>
          )}
        </div>
      </div>

      {/* Step Content */}
      <div>
        {currentStep === 1 && (
          <FileUpload onUploadComplete={handleUploadComplete} />
        )}
        
        {currentStep === 2 && shipments.length > 0 && (
          <ReviewTable />
        )}
        
        {currentStep === 3 && shipments.length > 0 && (
          <ShippingTable />
        )}
        
        {currentStep === 4 && selectedRows.length > 0 && (
          <PurchaseFlow onComplete={handlePurchaseComplete} />
        )}
      </div>
    </div>
  );
}