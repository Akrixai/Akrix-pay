import { FormData, PaymentInitiateResponse, PaymentVerifyRequest, PaymentVerifyResponse, ReceiptData } from '@/types';

const API_BASE_URL = '';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async initiatePayment(formData: FormData): Promise<PaymentInitiateResponse> {
    return this.request<PaymentInitiateResponse>('/api/payment/initiate', {
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
