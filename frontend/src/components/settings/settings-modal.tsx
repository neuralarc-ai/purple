'use client';

import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { isLocalMode } from '@/lib/config';
import { PersonalAccountBillingPage } from '@/components/settings/billing-content';
import { PersonalAccountProfilePage } from '@/components/settings/profile-content';
import { PersonalAccountUsageLogsPage } from '@/components/settings/usage-logs-content';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('billing');

  const items = [
    { name: 'Profile', href: 'profile' },
    { name: 'Billing', href: 'billing' },
    { name: 'Usage Logs', href: 'usage-logs' },
    ...(isLocalMode() ? [{ name: 'Local .Env Manager', href: 'env-manager' }] : []),
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <PersonalAccountProfilePage />;
      case 'billing':
        return <PersonalAccountBillingPage onTabChange={setActiveTab} />;
      case 'usage-logs':
        return <PersonalAccountUsageLogsPage />;
      case 'env-manager':
        return <div>Env Manager Content</div>;
      default:
        return <PersonalAccountBillingPage onTabChange={setActiveTab} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[680px] h-[600px] p-0 rounded-lg" showCloseButton={false}>
        <VisuallyHidden>
          <DialogTitle>Settings</DialogTitle>
        </VisuallyHidden>
        <div className="flex h-full">
          {/* Left Navigation */}
          <aside className="w-1/4 p-3 border-r border-border">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 mb-3 h-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-3 w-3 mr-2" />
              Close
            </Button>
            
            <nav className="flex flex-col space-y-1">
              {items.map((item) => (
                <Button
                  key={item.href}
                  variant={activeTab === item.href ? 'default' : 'ghost'}
                  size="sm"
                  className={`justify-start text-xs font-medium transition-colors h-8 ${
                    activeTab === item.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                  }`}
                  onClick={() => setActiveTab(item.href)}
                >
                  {item.name}
                </Button>
              ))}
            </nav>
          </aside>
          
          {/* Main Content */}
          <div className="flex-1 p-3 overflow-y-auto">
            {renderContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
