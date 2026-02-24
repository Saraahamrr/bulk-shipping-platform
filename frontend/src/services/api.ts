// frontend/src/services/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Get or create session ID
const getSessionId = (): string => {
  if (typeof window !== 'undefined') {
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2);
      localStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }
  return '';
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add session ID to requests
api.interceptors.request.use((config) => {
  const sessionId = getSessionId();
  config.headers['X-Session-ID'] = sessionId;
  return config;
});

// Addresses
export const getAddresses = () => api.get('/addresses/');
export const createAddress = (data: any) => api.post('/addresses/', data);
export const updateAddress = (id: number, data: any) => api.put(`/addresses/${id}/`, data);
export const deleteAddress = (id: number) => api.delete(`/addresses/${id}/`);

// Packages
export const getPackages = () => api.get('/packages/');
export const createPackage = (data: any) => api.post('/packages/', data);
export const updatePackage = (id: number, data: any) => api.put(`/packages/${id}/`, data);
export const deletePackage = (id: number) => api.delete(`/packages/${id}/`);

// Shipments
export const getShipments = () => api.get('/shipments/');
export const updateShipment = (id: number, data: any) => api.put(`/shipments/${id}/`, data);
export const deleteShipment = (id: number) => api.delete(`/shipments/${id}/delete/`);
export const bulkUpdateShipments = (data: any) => api.post('/shipments/bulk/update/', data);
export const bulkDeleteShipments = (recordIds: number[]) => api.post('/shipments/bulk/delete/', { record_ids: recordIds });

// Upload
export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Purchase
export const purchaseShipments = (recordIds: number[], labelFormat: string) => 
  api.post('/purchase/', { record_ids: recordIds, label_format: labelFormat });

// Template
export const downloadTemplate = () => api.get('/template/', { responseType: 'blob' });