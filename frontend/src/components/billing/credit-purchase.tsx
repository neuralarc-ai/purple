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
    { credits: 5000, price: 9.99, creditsPerDollar: 500.5 },
    { credits: 10000, price: 18.99, creditsPerDollar: 526.6 },
    { credits: 25000, price: 44.99, popular: true, creditsPerDollar: 555.7 },
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
            <DialogContent className="sm:max-w-6xl max-h-[95vh] overflow-hidden p-0">
                <div className="flex h-full">
                    {/* Left Side - Pricing Image */}
                    <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
                        {/* Background Image */}
                        <img 
                            src="/images/pricing.png" 
                            alt="Pricing" 
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/40"></div>
                        {/* Content */}
                        <div className="relative z-10 flex flex-col justify-start items-start p-8 lg:p-12 h-full">
                            <div className="mt-8">
                                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                                    Buy add-on credits
                                </h1>
                                <p className="text-white text-lg lg:text-xl max-w-md">
                                    Choose your credit package to continue using premium features
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Credit Packages */}
                    <div className="w-full md:w-1/2 bg-white p-8 flex flex-col">
                        {/* Credit Packages Grid */}
                        <div className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                                {CREDIT_PACKAGES.map((pkg, index) => (
                                    <div
                                        key={pkg.credits}
                                        className={`relative cursor-pointer transition-all duration-200 hover:bg-gray-50 p-12 flex flex-col justify-center items-center min-h-[600px] ${
                                            selectedPackage?.credits === pkg.credits
                                                ? 'bg-gray-50'
                                                : ''
                                        } ${pkg.popular ? 'bg-gray-50' : ''}`}
                                        onClick={() => handlePackageSelect(pkg)}
                                    >
                                        
                                        <div className="text-center space-y-16">
                                            {/* Icon */}
                                            <div className="flex justify-center">
                                                <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg">
                                                    {pkg.credits === 5000 && (
                                                        <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 640 640">
                                                            <path d="M535.3 70.7C541.7 64.6 551 62.4 559.6 65.2C569.4 68.5 576 77.7 576 88L576 274.9C576 406.1 467.9 512 337.2 512C260.2 512 193.8 462.5 169.7 393.3C134.3 424.1 112 469.4 112 520C112 533.3 101.3 544 88 544C74.7 544 64 533.3 64 520C64 445.1 102.2 379.1 160.1 340.3C195.4 316.7 237.5 304 280 304L360 304C373.3 304 384 293.3 384 280C384 266.7 373.3 256 360 256L280 256C240.3 256 202.7 264.8 169 280.5C192.3 210.5 258.2 160 336 160C402.4 160 451.8 137.9 484.7 116C503.9 103.2 520.2 87.9 535.4 70.7z"/>
                                                        </svg>
                                                    )}
                                                    {pkg.credits === 10000 && (
                                                        <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 640 640">
                                                            <path d="M576 96C576 204.1 499.4 294.3 397.6 315.4C389.7 257.3 363.6 205 325.1 164.5C365.2 104 433.9 64 512 64L544 64C561.7 64 576 78.3 576 96zM64 160C64 142.3 78.3 128 96 128L128 128C251.7 128 352 228.3 352 352L352 544C352 561.7 337.7 576 320 576C302.3 576 288 561.7 288 544L288 384C164.3 384 64 283.7 64 160z"/>
                                                        </svg>
                                                    )}
                                                    {pkg.credits === 25000 && (
                                                        <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 640 640">
                                                            <path d="M320 32C327 32 333.7 35.1 338.3 40.5L474.3 200.5C480.4 207.6 481.7 217.6 477.8 226.1C473.9 234.6 465.4 240 456 240L431.1 240L506.3 328.5C512.4 335.6 513.7 345.6 509.8 354.1C505.9 362.6 497.4 368 488 368L449.5 368L538.3 472.5C544.4 479.6 545.7 489.6 541.8 498.1C537.9 506.6 529.4 512 520 512L352 512L352 576C352 593.7 337.7 608 320 608C302.3 608 288 593.7 288 576L288 512L120 512C110.6 512 102.1 506.6 98.2 498.1C94.3 489.6 95.6 479.6 101.7 472.5L190.5 368L152 368C142.6 368 134.1 362.6 130.2 354.1C126.3 345.6 127.6 335.6 133.7 328.5L208.9 240L184 240C174.6 240 166.1 234.6 162.2 226.1C158.3 217.6 159.6 207.6 165.7 200.5L301.7 40.5C306.3 35.1 313 32 320 32z"/>
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Title */}
                                            <h3 className="text-xl font-semibold text-black">
                                                {pkg.credits.toLocaleString()}<br />credits
                                            </h3>
                                            
                                            {/* Subtitle */}
                                            <p className="text-sm text-gray-600">
                                                Premium Package
                                            </p>
                                            
                                            {/* Price - Most Prominent */}
                                            <div className="text-3xl font-bold text-black">
                                                ${pkg.price}
                                            </div>
                                            
                                            {/* Additional Info */}
                                            <p className="text-sm text-gray-600">
                                                One-time purchase
                                            </p>
                                            
                                            {/* Button */}
                                            <Button
                                                variant="default"
                                                size="lg"
                                                className={`px-8 py-3 rounded-full font-semibold transition-all text-base ${
                                                    pkg.popular 
                                                        ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                                                        : 'bg-white hover:bg-gray-100 text-black border border-gray-300'
                                                }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePurchase(pkg.price);
                                                }}
                                            >
                                                {pkg.popular ? (
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M8 5V19L19 12L8 5Z"/>
                                                        </svg>
                                                        <span>Buy now</span>
                                                    </div>
                                                ) : (
                                                    'Buy now'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {error && (
                            <Alert variant="destructive" className="mt-6 border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-red-800">{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>
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