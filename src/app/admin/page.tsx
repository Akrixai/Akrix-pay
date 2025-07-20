"use client";

import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-400 via-blue-300 to-pink-200 animate-gradient-move">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <svg className="absolute animate-float-slow left-10 top-10 opacity-30" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="60" fill="#a5b4fc" /></svg>
        <svg className="absolute animate-float-fast right-20 top-32 opacity-20" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="20" fill="#f472b6" /></svg>
        <svg className="absolute animate-float-medium left-1/2 bottom-10 opacity-20" width="100" height="100" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="50" ry="30" fill="#38bdf8" /></svg>
      </div>
      <div className="relative z-10 w-full max-w-3xl mx-auto">
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl shadow-2xl px-8 py-14 flex flex-col items-center animate-fade-in">
          <div className="mb-6 animate-bounce-slow">
            <img src="/akrix-logo.png" alt="Akrix Logo" className="h-20 w-20 drop-shadow-xl" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-blue-600 to-pink-500 animate-gradient-text mb-4 text-center drop-shadow-lg">
            Akrix Admin Dashboard
          </h1>
          <p className="text-lg text-gray-700 text-center mb-8 animate-fade-in-delayed">
            Welcome, Admin! Choose a section to manage users, payments, receipts, or reminders.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
            <Link href="/admin/users">
              <div className="cursor-pointer bg-white/80 border border-blue-200 rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-all duration-200">
                <span className="text-4xl mb-2">👤</span>
                <span className="font-bold text-lg text-blue-700">Users</span>
              </div>
            </Link>
            <Link href="/admin/payments">
              <div className="cursor-pointer bg-white/80 border border-green-200 rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-all duration-200">
                <span className="text-4xl mb-2">💳</span>
                <span className="font-bold text-lg text-green-700">Payments</span>
              </div>
            </Link>
            <Link href="/admin/receipts">
              <div className="cursor-pointer bg-white/80 border border-purple-200 rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-all duration-200">
                <span className="text-4xl mb-2">📄</span>
                <span className="font-bold text-lg text-purple-700">Receipts</span>
              </div>
            </Link>
            <Link href="/admin/reminders">
              <div className="cursor-pointer bg-white/80 border border-pink-200 rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-all duration-200">
                <span className="text-4xl mb-2">⏰</span>
                <span className="font-bold text-lg text-pink-700">Reminders</span>
              </div>
            </Link>
            <Link href="/admin/direct-receipt">
              <div className="cursor-pointer bg-white/80 border border-yellow-200 rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-all duration-200">
                <span className="text-4xl mb-2">📝</span>
                <span className="font-bold text-lg text-yellow-700">Direct Receipt Generation</span>
              </div>
            </Link>
            <Link href="/admin/qr-payments">
              <div className="cursor-pointer bg-white/80 border border-indigo-200 rounded-2xl shadow-lg p-8 flex flex-col items-center hover:scale-105 transition-all duration-200">
                <span className="text-4xl mb-2">🔗 QR</span>
                <span className="font-bold text-lg text-indigo-700">QR Payments</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
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
