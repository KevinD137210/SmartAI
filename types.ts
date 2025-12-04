
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID'
}

export enum DocumentType {
  INVOICE = 'INVOICE',
  QUOTATION = 'QUOTATION'
}

export type ProjectStatus = 'NOT_SET' | 'QUOTE_SENT' | 'DEPOSIT_RECEIVED' | 'PROGRESS_PAYMENT' | 'COMPLETED' | 'ARCHIVED';

export interface Project {
  id: string;
  name: string;
  clientId: string;
  status: ProjectStatus;
  description?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  projectId?: string; // Linked Project
  number: string;
  type: DocumentType;
  clientName: string;
  clientEmail: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  status: InvoiceStatus;
  notes?: string;
  total: number;
  emailSentAt?: string; // Track when the quote was sent for validity logic

  // Financial & Config Fields
  quoteMode?: 'COMPANY' | 'INDIVIDUAL';
  docLanguage?: string;
  currency?: string;
  taxRate?: number;
  discount?: number;
  depositPercentage?: number;
  progressPaymentPercentage?: number;
}

export interface UserProfile {
  companyName: string;
  contactName: string;
  address: string;
  email: string;
  phone: string;
  taxId: string;
  depositPercentage: number;
  secondPaymentPercentage: number;
  logo?: string; // Base64 string for logo image
  signature?: string; // Base64 string for signature image
}

export interface PriceCheckResult {
  text: string;
  sources: Array<{
    title: string;
    uri: string;
  }>;
}

export type ClientStatus = 'ACTIVE' | 'ARCHIVED';

export interface Client {
  id: string;
  status: ClientStatus;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  notes: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  description?: string;
  reminderMinutes?: number; // Minutes before event
  notified?: boolean;
}