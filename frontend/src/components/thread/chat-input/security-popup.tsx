'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Shield, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface SecurityPopupProps {
  isVisible: boolean;
  onClose: () => void;
  message: string;
  type?: 'warning' | 'error' | 'info';
  showCloseButton?: boolean;
}

export const SecurityPopup: React.FC<SecurityPopupProps> = ({
  isVisible,
  onClose,
  message,
  type = 'warning',
  showCloseButton = true,
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          bgColor: 'bg-red-50 dark:bg-red-950/20',
          borderColor: 'border-red-200 dark:border-red-800',
          titleColor: 'text-red-800 dark:text-red-200',
        };
      case 'info':
        return {
          icon: <Info className="h-5 w-5 text-blue-500" />,
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          titleColor: 'text-blue-800 dark:text-blue-200',
        };
      default:
        return {
          icon: <Shield className="h-5 w-5 text-amber-500" />,
          bgColor: 'bg-amber-50 dark:bg-amber-950/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
          titleColor: 'text-amber-800 dark:text-amber-200',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0, scale: 0.95 }}
          animate={{ opacity: 1, height: 'auto', scale: 1 }}
          exit={{ opacity: 0, height: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full mb-4"
        >
          <Card className={`${styles.bgColor} ${styles.borderColor} border-2 shadow-lg`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {styles.icon}
                  <CardTitle className={`text-base font-semibold ${styles.titleColor}`}>
                    Security Notice
                  </CardTitle>
                </div>
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-7 w-7 p-0 hover:bg-black/10 dark:hover:bg-white/10"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 pb-4">
              <div className="space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {message}
                </p>
                
                <div className="flex justify-end">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    size="sm"
                    className="min-w-[80px] h-8 text-xs"
                  >
                    Got it
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
