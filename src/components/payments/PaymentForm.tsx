'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const PaymentForm = () => {
  const [formData, setFormData] = useState({
    amount: '',
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const initiatePayment = async () => {
    setLoading(true);
    
    try {
      // Create order on backend
      const response = await fetch('/api/payment/cashfree-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Load Cashfree SDK if not already loaded
        if (!window.cashfree) {
          const script = document.createElement('script');
          const cashfreeEnv = process.env.CASHFREE_ENV === 'production' ? 'prod' : 'sandbox';
          script.src = `https://sdk.cashfree.com/js/ui/2.0.0/cashfree.${cashfreeEnv}.js`;
          script.async = true;
          
          script.onload = () => {
            initializeCashfreeCheckout(data);
          };
          
          document.body.appendChild(script);
        } else {
          initializeCashfreeCheckout(data);
        }
      } else {
        alert('Failed to create order: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  const initializeCashfreeCheckout = (data: any) => {
    // Use a secure URL for the return URL
    // Cashfree requires HTTPS URLs for callbacks
    const baseUrl = process.env.CASHFREE_ENV === 'production'
      ? (process.env.NEXT_PUBLIC_APP_URL || 'https://akrixpay.vercel.app')
      : 'https://akrixpay.vercel.app';
      
    const checkoutOptions = {
      paymentSessionId: data.payment_session_id,
      returnUrl: `${baseUrl}/payment/success?order_id=${data.order_id}`,
      components: [
        "order-details",
        "card",
        "upi",
        "netbanking",
        "app",
        "paylater"
      ],
      style: {
        backgroundColor: "#ffffff",
        color: "#11385b",
        fontFamily: "Lato",
        fontSize: "14px",
        errorColor: "#ff0000",
        theme: "light"
      }
    };
    
    // @ts-ignore - Cashfree is loaded dynamically
    window.cashfree.checkout(checkoutOptions).then((result: any) => {
      if (result.error) {
        console.error('Payment error:', result.error.message);
        alert('Payment failed: ' + result.error.message);
      }
      
      if (result.redirect) {
        console.log('Payment redirect');
      }
    });
  };

  return (
    <div className="payment-form max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Payment Details</h2>
      
      <div className="space-y-4">
        <div>
          <input
            type="number"
            name="amount"
            placeholder="Amount (₹)"
            value={formData.amount}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <input
            type="text"
            name="customerName"
            placeholder="Full Name"
            value={formData.customerName}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <input
            type="email"
            name="customerEmail"
            placeholder="Email"
            value={formData.customerEmail}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <input
            type="tel"
            name="customerPhone"
            placeholder="Phone Number"
            value={formData.customerPhone}
            onChange={handleInputChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <Button
          onClick={initiatePayment}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ₹${formData.amount || 0}`
          )}
        </Button>
      </div>
    </div>
  );
};

export default PaymentForm;

// Add TypeScript declaration for window.cashfree
declare global {
  interface Window {
    cashfree: any;
  }
}