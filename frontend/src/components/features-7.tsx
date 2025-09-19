import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'

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


export default function FeaturesSection() {
    const { t } = useLanguage();
    
    return (
        <section className="py-12 md:py-18">
            <div className="mx-auto max-w-5xl space-y-8 px-6">
                <motion.div 
                    className="relative z-10 grid items-center justify-center text-center gap-3 md:gap-8"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeBlurVariants}
                >
                    <h2 className="text-4xl xl:text-6xl font-semibold leading-none text-white">{t.features.title}</h2>
                    <p className="max-w-lg mx-auto text-white/80">{t.features.description}</p>
                </motion.div>
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={cardVariants}
                >
                    <Card className="mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 overflow-hidden shadow-zinc-950/5 *:text-center md:mt-16 bg-black/20 ">
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

                                <h3 className="mt-6 font-medium text-white">{t.features.card_1.title}</h3>
                            </CardHeader>

                            <CardContent>
                                <p className="text-base text-balance text-white/80">{t.features.card_1.description}</p>
                            </CardContent>
                        </div>

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

                                <h3 className="mt-6 font-medium text-white">{t.features.card_2.title}</h3>
                            </CardHeader>

                            <CardContent>
                                <p className="text-base text-balance text-white/80">{t.features.card_2.description}</p>
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

                                <h3 className="mt-6 font-medium text-white">{t.features.card_3.title}</h3>
                            </CardHeader>

                            <CardContent>
                                <p className="text-base text-balance text-white/80">{t.features.card_3.description}</p>
                            </CardContent>
                        </div>
                    </Card>
                </motion.div>
                
                {/* Horizontal Divider */}
                <div className="flex items-center justify-center my-8">
                    <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full max-w-2xl"></div>
                </div>

                {/* Second Row of Cards */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={cardVariants}
                >
                    <Card className="mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 overflow-hidden shadow-zinc-950/5 *:text-center bg-black/20">
                        <div className="group shadow-zinc-950/5">
                            <CardHeader className="pb-3">
                                <CardDecorator variant="purple">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6 text-white">
                                        <path d="M12 7v14"/>
                                        <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>
                                    </svg>
                                </CardDecorator>

                                <h3 className="mt-6 font-medium text-white">{t.features.card_4.title}</h3>
                            </CardHeader>

                            <CardContent>
                                <p className="text-base text-balance text-white/80">{t.features.card_4.description}</p>
                            </CardContent>
                        </div>

                        <div className="group shadow-zinc-950/5">
                            <CardHeader className="pb-3">
                                <CardDecorator variant="cyan">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6 text-white">
                                        <path d="M16.051 12.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z"/>
                                        <path d="M8 15H7a4 4 0 0 0-4 4v2"/>
                                        <circle cx="10" cy="7" r="4"/>
                                    </svg>
                                </CardDecorator>

                                <h3 className="mt-6 font-medium text-white">{t.features.card_5.title}</h3>
                            </CardHeader>

                            <CardContent>
                                <p className="text-base text-balance text-white/80">{t.features.card_5.description}</p>
                            </CardContent>
                        </div>

                        <div className="group shadow-zinc-950/5">
                            <CardHeader className="pb-3">
                                <CardDecorator variant="yellow">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6 text-white">
                                        <path d="M11 1V2H7C5.34315 2 4 3.34315 4 5V8C4 10.7614 6.23858 13 9 13H15C17.7614 13 20 10.7614 20 8V5C20 3.34315 18.6569 2 17 2H13V1H11ZM6 5C6 4.44772 6.44772 4 7 4H17C17.5523 4 18 4.44772 18 5V8C18 9.65685 16.6569 11 15 11H9C7.34315 11 6 9.65685 6 8V5ZM9.5 9C10.3284 9 11 8.32843 11 7.5C11 6.67157 10.3284 6 9.5 6C8.67157 6 8 6.67157 8 7.5C8 8.32843 8.67157 9 9.5 9ZM14.5 9C15.3284 9 16 8.32843 16 7.5C16 6.67157 15.3284 6 14.5 6C13.6716 6 13 6.67157 13 7.5C13 8.32843 13.6716 9 14.5 9ZM6 22C6 18.6863 8.68629 16 12 16C15.3137 16 18 18.6863 18 22H20C20 17.5817 16.4183 14 12 14C7.58172 14 4 17.5817 4 22H6Z"></path>
                                    </svg>
                                </CardDecorator>

                                <h3 className="mt-6 font-medium text-white">{t.features.card_6.title}</h3>
                            </CardHeader>

                            <CardContent>
                                <p className="text-base text-balance text-white/80">{t.features.card_6.description}</p>
                            </CardContent>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </section>
    )
}


const CardDecorator = ({ children, variant = 'orange' }: { children: ReactNode; variant?: 'orange' | 'blue' | 'green' | 'purple' | 'cyan' | 'yellow' }) => {
    const getGridColor = () => {
        switch (variant) {
            case 'blue':
                return 'var(--color-helium-blue)';
            case 'green':
                return 'var(--color-helium-green)';
            case 'purple':
                return '#8b5cf6';
            case 'cyan':
                return '#06b6d4';
            case 'yellow':
                return '#eab308';
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
            case 'purple':
                return 'border-purple-500';
            case 'cyan':
                return 'border-cyan-500';
            case 'yellow':
                return 'border-yellow-500';
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