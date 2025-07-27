'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface NetworkStatusProps {
  onStatusChange?: (isOnline: boolean) => void;
}

export default function NetworkStatus({ onStatusChange }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine);
    
    // Define event handlers
    const handleOnline = () => {
      setIsOnline(true);
      setShowAlert(true);
      if (onStatusChange) onStatusChange(true);
      
      // Hide the alert after 5 seconds
      setTimeout(() => setShowAlert(false), 5000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowAlert(true);
      if (onStatusChange) onStatusChange(false);
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Call onStatusChange with initial status
    if (onStatusChange) onStatusChange(navigator.onLine);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onStatusChange]);

  if (!showAlert) return null;

  return (
    <Alert 
      variant={isOnline ? "default" : "destructive"}
      className={`mb-4 ${isOnline ? 'bg-green-50 text-green-800 border-green-200' : ''}`}
    >
      {isOnline ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      <AlertTitle>{isOnline ? 'Connected' : 'No Internet Connection'}</AlertTitle>
      <AlertDescription>
        {isOnline 
          ? 'Your internet connection has been restored.'
          : 'Please check your internet connection to proceed with payment.'
        }
      </AlertDescription>
    </Alert>
  );
}