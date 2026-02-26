'use client';
import { useApp } from '@/app/context/AppContext';

const StepHeader = () => {
  const { currentStep } = useApp();

  const titles = [
    'Upload Spreadsheet',
    'Review & Edit',
    'Select Shipping',
    'Purchase',
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          {titles[currentStep - 1]}
        </h2>
        <span className="text-sm text-gray-500">
          Step {currentStep} of 4
        </span>
      </div>
    </div>
  );
};

export default StepHeader;