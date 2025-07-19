"use client";

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('mobile', mobile)
      .single();
    setLoading(false);
    if (dbError || !data) {
      setError('Mobile number not found. Please try again.');
      return;
    }
    localStorage.setItem('clientMobile', mobile);
    router.replace('/customer/payments');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-400 via-blue-300 to-pink-200 animate-gradient-move overflow-hidden">
      {/* Animated floating shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <svg className="absolute animate-float-slow left-10 top-10 opacity-30" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="60" fill="#a5b4fc" /></svg>
        <svg className="absolute animate-float-fast right-20 top-32 opacity-20" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="20" fill="#f472b6" /></svg>
        <svg className="absolute animate-float-medium left-1/2 bottom-10 opacity-20" width="100" height="100" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="50" ry="30" fill="#38bdf8" /></svg>
      </div>
      <form onSubmit={handleLogin} className="relative z-10 bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl p-8 md:p-12 flex flex-col items-center w-full max-w-md animate-fade-in">
        <div className="mb-6 animate-bounce-slow">
          <img src="/akrix-logo.png" alt="Akrix Logo" className="h-16 w-16 drop-shadow-xl" />
        </div>
        <h1 className="text-3xl font-bold mb-6 text-black text-center bg-clip-text bg-gradient-to-r from-purple-700 via-blue-600 to-pink-500 animate-gradient-text">Client Login</h1>
        <input
          type="text"
          placeholder="Enter your mobile number"
          value={mobile}
          onChange={e => setMobile(e.target.value)}
          className="mb-4 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full text-black bg-white/90"
        />
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-600 to-purple-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-600 transition w-full animate-pop"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <style jsx global>{`
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-move {
          background-size: 200% 200%;
          animation: gradient-move 12s ease-in-out infinite;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-50px); }
        }
        .animate-float-fast { animation: float-fast 5s ease-in-out infinite; }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float-medium { animation: float-medium 7s ease-in-out infinite; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(.4,0,.2,1) both; }
        @keyframes gradient-text {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-text {
          background-size: 200% 200%;
          animation: gradient-text 6s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-bounce-slow { animation: bounce-slow 2.5s infinite; }
        @keyframes pop {
          0% { transform: scale(0.95); }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-pop { animation: pop 0.5s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
} 