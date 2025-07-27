'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Image from 'next/image';

export type PaymentGateway = 'razorpay' | 'phonepe' | 'cashfree';

interface PaymentGatewaysProps {
  onSelect: (gateway: PaymentGateway) => void;
  selectedGateway: PaymentGateway | null;
  disabled?: boolean;
}

export default function PaymentGateways({ 
  onSelect, 
  selectedGateway, 
  disabled = false 
}: PaymentGatewaysProps) {
  const [hoveredGateway, setHoveredGateway] = useState<PaymentGateway | null>(null);

  const gateways = [
    { 
      id: 'razorpay' as PaymentGateway, 
      name: 'Razorpay', 
      logo: '/images/razorpay-logo.png',
      description: 'Fast and secure payments with Razorpay'
    },
    { 
      id: 'phonepe' as PaymentGateway, 
      name: 'PhonePe', 
      logo: '/images/phonepe-logo.png',
      description: 'Pay using PhonePe UPI or wallet'
    },
    { 
      id: 'cashfree' as PaymentGateway, 
      name: 'Cashfree', 
      logo: '/images/cashfree-logo.png',
      description: 'Multiple payment options with Cashfree'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-center">Select Payment Method</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {gateways.map((gateway) => (
          <motion.div
            key={gateway.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onHoverStart={() => setHoveredGateway(gateway.id)}
            onHoverEnd={() => setHoveredGateway(null)}
          >
            <Card 
              className={`cursor-pointer h-full transition-all duration-200 ${selectedGateway === gateway.id ? 'ring-2 ring-blue-500 shadow-md' : ''} ${disabled ? 'opacity-60' : ''}`}
              onClick={() => !disabled && onSelect(gateway.id)}
            >
              <CardContent className="p-6 flex flex-col items-center justify-between h-full">
                <div className="w-24 h-24 relative mb-4">
                  <Image 
                    src={gateway.logo} 
                    alt={`${gateway.name} logo`} 
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                
                <div className="text-center">
                  <h3 className="font-medium text-lg mb-2">{gateway.name}</h3>
                  <p className="text-sm text-gray-500">{gateway.description}</p>
                </div>
                
                <Button 
                  variant={selectedGateway === gateway.id ? "default" : "outline"}
                  className={`mt-4 w-full ${selectedGateway === gateway.id ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  disabled={disabled}
                  onClick={() => onSelect(gateway.id)}
                >
                  {selectedGateway === gateway.id ? 'Selected' : 'Select'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {hoveredGateway && !disabled && (
        <div className="text-center text-sm text-gray-500 mt-2">
          {hoveredGateway === 'razorpay' && 'Credit/Debit Cards, UPI, Netbanking, Wallets'}
          {hoveredGateway === 'phonepe' && 'UPI, PhonePe Wallet, Credit/Debit Cards'}
          {hoveredGateway === 'cashfree' && 'Cards, UPI, Netbanking, Wallets, Pay Later'}
        </div>
      )}
    </div>
  );
}