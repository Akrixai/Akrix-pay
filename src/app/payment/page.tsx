'use client';

import PaymentForm from '@/components/payments/PaymentForm';

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Make a Payment</h1>
        <PaymentForm />
      </div>
    </div>
  );
}