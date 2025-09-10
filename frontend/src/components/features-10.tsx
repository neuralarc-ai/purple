import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { ReactNode } from 'react'
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

const imageVariants = {
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

export default function Features() {
    return (
        <section className="bg-black py-16 md:py-32 dark:bg-transparent">
            <div className="mx-auto max-w-2xl px-6 lg:max-w-5xl">
                <motion.div 
                    className="mx-auto grid gap-4 lg:grid-cols-2 lg:grid-rows-2"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{
                        staggerChildren: 0.2,
                        delayChildren: 0.1,
                    }}
                >
                    <motion.div variants={cardVariants}>
                        <FeatureCard className="bg-black">
                        <CardHeader className="pb-3">
                            <CardHeading
                                icon={<i className="ri-task-line text-lg"></i>}
                                title="Autonomous Task Execution"
                                description="Schedule meetings, manage calendars, process invoices, and generate reports automatically."
                            />
                        </CardHeader>

                        <div className="relative flex-1 border-t border-dashed">
                            <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black to-transparent z-10"></div>
                            <div className="h-full p-1 px-6 flex items-center justify-center">
                                <motion.div
                                    variants={imageVariants}
                                    className="w-full h-full flex items-center justify-center"
                                >
                                    <Image
                                        src="/home/autonomous-task.png"
                                        className="rounded-t-lg object-contain max-h-full max-w-full"
                                        alt="task execution illustration"
                                        width={1207}
                                        height={929}
                                    />
                                </motion.div>
                            </div>
                        </div>
                        </FeatureCard>
                    </motion.div>

                    <motion.div variants={cardVariants}>
                        <FeatureCard className="bg-black">
                        <CardHeader className="pb-3">
                            <CardHeading
                                icon={<i className="ri-global-line text-lg"></i>}
                                title="Seamless Browser Automation"
                                description="Navigate the web, interact with websites, and automate data entry and competitor analysis."
                            />
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col">
                            <div className="relative flex-1">
                                <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black to-transparent z-10"></div>
                                <div className="h-full border flex items-center justify-center">
                                    <motion.div
                                        variants={imageVariants}
                                        className="w-full h-full flex items-center justify-center"
                                    >
                                        <Image
                                            src="/home/browser-automation.png"
                                            className="rounded-t-lg object-contain max-h-full max-w-full"
                                            alt="browser automation illustration"
                                            width={1207}
                                            height={929}
                                        />
                                    </motion.div>
                                </div>
                            </div>
                        </CardContent>
                        </FeatureCard>
                    </motion.div>

                    <motion.div variants={cardVariants}>
                        <FeatureCard className="bg-black">
                        <CardHeader className="pb-3">
                            <CardHeading
                                icon={<i className="ri-file-list-line text-lg"></i>}
                                title="Comprehensive File Management"
                                description="Create documents, PDFs, spreadsheets, webpages, and more efficiently."
                            />
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col">
                            <div className="relative flex-1">
                                <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black to-transparent z-10"></div>
                                <div className="h-full border flex items-center justify-center">
                                    <motion.div
                                        variants={imageVariants}
                                        className="w-full h-full flex items-center justify-center"
                                    >
                                        <Image
                                            src="/home/file-creation.png"
                                            className="rounded-t-lg object-contain max-h-full max-w-full"
                                            alt="file management illustration"
                                            width={1407}
                                            height={1129}
                                        />
                                    </motion.div>
                                </div>
                            </div>
                        </CardContent>
                        </FeatureCard>
                    </motion.div>

                    <motion.div variants={cardVariants}>
                        <FeatureCard className="bg-black">
                        <CardHeader className="pb-3">
                            <CardHeading
                                icon={<i className="ri-search-line text-lg"></i>}
                                title="Advanced Web & Search Capabilities"
                                description="Find information from web, academic papers, and news articles with intelligent search."
                            />
                        </CardHeader>

                        <div className="relative flex-1 border-t border-dashed">
                            <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black to-transparent z-10"></div>
                            <div className="h-full p-1 px-6 flex items-center justify-center">
                                <motion.div
                                    variants={imageVariants}
                                    className="w-full h-full flex items-center justify-center"
                                >
                                    <Image
                                        src="/home/web-search.png"
                                        className="rounded-t-lg object-contain max-h-full max-w-full"
                                        alt="web search illustration"
                                        width={1207}
                                        height={929}
                                    />
                                </motion.div>
                            </div>
                        </div>
                        </FeatureCard>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}

interface FeatureCardProps {
    children: ReactNode
    className?: string
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
    <Card className={cn('group relative rounded-none shadow-zinc-950/5 border-white/15 pb-0 h-full flex flex-col', className)}>
        <CardDecorator />
        {children}
    </Card>
)

const CardDecorator = () => (
    <>
        <span className="border-helium-orange z-40 absolute -left-px -top-px block size-2 border-l-2 border-t-2"></span>
        <span className="border-helium-orange z-40 absolute -right-px -top-px block size-2 border-r-2 border-t-2"></span>
        <span className="border-helium-orange z-40 absolute -bottom-px -left-px block size-2 border-b-2 border-l-2"></span>
        <span className="border-helium-orange z-40 absolute -bottom-px -right-px block size-2 border-b-2 border-r-2"></span>
    </>
)

interface CardHeadingProps {
    icon: ReactNode
    title: string
    description: string
}

const CardHeading = ({ icon, title, description }: CardHeadingProps) => (
    <div className="p-6">
        <span className="text-white/80 flex items-center gap-2">
            {icon}
            {title}
        </span>
        <p className="mt-8 text-2xl font-semibold text-white">{description}</p>
    </div>
)

