import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { TextEffect } from '@/components/ui/text-effect'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { HeroHeader } from '@/components/header'
import { ThemeProvider } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'

const contentData = [
    {
        title: "While others rush to respond, we think to solve.",
        description: "Helium goes deeper than ChatGPT, smarter than Claude, integrates better than Grok and delivers what Perplexity can't real business intelligence."
    },
    {
        title: "Your entire AI workforce in one platform.",
        description: "Helium delivers autonomous agents that don't just chat they execute, automate, and integrate with your business to get real work done."
    },
    {
        title: "Beyond chat. Beyond search. Beyond limits.",
        description: "Helium AI's autonomous agents navigate the web, manage files, automate workflows, and deliver enterprise-grade intelligence that transforms how you work."
    }
]

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
    exit: {
        opacity: 0,
        filter: 'blur(10px)',
        y: -20,
        transition: {
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
}

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring' as const,
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

const imageVariants = {
    hidden: {
        opacity: 0,
        filter: 'blur(20px)',
        scale: 1.05,
    },
    visible: {
        opacity: 1,
        filter: 'blur(0px)',
        scale: 1,
        transition: {
            duration: 1.2,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
            delay: 0.2,
        },
    },
}

const badgeVariants = {
    hidden: {
        opacity: 0,
        filter: 'blur(15px)',
        y: 20,
    },
    visible: {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        transition: {
            duration: 1,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
            delay: 0.6,
        },
    },
}

export default function HeroSection() {
    const { user } = useAuth();
    const [currentContentIndex, setCurrentContentIndex] = useState(0);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentContentIndex((prevIndex) => 
                (prevIndex + 1) % contentData.length
            );
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, []);
    
    return (
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
            <div className="light">
                <HeroHeader />
                <main className="overflow-hidden">                
                <section className="h-screen">
                    <div className="relative">
                        <motion.div 
                            className="absolute inset-0 z-0 h-screen"
                            variants={imageVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Image
                                src="/home/hero-desktop.png"
                                alt="Hero Background"
                                fill
                                className="object-cover h-full"
                                priority
                            />
                        </motion.div>
                        {/* <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(90%_90%_at_50%_70%,transparent_0%,var(--color-background)_90%)]"></div> */}
                        <div className="mx-auto max-w-7xl px-6 z-20 translate-y-1/2">
                            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0 text-black z-20">
                                <motion.div
                                    variants={badgeVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="z-20"
                                >
                                    <Link
                                        href={user ? "/dashboard" : "https://waitlist.he2.ai"}
                                        target={user ? "_self" : "_blank"}
                                        rel={user ? undefined : "noopener noreferrer"}
                                        className="hover:bg-black/80 bg-black text-white group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-sm transition-colors duration-300">
                                        <span className="text-white group-hover:text-white transition-colors duration-300 ease-in-out text-sm">Unveiling Intelligence with True Depth</span>
                                        <span className="block h-4 w-0.5 border-l bg-white"></span>

                                        <div className="bg-white group-hover:bg-helium-orange size-6 overflow-hidden rounded-full duration-500">
                                            <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                                                <span className="flex size-6">
                                                    <ArrowRight className="m-auto size-3 text-white" />
                                                </span>
                                                <span className="flex size-6">
                                                    <ArrowRight className="m-auto size-3 text-black" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentContentIndex}
                                        variants={fadeBlurVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="z-20"
                                    >
                                        <TextEffect
                                            preset="fade-in-blur"
                                            speedSegment={0.3}
                                            as="h1"
                                            className="mt-8 text-balance text-6xl xl:text-7xl lg:mt-16 libre-baskerville-regular">
                                            {contentData[currentContentIndex].title}
                                        </TextEffect>
                                        <TextEffect
                                            per="line"
                                            preset="fade-in-blur"
                                            speedSegment={0.3}
                                            delay={0.5}
                                            as="p"
                                            className="mx-auto mt-8 max-w-2xl text-balance text-lg">
                                            {contentData[currentContentIndex].description}
                                        </TextEffect>
                                    </motion.div>
                                </AnimatePresence>

                                <AnimatedGroup
                                    variants={{
                                        container: {
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.05,
                                                    delayChildren: 0.75,
                                                },
                                            },
                                        },
                                        ...transitionVariants,
                                    }}
                                    className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row">
                                    <div
                                        key={1}
                                        className="bg-helium-orange/30 rounded-full border p-0.5">
                                        <Button
                                            asChild
                                            size="lg"
                                            className="rounded-full bg-white text-black hover:bg-white/80 px-8 py-3 text-lg font-semibold">
                                            {user ? (
                                                <Link href="/auth">
                                                    <span className="text-nowrap">Lift off</span>
                                                </Link>
                                            ) : (
                                                <Link href="https://waitlist.he2.ai" target="_blank" rel="noopener noreferrer">
                                                    <span className="text-nowrap">Join the waitlist</span>
                                                </Link>
                                            )}
                                        </Button>
                                    </div>
                                </AnimatedGroup>
                            </div>
                        </div>
                    </div>
                </section>                
                </main>
            </div>
        </ThemeProvider>
    )
}
