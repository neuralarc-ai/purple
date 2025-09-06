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
            <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader className="text-center pb-3">
                    <DialogTitle className="text-[32px] font-bold">
                        Buy add-on credits
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Credit Purchase Options */}
                    <div>
                        <div className="flex flex-col md:flex-row gap-4 justify-center items-stretch">
                            {CREDIT_PACKAGES.map((pkg, index) => (
                                <Card
                                    key={pkg.credits}
                                    className={`cursor-pointer transition-all duration-200 hover:scale-105 bg-muted/30 border-border flex-1 ${
                                        selectedPackage?.credits === pkg.credits
                                            ? 'ring-2 ring-primary shadow-lg scale-105'
                                            : 'hover:shadow-lg border-2 hover:border-primary/20'
                                    } ${pkg.popular ? 'border-2 border-primary/30' : ''}`}
                                    onClick={() => handlePackageSelect(pkg)}
                                >
                                    <CardContent className="p-3 text-center relative flex flex-col h-full">
                                        {pkg.popular && (
                                            <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1">
                                                Popular
                                            </Badge>
                                        )}
                                        
                                        {/* Credit card icons based on package size */}
                                        <div className="flex justify-center items-center mb-3 min-h-[32px]">
                                            {pkg.credits === 1000 && (
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    viewBox="0 0 24 24" 
                                                    fill="currentColor"
                                                    className="h-8 w-8 text-foreground"
                                                >
                                                    <path d="M4 7V17H18V7H4ZM3 5H19C19.5523 5 20 5.44772 20 6V18C20 18.5523 19.5523 19 19 19H3C2.44772 19 2 18.5523 2 18V6C2 5.44772 2.44772 5 3 5ZM21 9H23V15H21V9Z"></path>
                                                </svg>
                                            )}
                                            {pkg.credits === 2500 && (
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    viewBox="0 0 24 24" 
                                                    fill="currentColor"
                                                    className="h-8 w-8 text-foreground"
                                                >
                                                    <path d="M4 7V17H18V7H4ZM3 5H19C19.5523 5 20 5.44772 20 6V18C20 18.5523 19.5523 19 19 19H3C2.44772 19 2 18.5523 2 18V6C2 5.44772 2.44772 5 3 5ZM5 8H9V16H5V8ZM21 9H23V15H21V9Z"></path>
                                                </svg>
                                            )}
                                            {pkg.credits === 5000 && (
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg" 
                                                    viewBox="0 0 24 24" 
                                                    fill="currentColor"
                                                    className="h-10 w-10 text-primary"
                                                >
                                                    <path d="M8 19H3C2.44772 19 2 18.5523 2 18V6C2 5.44772 2.44772 5 3 5H9.625L8.45833 7H4V17H8V19ZM12.375 19L13.5417 17H18V7H14V5H19C19.5523 5 20 5.44772 20 6V18C20 18.5523 19.5523 19 19 19H12.375ZM21 9H23V15H21V9ZM12 11H15L10 19V13H7L12 5V11Z"></path>
                                                </svg>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-1 flex-grow">
                                            <div className="text-lg text-foreground mt-2">
                                                {pkg.credits.toLocaleString()} credits
                                            </div>
                                            <div className="text-sm text-gray-500 font-bold">
                                                <span className="text-xs">$</span>{pkg.price}
                                            </div>
                                        </div>
                                        
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="w-full mt-2 bg-white text-black hover:bg-gray-100 rounded-full px-4 py-1 text-base font-bold"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePackageSelect(pkg);
                                                handleConfirmPurchase();
                                            }}
                                        >
                                            Buy now
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                    
                    {/* Rules Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-foreground">Rules</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-start gap-2">
                                <span className="font-bold">1.</span>
                                <span>Only Helium Premium and Team versions can buy add-on credits.</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-bold">2.</span>
                                <span>Add-on credits can only be used during the membership period and do not expire.</span>
                            </div>
                           
                        </div>
                    </div>
                    
                    {error && (
                        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950/20">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                        </Alert>
                    )}
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
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-base font-semibold">
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
            </div>
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
        </div>
    );
} 