export enum TicketStatus {
  INBOUND_OPEN = 'INBOUND_OPEN',
  COMPLETED = 'COMPLETED',
  VOID = 'VOID'
}

export interface ScaleTicket {
  id: string;
  licensePlate: string;
  companyName?: string;
  materialName: string;
  pricePerKg: number;
  
  inboundWeight: number; // kg
  inboundImage: string; // base64
  inboundTimestamp: number;
  
  outboundWeight?: number; // kg
  outboundImage?: string; // base64
  outboundTimestamp?: number;
  
  netWeight?: number; // kg
  totalCost?: number;
  
  status: TicketStatus;
}

export interface SerialConfig {
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: 'none' | 'even' | 'odd';
}

export interface Material {
  id: string;
  name: string;
  pricePerKg: number;
}

export const AVAILABLE_MATERIALS: Material[] = [
  { id: 'mixed', name: 'Mixed Waste', pricePerKg: 0.15 },
  { id: 'concrete', name: 'Clean Concrete', pricePerKg: 0.05 },
  { id: 'wood', name: 'Clean Wood', pricePerKg: 0.08 },
  { id: 'metal', name: 'Scrap Metal', pricePerKg: -0.20 }, // Negative means we pay them
];