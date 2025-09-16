import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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

export default function FeaturesSection() {
    return (
        <section className="py-12 md:py-18 md:mt-6">
            <div className="mx-auto max-w-5xl space-y-12 px-6">
                <motion.div 
                    className="relative z-10 grid items-center justify-center text-center gap-4 md:gap-12"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeBlurVariants}
                >
                    <h2 className="text-4xl xl:text-6xl font-semibold leading-none text-white">Stop switching between AI tools. <br />Start succeeding with one.</h2>
                    <p className="max-w-lg mx-auto text-white/80">Helium seamlessly integrates with your existing workflows to automate tasks, generate insights, and manage your business operations all from your intelligent digital companion.</p>
                </motion.div>
                <motion.div 
                    className="relative rounded-2xl p-3 md:-mx-8 lg:col-span-3"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={imageVariants}
                >
                    <div className="aspect-88/36 relative">
                        <div className="bg-linear-to-t z-10 rounded-2xl from-black absolute inset-0 to-transparent"></div>
                        {/* <Image src="/home/app-screen.jpeg" className="absolute inset-0 rounded-2xl" alt="payments illustration dark" width={2797} height={1137} /> */}
                        <Image src="/home/app-screen.jpeg" className="hidden dark:block rounded-xl" alt="payments illustration dark" width={2797} height={1137} />
                        <Image src="/home/app-screen.jpeg" className="dark:hidden rounded-xl" alt="payments illustration light" width={2797} height={1137} />
                    </div>
                </motion.div>
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={cardVariants}
                >
                    <Card className="mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/20 overflow-hidden shadow-zinc-950/5 *:text-center md:mt-16 bg-black/20 border-white/30">
                        <div className="group shadow-zinc-950/5">
                            <CardHeader className="pb-3">
                                <CardDecorator variant="orange">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6 text-white">
                                        <path d="M6 18h8"/>
                                        <path d="M3 22h18"/>
                                        <path d="M14 22a7 7 0 1 0 0-14h-1"/>
                                        <path d="M9 14h2"/>
                                        <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/>
                                        <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/>
                                    </svg>
                                </CardDecorator>

                                <h3 className="mt-6 font-medium text-white">Deeper, reliable intelligence</h3>
                            </CardHeader>

                            <CardContent>
                                <p className="text-sm text-white/80">Advanced AI agents that understand context and deliver accurate insights.</p>
                            </CardContent>
                        </div>

                        <div className="group shadow-zinc-950/5">
                            <CardHeader className="pb-3">
                                <CardDecorator variant="blue">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6 text-white">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                        <path d="M3 4m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z" />
                                        <path d="M7 20h10" />
                                        <path d="M9 16v4" />
                                        <path d="M15 16v4" />
                                        <path d="M9 12v-4" />
                                        <path d="M12 12v-1" />
                                        <path d="M15 12v-2" />
                                        <path d="M12 12v-1" />
                                    </svg>
                                </CardDecorator>

                                <h3 className="mt-6 font-medium text-white">Automates workflows</h3>
                            </CardHeader>

                            <CardContent>
                                <p className="mt-3 text-sm text-white/80">Streamline complex processes and accelerate research with intelligent automation.</p>
                            </CardContent>
                        </div>

                        <div className="group shadow-zinc-950/5">
                            <CardHeader className="pb-3">
                                <CardDecorator variant="green">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6 text-white">
                                        <path d="M14 4.1 12 6"/>
                                        <path d="m5.1 8-2.9-.8"/>
                                        <path d="m6 12-1.9 2"/>
                                        <path d="M7.2 2.2 8 5.1"/>
                                        <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"/>
                                    </svg>
                                </CardDecorator>

                                <h3 className="mt-6 font-medium text-white">No-code, simple to use</h3>
                            </CardHeader>

                            <CardContent>
                                <p className="mt-3 text-sm text-white/80">Build powerful AI workflows without writing code - intuitive interface for everyone.</p>
                            </CardContent>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </section>
    )
}

const CardDecorator = ({ children, variant = 'orange' }: { children: ReactNode; variant?: 'orange' | 'blue' | 'green' }) => {
    const getGridColor = () => {
        switch (variant) {
            case 'blue':
                return 'var(--color-helium-blue)';
            case 'green':
                return 'var(--color-helium-green)';
            default:
                return 'var(--color-helium-orange)';
        }
    };

    const getBorderColor = () => {
        switch (variant) {
            case 'blue':
                return 'border-helium-blue';
            case 'green':
                return 'border-helium-green';
            default:
                return 'border-helium-orange';
        }
    };

    return (
        <div className="relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
            <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-helium-orange)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-helium-orange)_1px,transparent_1px)] bg-[size:24px_24px]"
                style={{
                    backgroundImage: `linear-gradient(to right, ${getGridColor()} 1px, transparent 1px), linear-gradient(to bottom, ${getGridColor()} 1px, transparent 1px)`
                }}
            />
            <div
                aria-hidden
                className="bg-radial to-black absolute inset-0 from-transparent to-75%"
            />
            <div className={`bg-black absolute inset-0 m-auto flex size-12 items-center justify-center border ${getBorderColor()}`}>{children}</div>
        </div>
    );
}