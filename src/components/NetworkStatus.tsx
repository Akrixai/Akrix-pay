'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface NetworkStatusProps {
  onNetworkChange?: (isOnline: boolean) => void;
  showNotifications?: boolean;
  position?: 'top' | 'bottom';
  context?: 'payment' | 'general';
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  onNetworkChange, 
  showNotifications = true,
  position = 'bottom',
  context = 'payment'
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showOfflineAlert, setShowOfflineAlert] = useState<boolean>(false);
  const [showOnlineAlert, setShowOnlineAlert] = useState<boolean>(false);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) {
      setShowOfflineAlert(true);
    }

    // Define event handlers
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
      setShowOnlineAlert(true);
      if (onNetworkChange) onNetworkChange(true);
      
      // Hide the online alert after 5 seconds
      setTimeout(() => setShowOnlineAlert(false), 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
      setShowOnlineAlert(false);
      if (onNetworkChange) onNetworkChange(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onNetworkChange]);
  
  // Don't show anything if notifications are disabled
  if (!showNotifications) return null;

  return (
    <div className={`fixed ${position === 'top' ? 'top-4' : 'bottom-4'} right-4 z-50 max-w-md flex flex-col gap-2`}>
      {showOfflineAlert && !isOnline && (
        <Alert 
          variant="destructive" 
          className={`animate-in fade-in ${position === 'top' ? 'slide-in-from-top-5' : 'slide-in-from-bottom-5'}`}
        >
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Network Disconnected</AlertTitle>
          <AlertDescription>
            {context === 'payment' 
              ? 'You are currently offline. Payment processing requires an internet connection. Please check your network and try again.'
              : 'Your device is currently offline. Some features may not work properly.'}
          </AlertDescription>
        </Alert>
      )}
      
      {showOnlineAlert && isOnline && (
        <Alert 
          className={`bg-green-50 border-green-200 animate-in fade-in ${position === 'top' ? 'slide-in-from-top-5' : 'slide-in-from-bottom-5'}`}
        >
          <Wifi className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Network Connected</AlertTitle>
          <AlertDescription className="text-green-700">
            {context === 'payment'
              ? 'Your internet connection has been restored. You can now proceed with your payment.'
              : 'Your connection has been restored.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default NetworkStatus;