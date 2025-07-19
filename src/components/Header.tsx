'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isHome = pathname === '/';

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-green-400 to-purple-500 shadow-lg border-b border-blue-200"
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow">
            <Image
              src="/akrix-logo.png"
              alt="Akrix.ai Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Akrix.ai</h1>
            <p className="text-xs text-white/80">Receipt Generator</p>
          </div>
        </Link>
        {!isHome && (
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-50 transition-colors border border-blue-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>
            Back to Home
          </Link>
        )}
      </div>
    </motion.header>
  );
}
