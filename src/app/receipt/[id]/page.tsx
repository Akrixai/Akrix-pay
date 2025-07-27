'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Download, Mail, Home, Loader2, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/formatters';
import { Receipt, Payment } from '@/types';

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<Receipt | null>(null);
  const [paymentData, setPaymentData] = useState<Payment | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    const fetchReceiptDetails = async () => {
      try {
        setLoading(true);
        const receiptId = params.id;
        
        if (!receiptId) {
          setError('No receipt ID found');
          setLoading(false);
          return;
        }

        // Fetch receipt details
        const response = await fetch(`/api/receipt/${receiptId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch receipt details');
        }
        
        const data = await response.json();
        setReceiptData(data.receipt);
        setPaymentData(data.payment);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching receipt details:', err);
        setError('Failed to load receipt details. Please try again.');
        setLoading(false);
      }
    };

    fetchReceiptDetails();
  }, [params.id]);

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

  const goHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Loading receipt details...</h2>
          <p className="text-gray-600 mt-2">Please wait while we fetch your receipt information.</p>
        </div>
      </div>
    );
  }

  if (error || !receiptData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Receipt Not Found</CardTitle>
            <CardDescription>We couldn't find the receipt you're looking for</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-700">{error || 'The receipt may have been deleted or the ID is incorrect.'}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={goHome}>Return to Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-100 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl border border-blue-100"
      >
        {/* Receipt Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <FileText className="w-12 h-12 text-blue-600" />
        </motion.div>

        {/* Receipt Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Receipt
          </h1>
          <p className="text-gray-600 mb-6">
            Receipt #{receiptData.receipt_number}
          </p>
        </motion.div>

        {/* Receipt Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-50 rounded-lg p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Receipt Details
          </h3>
          <div className="space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-blue-600">Receipt Number:</span>
              <span className="text-blue-900 font-mono">
                {receiptData.receipt_number}
              </span>
            </div>
            {paymentData?.order_id && (
              <div className="flex justify-between">
                <span className="text-blue-600">Order ID:</span>
                <span className="text-blue-900 font-mono">
                  {paymentData.order_id}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-blue-600">Amount:</span>
              <span className="text-blue-900 font-semibold">
                {formatCurrency(receiptData.amount)}
              </span>
            </div>
            {paymentData?.payment_mode && (
              <div className="flex justify-between">
                <span className="text-blue-600">Payment Method:</span>
                <span className="text-blue-900">
                  {paymentData.payment_mode}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-blue-600">Date:</span>
              <span className="text-blue-900">
                {new Date(receiptData.created_at).toLocaleString()}
              </span>
            </div>
            {receiptData.customer_name && (
              <div className="flex justify-between">
                <span className="text-blue-600">Customer:</span>
                <span className="text-blue-900">
                  {receiptData.customer_name}
                </span>
              </div>
            )}
            {receiptData.customer_email && (
              <div className="flex justify-between">
                <span className="text-blue-600">Email:</span>
                <span className="text-blue-900">
                  {receiptData.customer_email}
                </span>
              </div>
            )}
            {receiptData.customer_phone && (
              <div className="flex justify-between">
                <span className="text-blue-600">Phone:</span>
                <span className="text-blue-900">
                  {receiptData.customer_phone}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <Button
            onClick={handleDownloadReceipt}
            disabled={downloadingPdf}
            className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
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

          <Button
            onClick={goHome}
            variant="ghost"
            className="w-full flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Return to Home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}