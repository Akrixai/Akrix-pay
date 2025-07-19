'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <motion.div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step.id < currentStep
                  ? 'bg-green-500 text-white'
                  : step.id === currentStep
                  ? 'bg-gradient-primary text-white'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {step.id < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                step.id
              )}
            </motion.div>
            <div className="mt-2 text-center">
              <p className={`text-sm font-medium ${
                step.id <= currentStep
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {step.description}
              </p>
            </div>
          </div>
          
          {index < steps.length - 1 && (
            <div className="flex-1 mx-4">
              <div className="h-0.5 bg-gray-200 dark:bg-gray-700 relative">
                <motion.div
                  className="h-full bg-gradient-primary"
                  initial={{ width: '0%' }}
                  animate={{ 
                    width: step.id < currentStep ? '100%' : '0%' 
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
