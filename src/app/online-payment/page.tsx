"use client";

import { useState, useEffect } from 'react';
import { RazorpayPayment } from '@/components/RazorpayPayment';
import { MultiStepForm } from '@/components/MultiStepForm';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function OnlinePaymentPage() {
  const [mobile, setMobile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const mob = typeof window !== 'undefined' ? localStorage.getItem('clientMobile') : null;
    setMobile(mob);
    setLoading(false);
    if (!mob) {
      router.replace('/login');
    }
  }, [router]);

  const handleFormSubmit = (data: any) => {
    setFormData(data);
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setPaymentError(null);
  };

  const handlePaymentError = (error: any) => {
    setPaymentError(error?.message || 'Payment failed. Please try again.');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  }
  if (!mobile) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-100">
      <div className="w-full max-w-2xl mx-auto mt-8 mb-12 px-2 sm:px-4 md:px-8">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-blue-100">
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>
              Back to Home
            </Link>
          </div>
          {!formData && !paymentSuccess && (
            <MultiStepForm onSubmit={handleFormSubmit} />
          )}
          {formData && !paymentSuccess && (
            <RazorpayPayment
              formData={formData}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          )}
          {paymentSuccess && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-green-600 mb-4">Payment Successful!</h2>
              <p className="text-lg text-black mb-6">Thank you for your payment. Your receipt will be sent to your email.</p>
              <Link href="/" className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition-colors">Back to Home</Link>
            </div>
          )}
          {paymentError && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Payment Failed</h2>
              <p className="text-lg text-black mb-6">{paymentError}</p>
              <button onClick={() => { setFormData(null); setPaymentError(null); }} className="inline-block bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 transition-colors">Try Again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 