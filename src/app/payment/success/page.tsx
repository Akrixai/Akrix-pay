'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle, Download, Mail, Home, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/formatters';
import { Payment, Receipt } from '@/types';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [paymentData, setPaymentData] = useState<Payment | null>(null);
  const [receiptData, setReceiptData] = useState<Receipt | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const orderToken = searchParams.get('order_token'); // This might be null now

    if (!orderId) {
      setStatus('error');
      setMessage('Invalid payment information. Missing order ID.');
      return;
    }

    // Verify the payment with your backend
    const verifyPayment = async () => {
      try {
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: orderId,
            order_token: orderToken,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Payment successful!');
          // Store payment and receipt data if available
          if (data.payment) setPaymentData(data.payment);
          if (data.receipt) setReceiptData(data.receipt);
        } else {
          setStatus('error');
          setMessage(data.message || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('error');
        setMessage('Failed to verify payment');
      }
    };

    verifyPayment();
  }, [searchParams]);

  // Function to handle receipt download
  const handleDownloadReceipt = async () => {
    try {
      setDownloadingPdf(true);
      
      let url;
      if (receiptData?.id) {
        url = `/api/receipt/download/${receiptData.id}`;
      } else if (paymentData?.id) {
        url = `/api/receipt/payment/${paymentData.id}/pdf`;
      } else {
        throw new Error('No receipt or payment ID available');
      }
      
      // Fetch the PDF
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }
      
      // Create a blob from the PDF Stream
      const blob = await response.blob();
      
      // Create a link element
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Receipt-${receiptData?.receipt_number || paymentData?.order_id || 'payment'}.pdf`;
      
      // Append to the document and trigger download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      setDownloadingPdf(false);
    } catch (err) {
      console.error('Error downloading receipt:', err);
      setDownloadingPdf(false);
      alert('Failed to download receipt. Please try again.');
    }
  };

  // Function to send receipt via email
  const handleSendEmail = async () => {
    if (!receiptData?.id) {
      alert('Receipt information not available');
      return;
    }
    
    try {
      setSendingEmail(true);
      const response = await fetch(`/api/receipt/send-email/${receiptData.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      
      const data = await response.json();
      alert(data.message || 'Receipt sent successfully!');
      setSendingEmail(false);
    } catch (err) {
      console.error('Error sending receipt email:', err);
      setSendingEmail(false);
      alert('Failed to send receipt email. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl border border-blue-100">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-lg">Verifying your payment...</p>
          </div>
        )}

        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </motion.div>
            
            <h2 className="text-2xl font-bold mt-4">Payment Successful!</h2>
            <p className="mt-2 text-gray-600 mb-6">{message}</p>
            
            {/* Payment Details */}
            {paymentData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-green-50 rounded-lg p-6 mb-6 text-left"
              >
                <h3 className="text-lg font-semibold text-green-900 mb-4 text-center">
                  Payment Details
                </h3>
                <div className="space-y-3">
                  {paymentData.order_id && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Order ID:</span>
                      <span className="text-green-900 font-mono">
                        {paymentData.order_id}
                      </span>
                    </div>
                  )}
                  {receiptData?.receipt_number && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Receipt Number:</span>
                      <span className="text-green-900 font-mono">
                        {receiptData.receipt_number}
                      </span>
                    </div>
                  )}
                  {paymentData.amount && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Amount:</span>
                      <span className="text-green-900 font-semibold">
                        {formatCurrency(paymentData.amount)}
                      </span>
                    </div>
                  )}
                  {paymentData.payment_mode && (
                    <div className="flex justify-between">
                      <span className="text-green-600">Payment Method:</span>
                      <span className="text-green-900">
                        {paymentData.payment_mode}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {/* Receipt Actions */}
            {(receiptData?.id || paymentData?.id) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-3 mt-4"
              >
                <Button
                  onClick={handleDownloadReceipt}
                  disabled={downloadingPdf}
                  className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  {downloadingPdf ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download Receipt
                    </>
                  )}
                </Button>

                {receiptData?.id && (
                  <Button
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        Send Receipt to Email
                      </>
                    )}
                  </Button>
                )}
              </motion.div>
            )}
            
            <Button 
              onClick={() => router.push('/')} 
              className="mt-6 w-full flex items-center justify-center gap-2"
              variant="ghost"
            >
              <Home className="w-5 h-5" />
              Return to Home
            </Button>
          </motion.div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold mt-4">Payment Failed</h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <div className="space-y-3 mt-6">
              <Button 
                onClick={() => router.push('/payment')} 
                className="w-full"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => router.push('/')} 
                variant="outline"
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}