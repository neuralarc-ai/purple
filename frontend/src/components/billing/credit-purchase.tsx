'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, AlertCircle, Zap, AlertCircleIcon } from 'lucide-react';
import { apiClient, backendApi } from '@/lib/api-client';
import { toast } from 'sonner';

interface CreditPurchaseProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentBalance?: number;
    canPurchase: boolean;
    onPurchaseComplete?: () => void;
}

interface CreditPackage {
    credits: number;
    price: number;
    popular?: boolean;
    creditsPerDollar?: number;
}

const CREDIT_PACKAGES: CreditPackage[] = [
    { credits: 500, price: 1.00, creditsPerDollar: 500.0, popular: false },
    { credits: 1000, price: 11.99, creditsPerDollar: 83.4 },
    { credits: 2500, price: 28.99, creditsPerDollar: 86.2 },
    { credits: 5000, price: 55.99, popular: true, creditsPerDollar: 89.3 },
];

export function CreditPurchaseModal({ 
    open, 
    onOpenChange, 
    currentBalance = 0,
    canPurchase,
    onPurchaseComplete 
}: CreditPurchaseProps) {
    const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePurchase = async (amount: number) => {
        if (amount < 1) {
            setError('Minimum purchase amount is $1');
            return;
        }
        if (amount > 5000) {
            setError('Maximum purchase amount is $5000');
            return;
        }
        setIsProcessing(true);
        setError(null);
        try {
            const response = await backendApi.post('/billing/purchase-credits', {
                amount_dollars: amount,
                success_url: `${window.location.origin}/dashboard?credit_purchase=success`,
                cancel_url: `${window.location.origin}/dashboard?credit_purchase=cancelled`
            });
            if (response.data.url) {
                window.location.href = response.data.url;
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (err: any) {
            console.error('Credit purchase error:', err);
            const errorMessage = err.response?.data?.detail || err.message || 'Failed to create checkout session';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePackageSelect = (pkg: CreditPackage) => {
        setSelectedPackage(pkg);
        setCustomAmount('');
        setError(null);
    };

    const handleCustomAmountChange = (value: string) => {
        setCustomAmount(value);
        setSelectedPackage(null);
        setError(null);
    };

    const handleConfirmPurchase = () => {
        const amount = selectedPackage ? selectedPackage.price : parseFloat(customAmount);
        if (!isNaN(amount)) {
            handlePurchase(amount);
        } else {
            setError('Please select a package or enter a valid amount');
        }
    };

    if (!canPurchase) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Credits Not Available</DialogTitle>
                        <DialogDescription>
                            Credit purchases are only available for users on the highest subscription tier ($1000/month).
                        </DialogDescription>
                    </DialogHeader>
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Please upgrade your subscription to the highest tier to unlock credit purchases for unlimited usage.
                        </AlertDescription>
                    </Alert>
                    <div className="flex justify-end">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="text-center pb-6">
                    <DialogTitle className="flex items-center justify-center gap-3 text-2xl font-bold">
                        <div className="p-2 bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg">
                            <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        Purchase Credits
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground text-center">
                        Add credits to your account for usage beyond your subscription limit.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    <div>
                        <Label className="text-lg font-semibold mb-4 block text-center">Select a Package</Label>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {CREDIT_PACKAGES.map((pkg) => (
                                <Card
                                    key={pkg.credits}
                                    className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                                        selectedPackage?.credits === pkg.credits
                                            ? 'ring-2 ring-primary shadow-lg scale-105'
                                            : 'hover:shadow-lg border-2 hover:border-primary/20'
                                    } ${pkg.popular ? 'border-2 border-primary/30' : ''}`}
                                    onClick={() => handlePackageSelect(pkg)}
                                >
                                    <CardContent className="p-6 text-center relative">
                                        {pkg.popular && (
                                            <Badge className="absolute -top-3 -right-3 bg-primary text-primary-foreground font-semibold px-3 py-1">
                                                Popular
                                            </Badge>
                                        )}
                                        <div className="space-y-3">
                                            <div className="text-3xl font-bold text-primary">
                                                {pkg.credits.toLocaleString()}
                                            </div>
                                            <div className="text-sm text-muted-foreground font-medium">credits</div>
                                            <div className="text-2xl font-bold text-foreground">
                                                ${pkg.price}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                    
                    {error && (
                        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                        </Alert>
                    )}
                </div>
                
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isProcessing}
                        className="px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmPurchase}
                        disabled={isProcessing || (!selectedPackage && !customAmount)}
                        className="px-6 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Purchase Credits
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function CreditBalanceDisplay({ balance, canPurchase, onPurchaseClick, subscriptionData }: {
    balance: number;
    canPurchase: boolean;
    onPurchaseClick?: () => void;
    subscriptionData?: any;
}) {
    // Calculate the different credit types
    const subscriptionLimit = subscriptionData?.cost_limit ? Math.round((subscriptionData.cost_limit) * 100) : 0;
    const currentUsage = subscriptionData?.current_usage ? Math.round((subscriptionData.current_usage) * 100) : 0;
    
    // Free credits (if any) - for free tier users
    const freeCreditsLeft = subscriptionData?.plan_name === 'free' ? Math.max(0, subscriptionLimit - currentUsage) : 0;
    
    // Monthly credits (subscription-based)
    const monthlyCreditsLeft = subscriptionData?.plan_name !== 'free' ? Math.max(0, subscriptionLimit - currentUsage) : 0;
    
    // Add-on credits (purchased beyond subscription)
    const addOnCreditsLeft = balance;
    
    // Total credits should be the sum of all available credits
    const totalCreditsLeft = freeCreditsLeft + monthlyCreditsLeft + addOnCreditsLeft;

    return (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                            <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        Credit Balance
                    </span>
                    {canPurchase && onPurchaseClick && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onPurchaseClick}
                            className="text-xs h-8 px-3"
                        >
                            Add Credits
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <span className="text-sm font-medium text-foreground">Total Credits</span>
                        <span className="text-lg font-bold text-primary">{totalCreditsLeft.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-md">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                Free credits
                            </span>
                            <span className="font-medium">{freeCreditsLeft.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-md">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                Monthly credits
                            </span>
                            <span className="font-medium">{monthlyCreditsLeft.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded-md">
                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                Add-on credits
                            </span>
                            <span className="font-medium">{addOnCreditsLeft.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 text-center">
                    {canPurchase 
                        ? 'Available for usage beyond subscription limits'
                        : 'Upgrade to highest tier to purchase credits'
                    }
                </p>
            </CardContent>
        </Card>
    );
} 