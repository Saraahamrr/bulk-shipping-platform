// app/page.tsx
"use client";

import { useApp } from '@/app/context/AppContext';


export default function HomePage() {
  const { currentStep, user, isAuthenticated } = useApp();
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        {isAuthenticated ? (
  <h2 className="text-lg font-medium text-gray-800">
    Welcome back, {user?.username}!
  </h2>
) : (
  <h1 className="text-2xl font-bold text-gray-800 mb-4">
    Welcome to ShipFlow!
  </h1>
)}
        
        <p className="text-gray-600 mb-6">
          Streamline your shipping process with our easy-to-use platform. Follow the steps below to get started.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 Card */}
          <div className={`p-4 rounded-lg border 'border-gray-200'}`}>
            <h3 className="font-semibold mb-2">Step 1: Upload</h3>
            <p className="text-sm text-gray-600">Upload your CSV file with shipment data</p>
          </div>

          {/* Step 2 Card */}
          <div className={`p-4 rounded-lg border  'border-gray-200'}`}>
            <h3 className="font-semibold mb-2">Step 2: Review</h3>
            <p className="text-sm text-gray-600">Review and edit shipment details</p>
          </div>

          {/* Step 3 Card */}
          <div className={`p-4 rounded-lg border 'border-gray-200'}`}>
            <h3 className="font-semibold mb-2">Step 3: Shipping</h3>
            <p className="text-sm text-gray-600">Select shipping services</p>
          </div>

          {/* Step 4 Card */}
          <div className={`p-4 rounded-lg border 'border-gray-200'}`}>
            <h3 className="font-semibold mb-2">Step 4: Purchase</h3>
            <p className="text-sm text-gray-600">Purchase and download labels</p>
          </div>
        </div>
      </div>
    </div>
  );
}