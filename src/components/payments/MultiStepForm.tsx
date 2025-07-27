'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormData } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, User, Mail, Phone, CreditCard, FileText } from 'lucide-react';

interface MultiStepFormProps {
  onSubmit: (formData: FormData) => void;
  initialData?: Partial<FormData>;
  isLoading?: boolean;
}

export default function MultiStepForm({ onSubmit, initialData = {}, isLoading = false }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({
    name: '',
    email: '',
    phone: '',
    amount: '',
    description: '',
    ...initialData
  });

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      onSubmit(formData as FormData);
    }
  };

  const isFormValid = () => {
    if (currentStep === 1) {
      return !!formData.name && !!formData.email && !!formData.phone;
    } else if (currentStep === 2) {
      return !!formData.amount && parseFloat(formData.amount as string) > 0;
    } else {
      return true; // Step 3 is optional description
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Online Payment</CardTitle>
        <CardDescription>
          {currentStep === 1 && 'Enter your contact information'}
          {currentStep === 2 && 'Enter payment details'}
          {currentStep === 3 && 'Review and confirm'}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent>
          {/* Progress Indicator */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  {step === 1 && <User size={18} />}
                  {step === 2 && <CreditCard size={18} />}
                  {step === 3 && <FileText size={18} />}
                </div>
                <span className={`text-xs mt-2 ${currentStep >= step ? 'text-blue-600' : 'text-gray-500'}`}>
                  {step === 1 && 'Contact'}
                  {step === 2 && 'Amount'}
                  {step === 3 && 'Review'}
                </span>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      className="pl-10"
                      value={formData.name || ''}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-10"
                      value={formData.email || ''}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      placeholder="Enter your phone number"
                      className="pl-10"
                      value={formData.phone || ''}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="amount">Payment Amount (₹)</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      className="pl-10"
                      value={formData.amount || ''}
                      onChange={(e) => updateFormData('amount', e.target.value)}
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Payment Description (Optional)</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="description"
                      placeholder="What is this payment for?"
                      className="pl-10"
                      value={formData.description || ''}
                      onChange={(e) => updateFormData('description', e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 text-center">Payment Summary</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-600">Name:</span>
                      <span className="text-blue-900 font-medium">{formData.name}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-blue-600">Email:</span>
                      <span className="text-blue-900">{formData.email}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-blue-600">Phone:</span>
                      <span className="text-blue-900">{formData.phone}</span>
                    </div>
                    
                    <div className="flex justify-between pt-2 border-t border-blue-200">
                      <span className="text-blue-600">Amount:</span>
                      <span className="text-blue-900 font-bold">₹{parseFloat(formData.amount as string).toFixed(2)}</span>
                    </div>
                    
                    {formData.description && (
                      <div className="flex justify-between">
                        <span className="text-blue-600">Description:</span>
                        <span className="text-blue-900">{formData.description}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800">
                  <p>Please review your information carefully before proceeding to payment.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>

        <CardFooter className="flex justify-between">
          {currentStep > 1 ? (
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <ChevronLeft size={16} />
              Back
            </Button>
          ) : (
            <div></div> // Empty div to maintain layout with justify-between
          )}

          {currentStep < 3 ? (
            <Button 
              type="button" 
              onClick={nextStep} 
              disabled={!isFormValid() || isLoading}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Processing...' : 'Proceed to Payment'}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}