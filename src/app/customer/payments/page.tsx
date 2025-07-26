"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export default function CustomerPaymentsPage() {
  const [mobile, setMobile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const mob = typeof window !== 'undefined' ? localStorage.getItem('clientMobile') : null;
    setMobile(mob);
    setLoading(false);
    if (!mob) {
      router.replace('/login');
    }
  }, [router]);

  useEffect(() => {
    if (status === 'PAYMENT_SUCCESS') {
      setMessage('Payment successful!');
    } else if (status === 'PAYMENT_ERROR') {
      setMessage('Payment failed. Please try again.');
    } else if (status) {
      setMessage(`Payment status: ${status}`);
    }
  }, [status]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  }
  if (!mobile) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-100">
      <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-blue-100 mt-12 mb-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-black">Akrix Payment Options</h1>
          <button
            className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300 font-bold"
            onClick={() => { localStorage.removeItem('clientMobile'); window.location.href = '/'; }}
          >
            Logout
          </button>
        </div>
        {message && (
          <div className={`p-4 mb-4 text-center rounded-lg ${status === 'PAYMENT_SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}
        <p className="text-center text-lg mb-10 text-black">
          Choose your preferred payment method and generate professional receipts instantly
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card Payment */}
          <div className="bg-white border rounded-2xl shadow p-8 flex flex-col items-center">
            <div className="text-5xl mb-4">💳</div>
            <h2 className="text-xl font-bold mb-2 text-black">Online Payment</h2>
            <p className="text-black mb-6 text-center">Pay securely with Anything using Razorpay</p>
            <Link href="/online-payment">
              <button className="bg-gradient-to-r from-blue-600 to-purple-500 text-white px-6 py-3 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-600 transition">Online Payment</button>
            </Link>
          </div>
          {/* QR Payment */}
          <div className="bg-white border rounded-2xl shadow p-8 flex flex-col items-center">
            <div className="text-5xl mb-4"> QR</div>
            <h2 className="text-xl font-bold mb-2 text-black">QR Payment</h2>
            <p className="text-black mb-6 text-center">Scan QR code and pay using any UPI app</p>
            <Link href="/qr-payment">
              <button className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg hover:from-green-600 hover:to-blue-700 transition">Pay with QR</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 