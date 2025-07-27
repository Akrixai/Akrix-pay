export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum PaymentMode {
  CARD = 'card',
  UPI = 'upi',
  NET_BANKING = 'net_banking',
  WALLET = 'wallet',
  PHONEPE = 'phonepe',
  CASHFREE = 'cashfree',
  RAZORPAY = 'razorpay'
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  paymentMode: PaymentMode;
  status: PaymentStatus;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  phonepeTransactionId?: string;
  // Cashfree specific fields
  cashfreeOrderId?: string;
  cashfreePaymentId?: string;
  cashfreePaymentMethod?: string;
  cashfreePaymentTime?: string;
  cashfreePaymentStatus?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Receipt {
  id: string;
  paymentId: string;
  receiptNumber: string;
  generatedAt: string;
  payment?: Payment;
}

export interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  amount: number;
  paymentMode: PaymentMode;
}

export interface PaymentInitiateResponse {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  user: {
    name: string;
    email: string;
    phone: string;
  };
  // Cashfree specific fields
  cf_order_id?: string;
  payment_session_id?: string;
  payment_link?: string;
}

export interface PaymentVerifyRequest {
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  paymentId: string;
  // Cashfree specific fields
  order_id?: string;
  order_token?: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  receiptId?: string;
  receiptNumber?: string;
  payment?: Payment;
  user?: User;
  message?: string;
}

export interface ReceiptData {
  receipt: Receipt;
  payment: Payment;
  user: User;
}
