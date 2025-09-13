'use client';

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PricingSection } from '@/components/home/sections/pricing-section';
import { CreditBalanceDisplay, CreditPurchaseModal } from '@/components/billing/credit-purchase';
import { isLocalMode } from '@/lib/config';
import {
    getSubscription,
    createPortalSession,
    SubscriptionStatus,
} from '@/lib/api';
import { backendApi } from '@/lib/api-client';
import { useAuth } from '@/components/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Zap } from 'lucide-react';

interface BillingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    returnUrl?: string;
    showUsageLimitAlert?: boolean;
    showPromotionalMessage?: boolean;
}

export function BillingModal({ open, onOpenChange, returnUrl = typeof window !== 'undefined' ? window?.location?.href || '/' : '/', showUsageLimitAlert = false, showPromotionalMessage = false }: BillingModalProps) {
    const { session, isLoading: authLoading } = useAuth();
    const [subscriptionData, setSubscriptionData] = useState<SubscriptionStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isManaging, setIsManaging] = useState(false);
    const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);

    useEffect(() => {
        async function fetchSubscription() {
            if (!open || authLoading || !session) return;

            try {
                setIsLoading(true);
                const data = await getSubscription();
                setSubscriptionData(data);
                setError(null);
            } catch (err) {
                console.error('Failed to get subscription:', err);
                setError(err instanceof Error ? err.message : 'Failed to load subscription data');
            } finally {
                setIsLoading(false);
            }
        }

        fetchSubscription();
    }, [open, session, authLoading]);

    const handleManageSubscription = async () => {
        try {
            setIsManaging(true);
            const { url } = await createPortalSession({ return_url: returnUrl });
            window.location.href = url;
        } catch (err) {
            console.error('Failed to create portal session:', err);
            setError(err instanceof Error ? err.message : 'Failed to create portal session');
        } finally {
            setIsManaging(false);
        }
    };

    // Local mode content
    if (isLocalMode()) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Billing & Subscription</DialogTitle>
                        <DialogDescription>
                            Local development mode settings and information
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-4 bg-muted/30 border border-border rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                            Running in local development mode - billing features are disabled
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                            All premium features are available in this environment
                        </p>
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
                            src="/images/pricing2.png" 
                            alt="Pricing" 
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/40"></div>
                        {/* Content */}
                        <div className="relative z-10 flex flex-col justify-start items-start p-8 lg:p-12 h-full">
                            <div className="mt-8">
                                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                                    Upgrade Your Plan
                                </h1>
                                <p className="text-white text-lg lg:text-xl max-w-md">
                                    Choose your billing option to continue using premium features
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Billing Options */}
                    <div className="w-full md:w-1/2 bg-white p-8 flex flex-col">
                        {/* Show error message if subscription data failed to load */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                                <p className="text-sm text-red-800">Error loading billing status: {error}</p>
                            </div>
                        )}

                        {/* Billing Options Grid */}
                        <div className="flex-1">
                            <div className="grid grid-cols-1 gap-0">
                                {/* Try it Out Option */}
                                <div className="relative cursor-pointer transition-all duration-200 hover:bg-gray-50 p-12 flex flex-col justify-center items-center min-h-[200px]">
                                    <div className="text-center space-y-6">
                                        {/* Price - Most Prominent */}
                                        <div className="text-4xl font-bold text-black">$1.99</div>
                                        
                                        {/* Title */}
                                        <h3 className="text-xl font-semibold text-black">Try it Out!</h3>
                                        
                                        {/* Subtitle */}
                                        <p className="text-sm text-gray-600">Get 3,000 credits to test our platform</p>
                                        
                                        {/* Button */}
                                        <Button
                                            variant="default"
                                            size="lg"
                                            className="px-8 py-3 rounded-full font-semibold transition-all text-base bg-white hover:bg-gray-100 text-black border border-gray-300"
                                            onClick={async () => {
                                                try {
                                                    setIsManaging(true);
                                                    console.log('Creating checkout session...');
                                                    
                                                    const response = await backendApi.post('/billing/purchase-credits', {
                                                        amount_dollars: 1.99,
                                                        success_url: `${window.location.origin}/dashboard?trial=success`,
                                                        cancel_url: `${window.location.origin}/dashboard?trial=cancelled`
                                                    });
                                                    
                                                    console.log('Full response:', response);
                                                    console.log('Response data:', response?.data);
                                                    console.log('Response status:', response?.status);
                                                    
                                                    if (response?.data?.url) {
                                                        console.log('Redirecting to:', response.data.url);
                                                        window.location.href = response.data.url;
                                                    } else if (response?.url) {
                                                        console.log('Redirecting to:', response.url);
                                                        window.location.href = response.url;
                                                    } else {
                                                        console.error('Unexpected response structure:', response);
                                                        throw new Error('No checkout URL received. Response: ' + JSON.stringify(response));
                                                    }
                                                } catch (err: any) {
                                                    console.error('Failed to create checkout session:', err);
                                                    console.error('Error details:', err.response?.data);
                                                    setError(err.response?.data?.detail || err.message || 'Failed to create checkout session');
                                                } finally {
                                                    setIsManaging(false);
                                                }
                                            }}
                                            disabled={isManaging}
                                        >
                                            {isManaging ? 'Processing...' : 'Get Started'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Pre-Pay Option */}
                                <div className="relative cursor-pointer transition-all duration-200 hover:bg-gray-50 p-12 flex flex-col justify-center items-center min-h-[200px]">
                                    <div className="text-center space-y-6">
                                        {/* Price - Most Prominent */}
                                        <div className="text-4xl font-bold text-black">Pre-Pay</div>
                                        
                                        {/* Title */}
                                        <h3 className="text-xl font-semibold text-black">Add Credits</h3>
                                        
                                        {/* Subtitle */}
                                        <p className="text-sm text-gray-600">Purchase credits in bulk for better value</p>
                                        
                                        {/* Button */}
                                        <Button
                                            variant="default"
                                            size="lg"
                                            className="px-8 py-3 rounded-full font-semibold transition-all text-base bg-white hover:bg-gray-100 text-black border border-gray-300"
                                            onClick={() => {
                                                setShowCreditPurchaseModal(true);
                                            }}
                                        >
                                            Add Credits
                                        </Button>
                                    </div>
                                </div>

                                {/* PAYG Option */}
                                <div className="relative cursor-pointer transition-all duration-200 hover:bg-gray-50 p-12 flex flex-col justify-center items-center min-h-[200px] opacity-50">
                                    <div className="text-center space-y-6">
                                        {/* Price - Most Prominent */}
                                        <div className="text-4xl font-bold text-gray-500">P.A.Y.G</div>
                                        
                                        {/* Title */}
                                        <h3 className="text-xl font-semibold text-gray-500">Coming Soon</h3>
                                        
                                        {/* Subtitle */}
                                        <p className="text-sm text-gray-500">Pay according to your consumption</p>
                                        
                                        {/* Button */}
                                        <Button
                                            variant="default"
                                            size="lg"
                                            className="px-8 py-3 rounded-full font-semibold transition-all text-base bg-gray-300 text-gray-500 cursor-not-allowed"
                                            disabled
                                        >
                                            Coming Soon
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
            
            {/* Credit Purchase Modal */}
            <CreditPurchaseModal
                open={showCreditPurchaseModal}
                onOpenChange={setShowCreditPurchaseModal}
                currentBalance={subscriptionData?.credit_balance_credits || Math.round((subscriptionData?.credit_balance || 0) * 100)}
                canPurchase={true} // Temporarily enable for all users for testing
                onPurchaseComplete={() => {
                    // Refresh subscription data
                    getSubscription().then(setSubscriptionData);
                    setShowCreditPurchaseModal(false);
                }}
            />
        </Dialog>
    );
} 