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
  XMarkIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import StepHeader from '@/src/components/uploadHeader';

type LabelSize = 'letter' | 'a4' | '4x6';
type PurchaseStep = 'selection' | 'confirmation' | 'success';

interface LabelSummary {
  total: number;
  byService: Record<string, number>;
}

const LabelPurchase: React.FC = () => {
  const router = useRouter();
  const { shipments, updateShipmentById } = useApp();
  
  const [currentStep, setCurrentStep] = useState<PurchaseStep>('selection');
  const [labelSize, setLabelSize] = useState<LabelSize>('4x6');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const { totalPrice } = useApp();
  
  const allShipments = shipments;
  
  const summary: LabelSummary = allShipments.reduce((acc, shipment) => {
    const service = shipment.shipping_service || 'unknown';
    acc.total += shipment.shipping_price || 0;
    acc.byService[service] = (acc.byService[service] || 0) + 1;
    return acc;
  }, { total: 0, byService: {} } as LabelSummary);

  React.useEffect(() => {
    console.log('All Shipments:', allShipments);
    allShipments.forEach(s => {
      console.log(`Shipment ${s.id}:`, {
        shipping_price: s.shipping_price,
        type: typeof s.shipping_price
      });
    });
  }, [allShipments]);

  const generateLabelPDF = () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: labelSize === '4x6' ? [400, 600] : 'letter'
      });

      allShipments.forEach((shipment, index) => {
        if (index > 0) {
          pdf.addPage();
        }

        pdf.setFont('helvetica');
        
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(20, 20, pdf.internal.pageSize.getWidth() - 40, pdf.internal.pageSize.getHeight() - 40);

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SHIPPING LABEL', 40, 50);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Label ${index + 1} of ${allShipments.length}`, 40, 65);

        pdf.setFillColor(245, 245, 245);
        pdf.rect(40, 75, pdf.internal.pageSize.getWidth() - 80, 40, 'F');
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Order #${shipment.order_no}`, 50, 90);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Service: ${shipment.shipping_service || 'Not specified'}`, 50, 105);
        pdf.text(`Date: ${new Date().toLocaleDateString()}`, pdf.internal.pageSize.getWidth() - 150, 105);

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('FROM:', 40, 140);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Your Company Name', 40, 155);
        pdf.text('123 Business St.', 40, 170);
        pdf.text('Suite 100', 40, 185);
        pdf.text('New York, NY 10001', 40, 200);
        pdf.text('United States', 40, 215);

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('TO:', pdf.internal.pageSize.getWidth() - 200, 140);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const addressLines = shipment.to_address_formatted?.split(',') || ['Recipient Name', 'Address', 'City, State ZIP'];
        addressLines.forEach((line, i) => {
          pdf.text(line.trim(), pdf.internal.pageSize.getWidth() - 200, 155 + (i * 15));
        });

        pdf.setFillColor(245, 245, 245);
        pdf.rect(40, 250, pdf.internal.pageSize.getWidth() - 80, 60, 'F');
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('PACKAGE DETAILS', 50, 270);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        // pdf.text(`Weight: ${shipment.weight_lbs || 'N/A'} lbs`, 50, 290);
        pdf.text(`Dimensions: ${shipment.length || 'N/A'} x ${shipment.width || 'N/A'} x ${shipment.height || 'N/A'}`, 50, 305);
        pdf.text(`Value: ${shipment.shipping_price || 'N/A'}`, 50, 320);

        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(2);
        for (let i = 0; i < 20; i++) {
          pdf.line(50 + (i * 15), 360, 50 + (i * 15), 400);
        }
        
        pdf.setFontSize(12);
        pdf.text(`*${shipment.order_no}*`, 50, 430);
        
        pdf.setFontSize(9);
        pdf.text(`Tracking #: TRK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 50, 450);

        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 40, pdf.internal.pageSize.getHeight() - 30);
        pdf.text(`Service: ${shipment.shipping_service || 'Standard'}`, pdf.internal.pageSize.getWidth() - 150, pdf.internal.pageSize.getHeight() - 30);
      });

      pdf.save(`shipping-labels-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF generated successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handlePurchase = async () => {
    if (!termsAccepted) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      allShipments.forEach(shipment => {
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
    generateLabelPDF();
  };

  const handlePrintLabels = () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: labelSize === '4x6' ? [400, 600] : 'letter'
      });

      allShipments.forEach((shipment, index) => {
        if (index > 0) {
          pdf.addPage();
        }
        
        pdf.setFont('helvetica');
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(20, 20, pdf.internal.pageSize.getWidth() - 40, pdf.internal.pageSize.getHeight() - 40);
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SHIPPING LABEL', 40, 50);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Label ${index + 1} of ${allShipments.length}`, 40, 65);
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Order #${shipment.order_no}`, 40, 90);
      });

      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      toast.success('Opening PDF for printing...');
    } catch (error) {
      toast.error('Failed to prepare PDF for printing');
    }
  };

  const handleBackToShipments = () => {
    router.push('/shipping/ShippingTable');
  };

  if (allShipments.length === 0) {
    return (
      <div className="space-y-4">
        <StepHeader />
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No shipments available to process.</p>
          <button
            onClick={handleBackToShipments}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Shipments
          </button>
        </div>
      </div>
    );
  }

  // Selection Step
  if (currentStep === 'selection') {
    return (
      <div className="space-y-4">
        <StepHeader />
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Select Label Format for All Shipments
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose your preferred label size for all {allShipments.length} shipments
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {/* Label Size Options - More like ShippingTable's styling */}
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setLabelSize('4x6')}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    labelSize === '4x6'
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-medium text-gray-900">4x6 inch</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Thermal label format
                  </p>
                  {labelSize === '4x6' && (
                    <span className="text-xs text-blue-600 mt-2 block font-medium">
                      ✓ Selected
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setLabelSize('letter')}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    labelSize === 'letter'
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-medium text-gray-900">Letter</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    8.5x11" paper
                  </p>
                  {labelSize === 'letter' && (
                    <span className="text-xs text-blue-600 mt-2 block font-medium">
                      ✓ Selected
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setLabelSize('a4')}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    labelSize === 'a4'
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-medium text-gray-900">A4</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    A4 format
                  </p>
                  {labelSize === 'a4' && (
                    <span className="text-xs text-blue-600 mt-2 block font-medium">
                      ✓ Selected
                    </span>
                  )}
                </button>
              </div>

              {/* Summary of ALL shipments - More like ShippingTable's table styling */}
              <div className="mt-6 border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700">All Shipments Summary</h3>
                </div>
                
                {/* Shipments list - styled like a table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allShipments.map((shipment, index) => (
                        <tr key={shipment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{shipment.order_no}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              shipment.shipping_service === 'ground' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {shipment.shipping_service || 'Not set'}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                             {shipment.length || 'N/A'}x{shipment.width || 'N/A'}x{shipment.height || 'N/A'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${shipment.shipping_price || '0.00'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals - Like ShippingTable footer */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total amount for all shipments:</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${totalPrice}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation buttons - Like ShippingTable footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={handleBackToShipments}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-1" />
                  Back to Shipments
                </button>
                <button
                  onClick={() => setCurrentStep('confirmation')}
                  disabled={!labelSize}
                  className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Confirmation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation Step
  if (currentStep === 'confirmation') {
    return (
      <div className="space-y-4">
        <StepHeader />
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Confirm Label Purchase
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Please review all {allShipments.length} shipments before purchasing
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {/* All shipments list - Table style */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ship To</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allShipments.map((shipment, index) => (
                        <tr key={shipment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{shipment.order_no}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              shipment.shipping_service === 'ground' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {shipment.shipping_service || 'Not set'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">
                            {shipment.to_address_formatted?.substring(0, 50)}...
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            ${shipment.shipping_price}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Grand total - Like ShippingTable stats */}
              <div className="bg-blue-50 px-4 py-3 rounded-lg flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Grand Total (All Shipments)</span>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">
                    ${totalPrice}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Label format: {labelSize === '4x6' ? '4x6 inch thermal' : labelSize === 'letter' ? 'Letter paper' : 'A4 paper'}
                  </p>
                </div>
              </div>

              {/* Terms acceptance */}
              <label className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  I confirm that all shipping information for ALL shipments is correct and agree to the 
                  <button className="text-blue-600 hover:underline mx-1">
                    terms of service
                  </button>
                  and shipping carrier agreements.
                </span>
              </label>

              {/* Navigation buttons - Like ShippingTable footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
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
                    'Confirm Purchase for All Shipments'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success Step
  if (currentStep === 'success') {
    return (
      <div className="space-y-4">
        <StepHeader />
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Purchase Complete
            </h2>
          </div>
          
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                All Labels Purchased Successfully!
              </h3>
              <p className="text-sm text-gray-500">
                {allShipments.length} shipping label{allShipments.length !== 1 ? 's' : ''} created for all shipments
              </p>
            </div>

            {/* Summary - Table style */}
            <div className="border rounded-lg overflow-hidden mb-6">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700">Purchase Summary</h4>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total shipments:</p>
                    <p className="text-sm font-medium">{allShipments.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Label format:</p>
                    <p className="text-sm font-medium">
                      {labelSize === '4x6' ? '4x6 inch thermal' : labelSize === 'letter' ? 'Letter paper' : 'A4 paper'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total price:</p>
                    <p className="text-lg font-medium text-green-600">
                      ${totalPrice}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Transaction ID:</p>
                    <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      TRX-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 gap-3 mb-4">
              <button
                onClick={handleDownloadLabels}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                Download All Labels (PDF)
              </button>
            </div>

            {/* Info note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-blue-800">
                <span className="font-medium">Note:</span> Your PDF contains {allShipments.length} page{allShipments.length !== 1 ? 's' : ''} - 
                one page per shipment with all order details.
              </p>
            </div>

            {/* Footer navigation - Like ShippingTable */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={handleBackToShipments}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Back to Shipments
              </button>
              <button
                onClick={() => {
                  router.push('/upload');
                }}
                className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Shipments
                <TruckIcon className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default LabelPurchase;