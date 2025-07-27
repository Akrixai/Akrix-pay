'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Download, Mail, Home, Loader2, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/utils/formatters';
import { Receipt, Payment } from '@/types';

export default function PaymentReceiptPage() {
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
        const paymentId = params.paymentId;
        
        if (!paymentId) {
          setError('No payment ID found');
          setLoading(false);
          return;
        }

        // Fetch receipt details by payment ID
        const response = await fetch(`/api/receipt/payment/${paymentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch receipt details');
        }
        
        const data = await response.json();
        setPaymentData(data.payment);
        setReceiptData(data.receipt);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching receipt details:', err);
        setError('Failed to load receipt details. Please try again.');
        setLoading(false);
      }
    };

    fetchReceiptDetails();
  }, [params.paymentId]);

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
    try {
      setSendingEmail(true);
      
      let url;
      if (receiptData?.id) {
        url = `/api/receipt/send-email/${receiptData.id}`;
      } else if (paymentData?.id) {
        url = `/api/receipt/payment/${paymentData.id}/email`;
      } else {
        throw new Error('No receipt or payment ID available');
      }
      
      const response = await fetch(url, {
        method: 'POST'
      });
      
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

  const handleGoHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading receipt details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
            <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
            <p className="text-red-500 font-medium mb-2">Error</p>
            <p className="text-gray-500 dark:text-gray-400 text-center">{error}</p>
            <Button onClick={handleGoHome} className="mt-6" variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="bg-primary text-white">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5" />
              <CardTitle>Receipt</CardTitle>
            </div>
            <CardDescription className="text-primary-foreground/80">
              {paymentData ? `Payment #${paymentData.order_id || paymentData.id.substring(0, 8)}` : 'Payment Details'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {receiptData && (
                <div className="space-y-2">
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
                      {formatCurrency(receiptData.amount || paymentData?.amount || 0)}
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
                      {new Date(receiptData.created_at || paymentData?.created_at || Date.now()).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              
              {!receiptData && paymentData && (
                <div className="space-y-2">
                  {paymentData.receipt_number && (
                    <div className="flex justify-between">
                      <span className="text-blue-600">Receipt Number:</span>
                      <span className="text-blue-900 font-mono">
                        {paymentData.receipt_number}
                      </span>
                    </div>
                  )}
                  {paymentData.order_id && (
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
                      {formatCurrency(paymentData.amount || 0)}
                    </span>
                  </div>
                  {paymentData.payment_mode && (
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
                      {new Date(paymentData.created_at || Date.now()).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Status:</span>
                    <span className={`font-medium ${paymentData.status === 'success' || paymentData.status === 'completed' ? 'text-green-600' : 'text-orange-600'}`}>
                      {paymentData.status}
                    </span>
                  </div>
                </div>
              )}
              
              {!receiptData && !paymentData && (
                <div className="py-8 text-center">
                  <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-4" />
                  <p className="text-gray-500">No receipt information available</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <div className="flex gap-3 w-full">
              <Button 
                onClick={handleDownloadReceipt} 
                className="flex-1"
                disabled={downloadingPdf || (!receiptData?.id && !paymentData?.id)}
              >
                {downloadingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button 
                onClick={handleSendEmail} 
                variant="outline" 
                className="flex-1"
                disabled={sendingEmail || (!receiptData?.id && !paymentData?.id)}
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Email Receipt
                  </>
                )}
              </Button>
            </div>
            <Button onClick={handleGoHome} variant="ghost" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}