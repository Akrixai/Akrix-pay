'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FileText, Download, Loader2, User, Mail, Phone, MapPin, CreditCard, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface DirectReceiptForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  amount: number;
  paymentMode: string;
  description?: string;
}

export function DirectReceiptGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<DirectReceiptForm>();

  const onSubmit = async (data: DirectReceiptForm) => {
    try {
      setIsGenerating(true);
      // Ensure amount is a number
      const payload = { ...data, amount: Number(data.amount) };
      console.log('📄 Generating direct receipt with data:', payload);

      const response = await fetch('/api/receipt/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to get error details from the response
        let errorMsg = 'Failed to generate receipt';
        try {
          const errData = await response.json();
          if (errData?.message) errorMsg = errData.message;
          if (errData?.errors) console.error('Validation errors:', errData.errors);
        } catch (e) {
          const text = await response.text();
          console.error('Non-JSON error response:', text);
        }
        throw new Error(errorMsg);
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `receipt-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('✅ Receipt generated and downloaded successfully');
      reset();
      alert('Receipt generated and downloaded successfully!');
    } catch (error: any) {
      console.error('💥 Error generating receipt:', error);
      alert(`Failed to generate receipt: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const inputVariants = {
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
    <div className="max-w-2xl w-full mx-auto p-4 sm:p-6 md:p-8 bg-white text-black rounded-lg shadow">
      <div className="mb-4">
        <Link href="/" className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>
          Back to Home
        </Link>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">
            Direct Receipt Generator
          </h2>
          <p className="text-black">
            Generate professional receipts instantly without payment processing
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black mb-4">
              Customer Information
            </h3>

            <motion.div
              custom={0}
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              <label htmlFor="customerName" className="block text-sm font-medium text-black mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register('customerName', { required: 'Customer name is required' })}
                  type="text"
                  id="customerName"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-black placeholder-gray-500"
                  placeholder="Enter customer's full name"
                />
              </div>
              {errors.customerName && (
                <p className="mt-1 text-sm text-red-600">{errors.customerName.message}</p>
              )}
            </motion.div>

            <motion.div
              custom={1}
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              <label htmlFor="customerEmail" className="block text-sm font-medium text-black mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register('customerEmail', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  id="customerEmail"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-black placeholder-gray-500"
                  placeholder="Enter customer's email address"
                />
              </div>
              {errors.customerEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.customerEmail.message}</p>
              )}
            </motion.div>

            <motion.div
              custom={2}
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              <label htmlFor="customerPhone" className="block text-sm font-medium text-black mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register('customerPhone', { required: 'Phone number is required' })}
                  type="tel"
                  id="customerPhone"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-black placeholder-gray-500"
                  placeholder="Enter customer's phone number"
                />
              </div>
              {errors.customerPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.customerPhone.message}</p>
              )}
            </motion.div>

            <motion.div
              custom={3}
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              <label htmlFor="customerAddress" className="block text-sm font-medium text-black mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  {...register('customerAddress', { required: 'Address is required' })}
                  id="customerAddress"
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-black placeholder-gray-500"
                  placeholder="Enter customer's complete address"
                />
              </div>
              {errors.customerAddress && (
                <p className="mt-1 text-sm text-red-600">{errors.customerAddress.message}</p>
              )}
            </motion.div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black mb-4">
              Payment Information
            </h3>

            <motion.div
              custom={4}
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              <label htmlFor="amount" className="block text-sm font-medium text-black mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register('amount', { 
                    required: 'Amount is required',
                    min: { value: 1, message: 'Amount must be greater than 0' }
                  })}
                  type="number"
                  step="0.01"
                  id="amount"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-black placeholder-gray-500"
                  placeholder="Enter amount (₹)"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </motion.div>

            <motion.div
              custom={5}
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              <label htmlFor="paymentMode" className="block text-sm font-medium text-black mb-2">
                Payment Mode <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  {...register('paymentMode', { required: 'Payment mode is required' })}
                  id="paymentMode"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-black"
                >
                  <option value="">Select payment mode</option>
                  <option value="cash">Cash</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="upi">UPI</option>
                  <option value="net_banking">Net Banking</option>
                  <option value="wallet">Digital Wallet</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              {errors.paymentMode && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentMode.message}</p>
              )}
            </motion.div>

            <motion.div
              custom={6}
              variants={inputVariants}
              initial="hidden"
              animate="visible"
              className="relative"
            >
              <label htmlFor="description" className="block text-sm font-medium text-black mb-2">
                Description (Optional)
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-black placeholder-gray-500"
                placeholder="Enter payment description or notes (optional)"
              />
            </motion.div>
          </div>

          {/* Generate Button */}
          <motion.button
            custom={7}
            variants={inputVariants}
            initial="hidden"
            animate="visible"
            type="submit"
            disabled={isGenerating}
            className={`w-full py-4 rounded-lg font-bold shadow-lg flex items-center justify-center gap-3 transition-all duration-200 ${isGenerating ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'}`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Receipt...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Generate & Download Receipt
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
