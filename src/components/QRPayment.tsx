'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Upload, FileText, Send, Download, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface QRPaymentProps {
  amount: number;
  customerData: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}

export default function QRPayment({ amount, customerData }: QRPaymentProps) {
  const [step, setStep] = useState(1); // 1: QR Display, 2: UTR Submission, 3: Success
  const [paymentId, setPaymentId] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [error, setError] = useState('');

  const handleInitiateQRPayment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payment/qr-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...customerData,
          amount,
          description: 'Payment to Akrix via QR Code',
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPaymentId(data.paymentId);
        setStep(2);
      } else {
        setError('Failed to initiate QR payment');
      }
    } catch (error) {
      setError('Error initiating payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
    }
  };

  const handleUTRSubmission = async () => {
    if (!utrNumber || !screenshot) {
      setError('Please provide both UTR number and payment screenshot');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/payment/verify-utr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          utr: utrNumber,
          screenshot: screenshot.name, // In real implementation, upload file to server
        }),
      });

      const data = await response.json();
      if (data.success) {
        setReceiptData(data.receipt);
        setStep(3);
      } else {
        setError(data.message || 'Payment verification failed');
      }
    } catch (error) {
      setError('Error verifying payment');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReceipt = async () => {
    try {
      const response = await fetch(`/api/receipt/download/${receiptData.receiptId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Receipt_${receiptData.receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const sendReceiptEmail = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/receipt/send-email/${receiptData.receiptId}`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        alert('Receipt emails sent successfully to both you and Akrix!');
      } else {
        alert('Failed to send emails: ' + data.message);
      }
    } catch (error) {
      alert('Error sending emails');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Step 1: QR Code Display */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="flex items-center justify-center mb-6">
              <QrCode className="w-8 h-8 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-800">Pay with QR Code</h2>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
              <p className="text-lg font-semibold text-gray-800 mb-2">Amount to Pay</p>
              <p className="text-3xl font-bold text-blue-600">₹{amount.toLocaleString('en-IN')}</p>
            </div>

            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 mb-6">
              <Image
                src="/QR.jpeg"
                alt="Akrix Payment QR Code"
                width={300}
                height={300}
                className="mx-auto rounded-lg shadow-md"
              />
              <p className="text-sm text-gray-600 mt-4">
                Scan this QR code with any UPI app to make payment
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Scan the QR code with your UPI app</li>
                    <li>Enter the amount: ₹{amount.toLocaleString('en-IN')}</li>
                    <li>Complete the payment</li>
                    <li>Take a screenshot of the payment confirmation</li>
                    <li>Note down the UTR number from your payment app</li>
                  </ol>
                </div>
              </div>
            </div>

            <button
              onClick={handleInitiateQRPayment}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'I Have Completed the Payment'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: UTR Submission */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200"
        >
          <div className="flex items-center justify-center mb-6">
            <FileText className="w-8 h-8 text-green-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Verify Your Payment</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UTR Number *
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="Enter 12-digit UTR number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={12}
              />
              <p className="text-xs text-gray-500 mt-1">
                UTR number is usually 12 digits and can be found in your payment confirmation
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Screenshot *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                  id="screenshot-upload"
                />
                <label
                  htmlFor="screenshot-upload"
                  className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                >
                  Click to upload screenshot
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Upload a clear screenshot of your payment confirmation
                </p>
                {screenshot && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {screenshot.name} uploaded
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleUTRSubmission}
              disabled={isLoading || !utrNumber || !screenshot}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying Payment...' : 'Verify Payment'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Success & Receipt */}
      {step === 3 && receiptData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200"
        >
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Payment Successful!</h2>
            <p className="text-gray-600">Your payment has been verified and processed</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Receipt Number</p>
                <p className="font-semibold">{receiptData.receiptNumber}</p>
              </div>
              <div>
                <p className="text-gray-600">Amount Paid</p>
                <p className="font-semibold text-green-600">₹{amount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-gray-600">UTR Number</p>
                <p className="font-semibold">{utrNumber}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className="font-semibold text-green-600">✓ Completed</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={downloadReceipt}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Receipt
            </button>
            <button
              onClick={sendReceiptEmail}
              disabled={isLoading}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-5 h-5 mr-2" />
              Send Receipt Email
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
