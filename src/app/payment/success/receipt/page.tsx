'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Download, FileText, Home, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';

export default function PaymentReceiptPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const paymentId = searchParams.get('payment_id');

    if (!orderId && !paymentId) {
      setStatus('error');
      return;
    }

    // Fetch payment details and receipt
    const fetchPaymentDetails = async () => {
      try {
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            order_id: orderId,
            payment_id: paymentId,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setPaymentData(data.payment);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error fetching payment details:', error);
        setStatus('error');
      }
    };

    fetchPaymentDetails();
  }, [searchParams]);

  const downloadReceipt = async () => {
    if (!paymentData) return;
    
    try {
      setIsDownloading(true);

      // Try to use receipt ID first, then fall back to payment ID
      let downloadUrl;
      if (paymentData.receipt && paymentData.receipt.receiptId) {
        downloadUrl = `/api/receipt/download/${paymentData.receipt.receiptId}`;
      } else if (paymentData.receiptId) {
        downloadUrl = `/api/receipt/download/${paymentData.receiptId}`;
      } else {
        downloadUrl = `/api/receipt/payment/${paymentData.id}/pdf`;
      }

      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`Failed to download receipt: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `receipt-${paymentData.receiptNumber || paymentData.receipt?.receiptNumber || 'unknown'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert(`Failed to download receipt: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const sendReceiptEmail = async () => {
    if (!paymentData) return;
    
    setIsSendingEmail(true);
    try {
      const receiptId = paymentData.receiptId || paymentData.id;
      const response = await fetch(`/api/receipt/send-email/${receiptId}`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        alert('Receipt emails sent successfully!');
      } else {
        alert('Failed to send emails: ' + data.message);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      alert('Failed to send receipt email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl border border-blue-100"
      >
        {status === 'loading' && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-lg text-gray-700">Loading your receipt...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-12">
            <Alert variant="destructive">
              <AlertTitle>Error Retrieving Receipt</AlertTitle>
              <AlertDescription>
                We couldn't find your payment information. Please check your payment status or contact support.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.push('/online-payment')} 
              className="mt-6"
            >
              Return to Payments
            </Button>
          </div>
        )}

        {status === 'success' && paymentData && (
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

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">Your transaction has been completed successfully.</p>

            {/* Receipt Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-800 mb-3">Receipt Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">₹{paymentData.amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-mono text-sm">{paymentData.razorpayPaymentId || paymentData.cashfreePaymentId || paymentData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span>{new Date(paymentData.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-medium">Paid</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={downloadReceipt}
                disabled={isDownloading}
                className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                {isDownloading ? (
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
              </button>

              <button
                onClick={sendReceiptEmail}
                disabled={isSendingEmail}
                className="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Receipt Email
                  </>
                )}
              </button>
            </div>

            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
            >
              <Home className="w-5 h-5 mr-2" />
              Return to Home
            </Button>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200"
            >
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-left">
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    Receipt Information
                  </h4>
                  <p className="text-sm text-blue-700">
                    Your receipt has been generated and is ready for download. 
                    The PDF contains all payment details and can be used for your records.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}