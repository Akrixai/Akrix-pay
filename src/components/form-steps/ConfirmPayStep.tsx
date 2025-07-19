'use client';

import { UseFormReturn } from 'react-hook-form';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, CreditCard, DollarSign, Shield } from 'lucide-react';
import { FormData, PaymentMode } from '@/types';

interface ConfirmPayStepProps {
  form: UseFormReturn<FormData>;
  formData: FormData;
  onSaveToDatabase?: () => void;
  isSaving?: boolean;
}

export function ConfirmPayStep({ formData, onSaveToDatabase, isSaving }: ConfirmPayStepProps) {
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

  const getPaymentMethodIcon = (mode: PaymentMode) => {
    switch (mode) {
      case PaymentMode.CARD:
        return CreditCard;
      case PaymentMode.UPI:
        return Phone;
      case PaymentMode.NET_BANKING:
        return Shield;
      case PaymentMode.WALLET:
        return DollarSign;
      default:
        return CreditCard;
    }
  };

  const PaymentIcon = getPaymentMethodIcon(formData.paymentMode);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
      },
    }),
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Confirm & Pay
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please review your details before proceeding with payment
        </p>
      </div>

      <div className="space-y-4">
        {/* Personal Information Summary */}
        <motion.div
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-500" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{formData.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium text-gray-900 dark:text-white">{formData.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                <p className="font-medium text-gray-900 dark:text-white">{formData.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                <p className="font-medium text-gray-900 dark:text-white">{formData.address}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Payment Summary */}
        <motion.div
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary-500" />
            Payment Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PaymentIcon className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Payment Method</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getPaymentMethodLabel(formData.paymentMode)}
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount</span>
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  ₹{formData.amount?.toLocaleString('en-IN') || '0'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Save to Database Option */}
        {onSaveToDatabase && (
          <motion.div
            custom={2}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c0 2.21 1.79 4 4 4h8c0-2.21-1.79-4-4-4H8c-2.21 0-4-1.79-4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4v10" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Save Information
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Save your information to our secure database before proceeding with payment.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onSaveToDatabase}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Save to Database
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Security Notice */}
        <motion.div
          custom={3}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800 p-4"
        >
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-1">
                Secure Payment
              </h4>
              <p className="text-sm text-primary-700 dark:text-primary-300">
                Your payment is secured with industry-standard encryption.
                After successful payment, you'll receive a professional receipt that you can download as PDF.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
