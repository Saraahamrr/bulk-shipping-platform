'use client';
import { useApp } from '@/app/context/AppContext';
import { BellIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

const Header = () => {
  const { user, totalPrice, logout ,purchaseCompleted, setpurchaseCompleted} = useApp();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-end space-x-6">
        <div className="flex items-center space-x-6">
           <div className="text-right">
          {!purchaseCompleted && (
              <>
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-lg font-bold text-blue-600">
                  ${(Number(totalPrice) || 0).toFixed(2)}
                </div>
              </>
            )}

            {purchaseCompleted && (
              <>
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-lg font-bold text-blue-600">
                  $0.00
                </div>
                </>
            )}
                      
        </div>

          <button className="relative">
            <BellIcon className="w-6 h-6 text-gray-600" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              2
            </span>
          </button>

           {user && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">{user.username}</div>
                <div className="text-xs text-gray-500">
                  Balance: ${user.account_balance?.toFixed(2)}
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </header>
  );
};

export default Header;