'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle, Calendar, CreditCard, User, Mail, Phone, MapPin } from 'lucide-react';
import { PaymentVerifyResponse, PaymentMode } from '@/types';
import { generatePDF } from '@/utils/pdfGenerator';
import Image from 'next/image';

interface ReceiptProps {
  receiptData: PaymentVerifyResponse;
  onNewReceipt: () => void;
}

export function Receipt({ receiptData, onNewReceipt }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const getPaymentMethodLabel = (mode: PaymentMode) => {
    switch (mode) {
      case PaymentMode.CARD:
        return 'Credit/Debit Card';
      case PaymentMode.UPI:
        return 'UPI';
      case PaymentMode.NET_BANKING:
        return 'Net Banking';
      case PaymentMode.WALLET:
        return 'Digital Wallet';
      default:
        return 'Unknown';
    }
  };

  const handleDownloadPDF = async () => {
    if (receiptRef.current && receiptData.payment && receiptData.user) {
      try {
        await generatePDF(receiptRef.current, {
          receiptNumber: receiptData.receiptNumber || '',
          user: receiptData.user,
          payment: receiptData.payment,
          generatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to generate PDF:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!receiptData.payment || !receiptData.user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Payment Successful!
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Your receipt has been generated successfully
        </p>
      </motion.div>

      {/* Receipt Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8"
      >
        <div ref={receiptRef} className="receipt-content">
          {/* Header */}
          <div className="bg-gradient-primary text-white p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                  <Image
                    src="/akrix-logo.png"
                    alt="Akrix.ai Logo"
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Akrix.ai</h2>
                  <p className="text-white/80">Algorithms with Ambition</p>
                </div>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-semibold">RECEIPT</h3>
                <p className="text-white/80">#{receiptData.receiptNumber}</p>
              </div>
            </div>
          </div>

          {/* Receipt Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Customer Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-500" />
                  Customer Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">{receiptData.user.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{receiptData.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">{receiptData.user.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                      <p className="font-medium text-gray-900 dark:text-white">{receiptData.user.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary-500" />
                  Payment Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Payment Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(receiptData.payment.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Payment Method</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getPaymentMethodLabel(receiptData.payment.paymentMode)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                      <p className="font-medium text-green-600 dark:text-green-400 capitalize">
                        {receiptData.payment.status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount Summary */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-semibold text-gray-900 dark:text-white">Total Amount Paid</span>
                  <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    ₹{receiptData.payment.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Thank you for your payment! This receipt serves as proof of your transaction.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Generated on {formatDate(new Date().toISOString())} | Akrix.ai Receipt System
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <button
          onClick={handleDownloadPDF}
          className="flex items-center justify-center gap-2 bg-gradient-primary text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          <Download className="w-5 h-5" />
          Download PDF Receipt
        </button>
        <button
          onClick={onNewReceipt}
          className="flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Generate New Receipt
        </button>
      </motion.div>
    </div>
  );
}
