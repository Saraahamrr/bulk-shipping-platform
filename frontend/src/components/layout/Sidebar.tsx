"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  DocumentPlusIcon,
  DocumentArrowUpIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '@/app/context/AppContext';
import { useRouter } from 'next/navigation';

const menuItems = [
  { name: 'Dashboard', icon: HomeIcon, href: '/dashboard', disabled: true },
  { name: 'Create a Label', icon: DocumentPlusIcon, href: '/create', disabled: true },
  { name: 'Upload Spreadsheet', icon: DocumentArrowUpIcon, href: '/upload', active: true },
  { name: 'Order History', icon: ClockIcon, href: '/history', disabled: true },
  { name: 'Pricing', icon: CurrencyDollarIcon, href: '/pricing', disabled: true },
  { name: 'Billing', icon: CreditCardIcon, href: '/billing', disabled: true },
  { name: 'Settings', icon: Cog6ToothIcon, href: '/settings', disabled: true },
  { name: 'Support & Help', icon: QuestionMarkCircleIcon, href: '/support', disabled: true },
];

const Sidebar = () => {
  const pathname = usePathname();
  const { logout, user, isAuthenticated} = useApp();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login'); // or wherever you want to redirect after logout
  };
  const handleLogin = () => {
    router.push('/login');
  };
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-4 flex-1">
        <div className="mb-8">
          <button onClick={() => router.push('/')}>
            <h1 className="text-xl font-bold text-blue-600 cursor-pointer">ShipFlow</h1>
          <p className="text-xs text-gray-500">Bulk Shipping Platform</p>
          </button>
          
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href && item.active;
            
            return (
              <Link
                key={item.name}
                href={item.disabled ? '#' : item.href}
                className={`
                  flex items-center px-4 py-3 text-sm rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : item.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
                {item.disabled && (
                  <span className="ml-auto text-xs text-gray-400">Soon</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Button at Bottom */}
          <div className="p-4 border-t border-gray-200">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                <span>Logout</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
              >
                Login
              </Link>
            )}
          </div>
    </aside>
  );
};

export default Sidebar;