'use client';
import { useApp } from '@/app/context/AppContext';
import { BellIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { user, totalPrice, currentStep } = useApp();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {currentStep === 1 && 'Upload Spreadsheet'}
            {currentStep === 2 && 'Review & Edit'}
            {currentStep === 3 && 'Select Shipping'}
            {currentStep === 4 && 'Purchase'}
          </h2>
          <span className="text-sm text-gray-500">Step {currentStep} of 4</span>
        </div>

        <div className="flex items-center space-x-6">
          {totalPrice > 0 && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-lg font-bold text-blue-600">
                ${totalPrice.toFixed(2)}
              </div>
            </div>
          )}

          <button className="relative">
            <BellIcon className="w-6 h-6 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              2
            </span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {user?.username.charAt(0)}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">{user?.username}</div>
              <div className="text-xs text-gray-500">
                Balance: ${user?.account_balance.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;