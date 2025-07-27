import { FormData, PaymentInitiateResponse, PaymentVerifyRequest, PaymentVerifyResponse, ReceiptData } from '@/types';

const API_BASE_URL = '';

export class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
      // Add timeout signal to prevent hanging requests
      signal: options.signal || (typeof AbortController !== 'undefined' ? 
        new AbortController().signal : undefined)
    };

    // If no signal was provided and AbortController exists, create a timeout
    let timeoutId: NodeJS.Timeout | undefined;
    if (!options.signal && typeof AbortController !== 'undefined') {
      const controller = new AbortController();
      config.signal = controller.signal;
      // Set a 15-second timeout
      timeoutId = setTimeout(() => controller.abort(), 15000);
    }

    try {
      const response = await fetch(url, config);
      
      // Clear timeout if request completed
      if (timeoutId) clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      // Clear timeout if request failed
      if (timeoutId) clearTimeout(timeoutId);
      
      // Enhance error messages for common network issues
      if (error.name === 'AbortError') {
        console.error('API request timed out');
        throw new Error('Request timed out. Please check your connection and try again.');
      } else if (error.message?.includes('fetch failed') || error.message?.includes('network')) {
        console.error('API request failed due to network issue:', error);
        throw new Error('Network connection issue. Please check your internet connection and try again.');
      } else {
        console.error('API request failed:', error);
        throw error;
      }
    }
  }

  async initiatePayment(formData: FormData): Promise<PaymentInitiateResponse> {
    // Determine which API endpoint to use based on payment mode
    let endpoint = '/api/payment/initiate';
    
    if (formData.paymentMode === 'RAZORPAY') {
      endpoint = '/api/payment/create-order';
    } else if (formData.paymentMode === 'PHONEPE') {
      endpoint = '/api/payment/phonepe-order';
    } else if (formData.paymentMode === 'CASHFREE') {
      endpoint = '/api/payment/cashfree-order';
    }
    
    return this.request<PaymentInitiateResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  }

  async verifyPayment(verifyData: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    return this.request<PaymentVerifyResponse>('/api/payment/verify', {
      method: 'POST',
      body: JSON.stringify(verifyData),
    });
  }

  async getReceipt(receiptId: string): Promise<ReceiptData> {
    return this.request<ReceiptData>(`/api/receipt/download/${receiptId}`);
  }
}

export const apiService = new ApiService();
