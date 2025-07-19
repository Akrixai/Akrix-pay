'use client';

import { UseFormReturn } from 'react-hook-form';
import { motion } from 'framer-motion';
import { CreditCard, Smartphone, Building, Wallet, DollarSign } from 'lucide-react';
import { FormData, PaymentMode } from '@/types';

interface PaymentDetailsStepProps {
  form: UseFormReturn<FormData>;
}

export function PaymentDetailsStep({ form }: PaymentDetailsStepProps) {
  const { register, watch, setValue, formState: { errors } } = form;
  const selectedPaymentMode = watch('paymentMode');

  const paymentMethods = [
    {
      value: PaymentMode.CARD,
      label: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Pay securely with your card'
    },
    {
      value: PaymentMode.UPI,
      label: 'UPI',
      icon: Smartphone,
      description: 'Pay using UPI apps'
    },
    {
      value: PaymentMode.NET_BANKING,
      label: 'Net Banking',
      icon: Building,
      description: 'Pay through your bank'
    },
    {
      value: PaymentMode.WALLET,
      label: 'Digital Wallet',
      icon: Wallet,
      description: 'Pay using digital wallets'
    }
  ];

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
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
          Payment Details
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Enter the amount and choose your payment method
        </p>
      </div>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Amount (₹)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              id="amount"
              min="1"
              step="0.01"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter amount"
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.amount.message}
            </p>
          )}
        </motion.div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Payment Method
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method, index) => {
              const Icon = method.icon;
              const isSelected = selectedPaymentMode === method.value;
              
              return (
                <motion.div
                  key={method.value}
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setValue('paymentMode', method.value)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isSelected
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-medium ${
                        isSelected
                          ? 'text-primary-900 dark:text-primary-100'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {method.label}
                      </h3>
                      <p className={`text-xs ${
                        isSelected
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {method.description}
                      </p>
                    </div>
                    <div className={`flex-shrink-0 w-4 h-4 rounded-full border-2 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && (
                        <div className="w-full h-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                  </div>
                  <input
                    {...register('paymentMode')}
                    type="radio"
                    value={method.value}
                    className="sr-only"
                  />
                </motion.div>
              );
            })}
          </div>
          {errors.paymentMode && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.paymentMode.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
