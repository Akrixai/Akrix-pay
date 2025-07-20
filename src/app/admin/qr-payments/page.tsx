"use client";
import { useEffect, useState } from "react";

interface QRPayment {
  id: string;
  name: string;
  email: string;
  phone: string;
  amount: number;
  payment_status: string;
  payment_time: string;
  utr?: string;
}

export default function AdminQRPaymentsPage() {
  const [payments, setPayments] = useState<QRPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/qr-payments");
      const data = await res.json();
      if (data.success) setPayments(data.payments);
      else setError(data.message || "Failed to fetch payments");
    } catch (err: any) {
      setError(err.message || "Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (id: string) => {
    if (!confirm('Approve this payment?')) return;
    try {
      const res = await fetch(`/api/qr-payments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) fetchPayments();
      else alert(data.message || 'Failed to approve payment');
    } catch (err: any) {
      alert(err.message || 'Failed to approve payment');
    }
  };

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(fetchPayments, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-6">QR Payments</h1>
        {error && <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm mb-4">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-white">
            <thead>
              <tr className="bg-white/10">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">UTR</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8">No payments found.</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-white/10 hover:bg-white/5 transition">
                    <td className="px-4 py-2 font-semibold">{p.name}</td>
                    <td className="px-4 py-2">{p.email}</td>
                    <td className="px-4 py-2">{p.phone}</td>
                    <td className="px-4 py-2">₹{p.amount}</td>
                    <td className="px-4 py-2">{p.utr || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${p.payment_status === 'pending' ? 'bg-yellow-500/30 text-yellow-200' : 'bg-green-500/30 text-green-200'}`}>{p.payment_status}</span>
                      {p.payment_status === 'pending' && (
                        <button onClick={() => approvePayment(p.id)} className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-xs">Approve</button>
                      )}
                    </td>
                    <td className="px-4 py-2">{new Date(p.payment_time).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 