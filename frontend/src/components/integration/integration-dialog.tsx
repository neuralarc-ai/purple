import { X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface IntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const IntegrationDialog = ({ open, onOpenChange }: IntegrationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Connect your tools</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {['Slack', 'Notion', 'Google Drive', 'GitHub', 'Zapier', 'Airtable'].map((app) => (
              <div key={app} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{app}</span>
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs font-medium">{app[0]}</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Connect your {app} account
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button>
              <Check className="mr-2 h-4 w-4" />
              Connect
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
