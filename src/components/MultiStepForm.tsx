'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { FormData, PaymentMode } from '@/types';
import { PersonalInfoStep } from './form-steps/PersonalInfoStep';
import { PaymentDetailsStep } from './form-steps/PaymentDetailsStep';
import { ConfirmPayStep } from './form-steps/ConfirmPayStep';
import { StepIndicator } from './StepIndicator';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  paymentMode: z.nativeEnum(PaymentMode),
});

const steps = [
  { id: 1, title: 'Personal Information', description: 'Enter your details' },
  { id: 2, title: 'Payment Details', description: 'Choose payment method' },
  { id: 3, title: 'Confirm & Pay', description: 'Review and confirm' },
];

interface MultiStepFormProps {
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

export function MultiStepForm({ onSubmit, isLoading = false }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      amount: 0,
      paymentMode: PaymentMode.CARD,
    },
  });

  const { handleSubmit, trigger, getValues, formState: { errors } } = form;

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ['name', 'email', 'phone', 'address'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['amount', 'paymentMode'];
    }

    const isValid = await trigger(fieldsToValidate);

    if (isValid && currentStep < steps.length) {
      console.log('✅ Form validation passed, moving to step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else if (!isValid) {
      // Show validation errors
      console.log('❌ Validation errors:', errors);
      const errorMessages = Object.entries(errors).map(([field, error]) =>
        `${field}: ${error?.message || 'Invalid'}`
      ).join('\n');
      alert(`Please fix the following errors:\n\n${errorMessages}`);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onFormSubmit = (data: FormData) => {
    console.log('🚀 Form submitted with data:', data);
    onSubmit(data);
  };

  const handleSaveToDatabase = async () => {
    const formData = getValues();
    setIsSaving(true);

    try {
      // Validate the form first
      const isValid = await trigger();
      if (!isValid) {
        alert('Please fill in all required fields correctly.');
        return;
      }

      // Import the API service
      const { apiService } = await import('@/services/api');

      // Call the API to save to database (this will create user and payment record)
      const response = await apiService.initiatePayment(formData);

      if (response.paymentId) {
        alert(`✅ Information saved to database successfully!\n\n📋 Payment ID: ${response.paymentId}\n👤 User: ${response.user.name}\n📧 Email: ${response.user.email}\n💰 Amount: ₹${response.amount.toLocaleString('en-IN')}`);
      } else {
        throw new Error('Failed to save to database');
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      alert('❌ Failed to save to database. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep form={form} />;
      case 2:
        return <PaymentDetailsStep form={form} />;
      case 3:
        return <ConfirmPayStep form={form} formData={getValues()} onSaveToDatabase={handleSaveToDatabase} isSaving={isSaving} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center gradient-text mb-2">
          Akrix.ai Receipt Generator
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Complete your payment to generate a professional receipt
        </p>
      </div>

      <StepIndicator steps={steps} currentStep={currentStep} />

      <form onSubmit={handleSubmit(onFormSubmit)} className="mt-8">
        <div className="mb-8">
          <AnimatePresence mode="wait" custom={currentStep}>
            <motion.div
              key={currentStep}
              custom={currentStep}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>



        <div className="flex justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`w-full py-4 rounded-lg font-bold shadow-lg transition-all duration-200 flex items-center justify-center gap-3 ${currentStep === 1 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            &lt; Previous
          </button>

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="w-full py-4 rounded-lg font-bold shadow-lg bg-purple-600 text-white hover:bg-purple-700 transition-all duration-200 flex items-center justify-center gap-3"
            >
              Next &gt;
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-lg font-bold shadow-lg bg-green-600 text-white hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>Complete Payment & Generate Receipt</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
