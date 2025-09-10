import { Gmail, HubSpot, GoogleDrive, Supabase, Twitter, LinkedIn, GoogleNotion, Discord, Shopify, GoogleSheets, GoogleMeet, GoogleDocs, GoogleSlides, Mailchimp } from '@/components/logos'
import { LogoIcon } from '@/components/logo'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { useAuth } from '@/components/AuthProvider'

export default function IntegrationsSection() {
    const { user } = useAuth()
    
    return (
        <section>
            <div className="bg-black py-24 md:py-32">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="bg-neutral-800/40 group scale-125 relative mx-auto max-w-[22rem] items-center justify-between space-y-6 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] sm:max-w-md">
                        <div
                            role="presentation"
                            className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1e1e1e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:32px_32px] opacity-50"></div>
                        <div>
                            <InfiniteSlider
                                gap={24}
                                speed={20}
                                speedOnHover={10}>
                                <IntegrationCard>
                                    <Gmail />
                                </IntegrationCard>
                                <IntegrationCard>
                                    <HubSpot />
                                </IntegrationCard>
                                <IntegrationCard>
                                    <GoogleDrive />
                                </IntegrationCard>
                                <IntegrationCard>
                                    <Supabase />
                                </IntegrationCard>
                                <IntegrationCard>
                                    <Twitter />
                                </IntegrationCard>
                                <IntegrationCard>
                                    <LinkedIn />
                                </IntegrationCard>
                            </InfiniteSlider>
                        </div>

                        <div>
                            <InfiniteSlider
                                gap={24}
                                speed={20}
                                speedOnHover={10}
                                reverse>
                                <IntegrationCard>
                                    <GoogleNotion />
                                </IntegrationCard>
                                <IntegrationCard>
                                    <Discord />
                                </IntegrationCard>
                                <IntegrationCard>
                                    <Shopify />
                                </IntegrationCard>
                                <IntegrationCard>
                                    <GoogleSheets />
                                </IntegrationCard>
                                <IntegrationCard>
                                    <GoogleMeet />
                                </IntegrationCard>
                                <IntegrationCard>
                                    <GoogleDocs />
                                </IntegrationCard>
                            </InfiniteSlider>
                        </div>
                        <div>
                            <InfiniteSlider
                                gap={24}
                                speed={20}
                                speedOnHover={10}>
                                <IntegrationCard>
                                    <GoogleSlides />
                                </IntegrationCard>
                                <IntegrationCard>
                                    <Mailchimp />
                                </IntegrationCard>
                                <IntegrationCard>
                                    <Gmail />
                                </IntegrationCard>
                                <IntegrationCard>
                                    <HubSpot />
                                </IntegrationCard>
                                <IntegrationCard>
                                    <GoogleDrive />
                                </IntegrationCard>
                                <IntegrationCard>
                                    <Supabase />
                                </IntegrationCard>
                            </InfiniteSlider>
                        </div>                        
                    </div>
                    <div className="mx-auto mt-24 max-w-lg space-y-6 text-center">
                        <h2 className="text-balance text-3xl font-semibold md:text-4xl text-white">100+ Integrations. Zero Friction. Total Control.</h2>
                        <p className="text-white/80">
                        Stop jumping between apps to get work done. Helium AI connects with your existing tools in just a few clicks, then lets you orchestrate everything through simple prompts.
                        </p>

                        <Button                                
                            size="sm"
                            className="rounded-full bg-helium-orange hover:bg-helium-orange/90 text-white"
                            asChild>
                            <Link href={user ? "/dashboard" : "https://waitlist.he2.ai"}>Get Started</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}

const IntegrationCard = ({ children, className, isCenter = false }: { children: React.ReactNode; className?: string; position?: 'left-top' | 'left-middle' | 'left-bottom' | 'right-top' | 'right-middle' | 'right-bottom'; isCenter?: boolean }) => {
    return (
        <div className={cn('bg-black/80 backdrop-blur-2xl relative z-20 flex size-12 rounded-full border', className)}>
            <div className={cn('m-auto size-fit *:size-6', isCenter && '*:size-6')}>{children}</div>
        </div>
    )
}
