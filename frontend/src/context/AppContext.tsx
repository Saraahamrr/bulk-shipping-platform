// frontend/src/context/AppContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect, use } from 'react';
import { ShipmentRecord, SavedAddress, SavedPackage, User } from '@/src/types/index';
import * as api from '@/src/services/api';

interface AppContextType {
  // User
  user: User | null;
  setUser: (user: User | null) => void;
  
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
  const [user, setUser] = useState<User | null>({
    username: 'John Doe',
    email: 'john@example.com',
    account_balance: 1000.00
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [savedPackages, setSavedPackages] = useState<SavedPackage[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const totalPrice = shipments.reduce((sum, shipment) => sum + (shipment.shipping_price || 0), 0);

  const loadShipments = async () => {
    try {
      const response = await api.getShipments();
      setShipments(response.data);
    } catch (error) {
      console.error('Failed to load shipments:', error);
    }
  };

  const loadSavedAddresses = async () => {
    try {
      const response = await api.getAddresses();
      setSavedAddresses(response.data);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  };

  const loadSavedPackages = async () => {
    try {
      const response = await api.getPackages();
      setSavedPackages(response.data);
    } catch (error) {
      console.error('Failed to load packages:', error);
    }
  };

  useEffect(() => {
    loadSavedAddresses();
    loadSavedPackages();
  }, []);

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      currentStep,
      setCurrentStep,
      shipments,
      setShipments,
      loadShipments,
      savedAddresses,
      savedPackages,
      loadSavedAddresses,
      loadSavedPackages,
      selectedRows,
      setSelectedRows,
      totalPrice,
      isLoading,
      setIsLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
};