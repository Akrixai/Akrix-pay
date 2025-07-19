"use client";

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DirectReceiptPage() {
  const [form, setForm] = useState({
    projectName: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    amount: '',
    paymentMode: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/admin/generate-direct-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });
      if (!response.ok) throw new Error('Failed to generate PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError('Failed to generate receipt. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
      <div className="w-full max-w-xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-yellow-200 mt-12 mb-12">
        <h1 className="text-3xl font-bold text-center mb-6 text-yellow-700">Direct Receipt Generation</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="projectName" value={form.projectName} onChange={handleChange} placeholder="Project Name" className="w-full border rounded px-3 py-2 text-black" required />
          <input name="customerName" value={form.customerName} onChange={handleChange} placeholder="Customer Name" className="w-full border rounded px-3 py-2 text-black" required />
          <input name="customerEmail" value={form.customerEmail} onChange={handleChange} placeholder="Customer Email" className="w-full border rounded px-3 py-2 text-black" required />
          <input name="customerPhone" value={form.customerPhone} onChange={handleChange} placeholder="Customer Phone" className="w-full border rounded px-3 py-2 text-black" required />
          <textarea name="customerAddress" value={form.customerAddress} onChange={handleChange} placeholder="Customer Address (all in one line)" className="w-full border rounded px-3 py-2 text-black" required />
          <input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="Amount" className="w-full border rounded px-3 py-2 text-black" required />
          <input name="paymentMode" value={form.paymentMode} onChange={handleChange} placeholder="Payment Mode" className="w-full border rounded px-3 py-2 text-black" required />
          <input name="description" value={form.description} onChange={handleChange} placeholder="Description (optional)" className="w-full border rounded px-3 py-2 text-black" />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" className="w-full py-3 rounded-lg font-bold shadow-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-all duration-200" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Receipt PDF'}
          </button>
        </form>
      </div>
    </div>
  );
} 