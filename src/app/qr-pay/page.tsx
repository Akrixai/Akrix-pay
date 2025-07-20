"use client";
import { useState } from "react";
import Image from "next/image";

export default function QRPayPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", amount: "", utr: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/qr-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (data.success) setSuccess(true);
      else setError(data.message || "Failed to submit payment");
    } catch (err: any) {
      setError(err.message || "Failed to submit payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-2xl border border-white/20 flex flex-col md:flex-row gap-8 shadow-2xl">
        {/* QR Section */}
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="relative group cursor-pointer" onClick={() => setShowQRModal(true)}>
            <Image src="/QR.jpeg" alt="QR Code" width={200} height={200} className="rounded-xl border-4 border-white/30 shadow-lg transition-transform group-hover:scale-105" />
            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-80">Click to enlarge</span>
          </div>
          <h2 className="mt-4 text-lg font-bold text-white">Scan & Pay</h2>
          <p className="text-gray-300 text-sm text-center mt-2">Scan the QR code with your UPI app to pay. Then fill the form to notify us of your payment.</p>
        </div>
        {/* Form Section */}
        <form onSubmit={handleSubmit} className="flex-1 space-y-5">
          <h3 className="text-xl font-semibold text-white mb-2">Payment Details</h3>
          <input name="name" value={form.name} onChange={handleChange} required placeholder="Your Name" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="email" value={form.email} onChange={handleChange} required type="email" placeholder="Email" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="phone" value={form.phone} onChange={handleChange} required placeholder="Phone" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="amount" value={form.amount} onChange={handleChange} required type="number" min="1" placeholder="Amount" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input name="utr" value={form.utr} onChange={handleChange} required placeholder="UTR/Transaction ID" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {error && <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm">{error}</div>}
          {success && <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-200 text-sm">Payment details submitted! We will verify and contact you soon.</div>}
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
            {loading ? "Submitting..." : "Submit Payment Details"}
          </button>
        </form>
      </div>
      {/* Modal for QR enlarge */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setShowQRModal(false)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <Image src="/QR.jpeg" alt="QR Code Large" width={500} height={500} className="rounded-2xl border-8 border-white shadow-2xl" />
            <button className="absolute top-2 right-2 bg-black/60 text-white rounded-full px-3 py-1 text-lg" onClick={() => setShowQRModal(false)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
} 