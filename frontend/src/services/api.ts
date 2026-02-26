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

// Get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add session ID and auth token
api.interceptors.request.use(
  (config) => {
    const sessionId = getSessionId();
    config.headers['X-Session-ID'] = sessionId;
    
    // Add authorization token if it exists
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${access}`;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear storage and redirect to login
        localStorage.clear();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Addresses
export const getAddresses = () => api.get('/addresses/');
export const createAddress = (data: any) => api.post('/addresses/', data);
export const updateAddress = (id: number, data: any) => api.put(`/addresses/${id}/`, data);
export const deleteAddress = (id: number) => api.delete(`/addresses/${id}/`);

// Packages
export const getPackages = () => api.get('/packages/');
export const createSavedPackage = (data: any) => api.post('/packages/', data);
export const updatePackage = (id: number, data: any) => api.put(`/packages/${id}/`, data);
export const deletePackage = (id: number) => api.delete(`/packages/${id}/`);


// Shipments
export const getShipments = () => api.get('/shipments/');
export const getShipment = (id: number) => api.get(`/shipments/${id}/`); // Fixed typo: getshipment -> getShipment
export const updateShipment = (id: number, data: any) => api.put(`/shipments/${id}/`, data);
export const deleteShipment = (id: number) => api.delete(`/shipments/${id}/delete/`);
export const deleteAllShipments = () => api.delete('/shipments/delete-all/');
export const bulkUpdateShipments = (recordIds: number[], data: any) => 
  api.patch('/shipments/bulk/update/', { 
    record_ids: recordIds, 
    ...data 
  });
export const bulkDeleteShipments = (recordIds: number[]) => 
  api.post('/shipments/bulk/delete/', { record_ids: recordIds });

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

// Auth endpoints
export const login = (username: string, password: string) => 
  api.post('/auth/login/', { username, password });

export const logout = (refreshToken: string) => 
  api.post('/auth/logout/', { refresh: refreshToken });

export const register = (data: any) => api.post('/auth/register/', data);

export const validateToken = () => api.get('/auth/profile/');

// Token refresh endpoint
export const refreshToken = (refreshToken: string) => 
  axios.post(`${API_URL}/auth/refresh/`, { refresh: refreshToken });

export default api;