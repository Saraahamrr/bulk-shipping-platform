import { ReactNode } from "react";

// frontend/src/types/index.ts
export interface SavedAddress {
  id?: number;
  name: string;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
}

export interface SavedPackage {
  id?: number;
  name: string;
  length: number;
  width: number;
  height: number;
  weight_lbs: number;
  weight_oz: number;
}

export interface ShipmentRecord {
  ship_to_name: ReactNode;
  order_number: ReactNode;
  id: number;
  session_id: string;
  
  // Ship From
  from_first_name: string;
  from_last_name: string;
  from_address: string;
  from_address2: string;
  from_city: string;
  from_zip: string;
  from_state: string;
  
  // Ship To
  to_first_name: string;
  to_last_name: string;
  to_address: string;
  to_address2: string;
  to_city: string;
  to_zip: string;
  to_state: string;
  
  // Package
  weight_lbs: number;
  weight_oz: number;
  length: number;
  width: number;
  height: number;
  
  // Contact
  phone_num1: string;
  phone_num2: string;
  
  // Reference
  order_no: string;
  item_sku: string;
  
  // Shipping
  shipping_service: string;
  shipping_price: number;
  
  // Status
  status: 'pending' | 'processed' | 'error';
  
  // Computed fields
  from_address_formatted: string;
  to_address_formatted: string;
  package_details: string;
}

export interface User {
  username: string;
  email: string;
  account_balance: number;
}