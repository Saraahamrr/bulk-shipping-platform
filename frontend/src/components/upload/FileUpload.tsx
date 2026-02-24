// frontend/src/components/upload/FileUpload.tsx
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useApp } from '@/src/context/AppContext';
import * as api from '@/src/services/api';
import toast from 'react-hot-toast';
import { DocumentArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface FileUploadProps {
  onUploadComplete: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const { setIsLoading, setShipments, setCurrentStep } = useApp();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await api.uploadFile(file);
      setShipments(response.data.records);
      toast.success(response.data.message);
      onUploadComplete();
      setCurrentStep(2);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setShipments, onUploadComplete, setCurrentStep]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'shipping_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="col-span-2">
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
          className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
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
    </div>
  );
};

export default FileUpload;