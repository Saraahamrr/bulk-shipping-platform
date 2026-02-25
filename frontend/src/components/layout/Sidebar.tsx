// frontend/src/components/layout/Sidebar.tsx
"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  DocumentPlusIcon,
  DocumentArrowUpIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';


const menuItems = [
  { name: 'Dashboard', icon: HomeIcon, href: '/', active: true },
  { name: 'Create a Label', icon: DocumentPlusIcon, href: '/create', disabled: true },
  { name: 'Upload Spreadsheet', icon: DocumentArrowUpIcon, href: '/upload', active: true },
  { name: 'Order History', icon: ClockIcon, href: '/history', disabled: true },
  { name: 'Pricing', icon: CurrencyDollarIcon, href: '/pricing', disabled: true },
  { name: 'Billing', icon: CreditCardIcon, href: '/billing', disabled: true },
  { name: 'Settings', icon: Cog6ToothIcon, href: '/settings', disabled: true },
  { name: 'Support & Help', icon: QuestionMarkCircleIcon, href: '/support', disabled: true },
];

const Sidebar = () => {
  const router = useRouter();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-blue-600">ShipFlow</h1>
          <p className="text-xs text-gray-500">Bulk Shipping Platform</p>
        </div>
        
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = usePathname() === item.href && item.active;
            
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
    </aside>
  );
};

export default Sidebar;