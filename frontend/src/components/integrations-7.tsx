import { Gmail, HubSpot, GoogleDrive, Supabase, Twitter, LinkedIn, GoogleNotion, Discord, Shopify, GoogleSheets, GoogleMeet, GoogleDocs, GoogleSlides, Mailchimp } from '@/components/logos'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { InfiniteSlider } from '@/components/ui/infinite-slider'
import { useAuth } from '@/components/AuthProvider'
import { motion } from 'framer-motion'

const fadeBlurVariants = {
    hidden: {
        opacity: 0,
        filter: 'blur(10px)',
        y: 20,
    },
    visible: {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        transition: {
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
}

const cardVariants = {
    hidden: {
        opacity: 0,
        filter: 'blur(12px)',
        y: 30,
    },
    visible: {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        transition: {
            type: 'spring' as const,
            bounce: 0.3,
            duration: 1.2,
        },
    },
}

const sliderVariants = {
    hidden: {
        opacity: 0,
        filter: 'blur(15px)',
        scale: 1.05,
    },
    visible: {
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        transition: {
            duration: 1,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
            delay: 0.3,
        },
    },
}

export default function IntegrationsSection() {
    const { user } = useAuth()
    
    return (
        <section className="mt-12 md:mt-20">
            <div className="bg-black">
                <div className="mx-auto max-w-5xl px-6">
                    <motion.div 
                        className="bg-neutral-800/40 group scale-125 relative mx-auto max-w-[22rem] items-center justify-between space-y-6 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] sm:max-w-md"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={sliderVariants}
                    >
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
                    </motion.div>
                    <motion.div 
                        className="mx-auto mt-24 space-y-6 text-center"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={fadeBlurVariants}
                    >
                        <h2 className="text-balance text-3xl font-semibold md:text-4xl text-white">100+ Integrations. Zero Friction. Total Control.</h2>
                        <p className="text-white/80 max-w-2xl text-balance mx-auto">
                        Stop jumping between apps to get work done. Helium AI connects with your existing tools in just a few clicks, then lets you orchestrate everything through simple prompts.
                        </p>

                        <Button                                
                            size="sm"
                            className="rounded-full bg-helium-orange hover:bg-helium-orange/90 text-white"
                            asChild>
                            <Link href={user ? "/dashboard" : "https://waitlist.he2.ai"}>Get Started</Link>
                        </Button>
                    </motion.div>
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
