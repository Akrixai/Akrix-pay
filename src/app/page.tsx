"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xl">Loading...</div>;
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-400 via-blue-300 to-pink-200 animate-gradient-move">
      {/* Animated floating shapes */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <svg className="absolute animate-float-slow left-10 top-10 opacity-30" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="60" fill="#a5b4fc" /></svg>
        <svg className="absolute animate-float-fast right-20 top-32 opacity-20" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="20" fill="#f472b6" /></svg>
        <svg className="absolute animate-float-medium left-1/2 bottom-10 opacity-20" width="100" height="100" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="50" ry="30" fill="#38bdf8" /></svg>
      </div>
      <div className="relative z-10 w-full max-w-xl mx-auto">
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl shadow-2xl px-8 py-14 flex flex-col items-center animate-fade-in">
          {/* Animated logo */}
          <div className="mb-6 animate-bounce-slow">
            <img src="/akrix-logo.png" alt="Akrix Logo" className="h-20 w-20 drop-shadow-xl" />
          </div>
          {/* Animated headline */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-blue-600 to-pink-500 animate-gradient-text mb-4 text-center drop-shadow-lg">
            Akrix Payment System
          </h1>
          <p className="text-lg md:text-xl text-gray-700 text-center mb-8 animate-fade-in-delayed">
            Choose your preferred payment method and generate professional receipts instantly
          </p>
          {!user ? (
            <div className="flex flex-col items-center gap-6 w-full">
              <p className="text-lg text-gray-700 mb-2 animate-fade-in-delayed">Please log in to access payment features.</p>
              <Link href="/login">
                <button className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-white px-10 py-4 rounded-xl font-bold text-xl shadow-lg hover:scale-105 hover:from-blue-700 hover:to-pink-600 transition-all duration-200 animate-pop">
                  Login
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 animate-fade-in-delayed">
              <p className="text-lg text-gray-700">Welcome back! Please use the menu to access payment features.</p>
            </div>
          )}
        </div>
      </div>
      {/* Custom animations */}
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
        .animate-fade-in-delayed { animation: fade-in 1.5s cubic-bezier(.4,0,.2,1) both; animation-delay: 0.5s; }
        @keyframes pop {
          0% { transform: scale(0.95); }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-pop { animation: pop 0.5s cubic-bezier(.4,0,.2,1) both; }
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
      `}</style>
    </div>
  );
}
