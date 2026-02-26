// app/context/AppContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, use } from 'react';
import { ShipmentRecord, SavedAddress, SavedPackage, User } from '@/src/types/index';
import * as api from '@/src/services/api';

interface AppContextType {
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  
  // Step
  currentStep: number;
  setCurrentStep: (step: number) => void;
  
  // Shipments
  shipments: ShipmentRecord[];
  setShipments: (shipments: ShipmentRecord[]) => void;
  loadShipments: () => Promise<void>;
  
  // Saved data
  savedAddresses: SavedAddress[];
  savedPackages: SavedPackage[];
  loadSavedAddresses: () => Promise<void>;
  loadSavedPackages: () => Promise<void>;
  
  // Selection
  selectedRows: number[];
  setSelectedRows: (rows: number[]) => void;
  
  // Total
  totalPrice: number;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Update a single shipment
  updateShipment: (index: number, updatedData: Partial<ShipmentRecord>) => void;
  updateShipmentById: (id: number, updatedData: Partial<ShipmentRecord>) => void;  
  setpurchaseCompleted: (completed: boolean) => void;
  purchaseCompleted: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [savedPackages, setSavedPackages] = useState<SavedPackage[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseCompleted, setPurchaseCompletedState] = useState(false);

  
  const isAuthenticated = useMemo(() => {
    return !!user && !!localStorage.getItem('access_token');
  }, [user]);

  // Define load functions first so they can be used in useEffect
  const loadShipments = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.getShipments();
      setShipments(response.data);
    } catch (error: any) {
      console.error('Failed to load shipments:', error);
      if (error.response?.status === 401) {
        await logout();
      }
    }
  }, [isAuthenticated]); // Add dependencies

  const loadSavedAddresses = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.getAddresses();
      setSavedAddresses(response.data);
    } catch (error: any) {
      console.error('Failed to load addresses:', error);
      if (error.response?.status === 401) {
        await logout();
      }
    }
  }, [isAuthenticated]); // Add dependencies

  const loadSavedPackages = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.getPackages();
      setSavedPackages(response.data);
    } catch (error: any) {
      console.error('Failed to load packages:', error);
      if (error.response?.status === 401) {
        await logout();
      }
    }
  }, [isAuthenticated]); // Add dependencies

  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      const refresh = localStorage.getItem('refresh_token');

      if (refresh) {
        await api.logout(refresh).catch(() => {});
      }
    } finally {
      setUser(null);
      setShipments([]);
      setSavedAddresses([]);
      setSavedPackages([]);
      setSelectedRows([]);
      setCurrentStep(1);

      localStorage.clear();

      setIsLoading(false);
    }
  }, []);



  // Session validation on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const validateSession = async () => {
      try {
        const response = await api.validateToken();

        setUser({
          username: response.data.user.username,
          email: response.data.user.email,
          account_balance: 1000
        });

        // Load user data after setting user
        if (response.data.user) {
          await loadSavedAddresses();
          await loadSavedPackages();
          await loadShipments();
        }
      } catch {
        // Token invalid → logout cleanly
        localStorage.clear();
        setUser(null);
      }
    };

    validateSession();
  }, [loadSavedAddresses, loadSavedPackages, loadShipments]); // Add dependencies

  const login = useCallback(async (
    username: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await api.login( username, password );

      const { access, refresh, user: userData } = response.data;

      if (!access) return false;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      setUser({
        username: userData.username,
        email: userData.email,
        account_balance: 1000,
      });

      // Load user data
      await loadSavedAddresses();
      await loadSavedPackages();
      await loadShipments();

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadSavedAddresses, loadSavedPackages, loadShipments]); // Add dependencies

  const totalPrice = useMemo(() => {
    return shipments.reduce((sum, s) => sum + (Number(s.shipping_price) || 0), 0);
  }, [shipments]);

  const setpurchaseCompleted = useCallback((complete: boolean) => {
  setPurchaseCompletedState(complete);
  localStorage.setItem('purchaseCompleted', complete ? 'true' : 'false');
}, []);


  const updateShipment = useCallback((index: number, updatedData: Partial<ShipmentRecord>) => {
    setShipments(prev => {
      const newShipments = [...prev];
      if (newShipments[index]) {
        newShipments[index] = { ...newShipments[index], ...updatedData };
      }
      return newShipments;
    });
  }, []);

  const updateShipmentById = useCallback((id: number, updatedData: Partial<ShipmentRecord>) => {
    setShipments(prev => 
      prev.map(shipment => 
        shipment.id === id ? { ...shipment, ...updatedData } : shipment
      )
    );
  }, []);
 

  // Load data when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      loadSavedAddresses();
      loadSavedPackages();
      loadShipments();
    }
  }, [isAuthenticated, loadSavedAddresses, loadSavedPackages, loadShipments]);

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      login,
      logout,
      isAuthenticated,
      currentStep,
      setCurrentStep,
      shipments,
      setShipments,
      loadShipments,
      updateShipment,
      updateShipmentById,
      totalPrice,
      savedAddresses,
      savedPackages,
      loadSavedAddresses,
      loadSavedPackages,
      selectedRows,
      setSelectedRows,
      isLoading,
      setIsLoading,
      purchaseCompleted,   
      setpurchaseCompleted   
    }}>
      {children}
    </AppContext.Provider>
  );
};