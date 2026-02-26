// frontend/src/components/upload/FileUpload.tsx
'use client';
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useApp } from '@/app/context/AppContext';
import * as api from '@/src/services/api';
import toast from 'react-hot-toast';
import { ChevronLeftIcon, ChevronRightIcon, DocumentArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import router from 'next/router';
import { useRouter } from 'next/navigation'; 
import StepHeader from '@/src/components/uploadHeader';


interface FileUploadProps {
  onUploadComplete?: () => void; // Make it optional with ?
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const { setIsLoading, setShipments, setCurrentStep,setpurchaseCompleted } = useApp();
  const router = useRouter(); // Add this line


  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setIsLoading(true);
      try {
        // Call API to delete all existing shipments
        await api.deleteAllShipments();
        console.log('Cleared existing shipments');
      } catch (clearError) {
        console.error('Error clearing existing shipments:', clearError);
        // Continue with upload even if clear fails
      }
    try {
      console.log('Uploading file:', file.name);
      const response = await api.uploadFile(file);
      console.log('Upload response:', response);
      setpurchaseCompleted(false); // Reset purchase completed state on new upload
      
      // Check if response has the expected structure
      if (response.data && response.data.records) {
        setShipments(response.data.records);
        toast.success(response.data.message || 'File uploaded successfully');
        
        // Only call onUploadComplete if it exists and is a function
        if (onUploadComplete && typeof onUploadComplete === 'function') {
          onUploadComplete();
        }
        
        setCurrentStep(2);
        router.push('/review/ReviewTable'); // Navigate to review page after upload
  
      } else {
        // Handle unexpected response structure
        console.error('Unexpected response structure:', response.data);
        toast.error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // More detailed error handling
      if (axios.isAxiosError(error)) {
        if (error.response) {
          toast.error(error.response.data?.error || `Server error: ${error.response.status}`);
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        } else if (error.request) {
          toast.error('No response from server. Please check your connection.');
          console.error('No response received:', error.request);
        } else {
          toast.error(`Request error: ${error.message}`);
        }
      } else {
        toast.error(error.response?.data?.error || 'Failed to upload file');
      }
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setShipments, onUploadComplete, setCurrentStep, router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleDownloadTemplate = async (): Promise<void> => {
    try {
      const response = await api.downloadTemplate();

      const blob: Blob = new Blob([response.data], { type: 'text/csv' });
      const url: string = window.URL.createObjectURL(blob);

      const link: HTMLAnchorElement = document.createElement('a');
      link.href = url;
      link.download = 'shipping_template.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Failed to download template');
    }
  };

  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="col-span-2">
        <StepHeader />
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
          `}
        >
          <input {...getInputProps()} />
          <DocumentArrowUpIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          
          {isDragActive ? (
            <p className="text-lg text-blue-600">Drop the file here...</p>
          ) : (
            <>
              <p className="text-lg text-gray-600 mb-2">
                Drag and drop your CSV file here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports: CSV files only
              </p>
            </>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Need help?</h3>
        
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center text-blue-600 hover:bg-blue-100 transition-all duration-200 rounded-md px-3 py-2 mb-4 cursor-pointer"
        >
          <DocumentTextIcon className="w-5 h-5 mr-2" />
          Download Template.csv
        </button>
        
        <div className="text-sm text-gray-600 space-y-2">
          <p>Your CSV file should include:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ship from and ship to addresses</li>
            <li>Package dimensions and weight</li>
            <li>Order numbers and SKUs</li>
            <li>Contact information</li>
          </ul>
          <p className="mt-4 text-xs text-gray-500">
            * Fields marked with asterisk are required
          </p>
        </div>            
      </div>
      <div className="flex space-x-2 border-l pl-4">
              <button
                onClick={() => {
                  router.push('/review/ReviewTable');
                  setCurrentStep(2);
                }}
                
                className="flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Review & Edit
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </button>
            </div>
    </div>
  );
};

export default FileUpload;