import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

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

const contentVariants = {
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
            delay: 0.6,
        },
    },
}

const TermsOfUseLink = () => {
    return (
        <Link 
            href="/terms-of-use" 
            className="text-sm hover:text-gray-300 transition-colors duration-300 p-0 h-auto text-black sm:text-white"
        >
            Terms of Use
        </Link>
    )
}

const PrivacyPolicyLink = () => {
    return (
        <Link 
            href="/privacy-policy" 
            className="text-sm hover:text-gray-300 transition-colors duration-300 p-0 h-auto text-black sm:text-white"
        >
            Privacy Policy
        </Link>
    )
}

export default function Footer() {
    return (
        <footer className="relative h-screen overflow-hidden mt-12 md:mt-20">
            <motion.div 
                className="absolute inset-0 z-0 h-screen"
                variants={imageVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
            >
                <Image
                    src="/home/footer.jpeg"
                    alt="Footer Background"
                    fill
                    className="object-cover object-center h-full"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-transparent"></div>
            </motion.div>
            
            <div className="relative z-20 h-full flex flex-col justify-end">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-6 sm:pb-8">
                    <motion.div
                        variants={contentVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-4 text-white"
                    >
                        {/* Left side - Terms of Use and Privacy Policy */}
                        <div className="flex flex-row items-center gap-4 sm:gap-6 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 sm:bg-transparent sm:backdrop-blur-none sm:rounded-none sm:px-0 sm:py-0">
                            <TermsOfUseLink />
                            <PrivacyPolicyLink />
                        </div>
                        
                        {/* Right side - Copyright and Product by */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 text-sm text-center sm:text-left">
                            <span className="text-gray-300">
                                © 2025 Helium AI. All rights reserved.
                            </span>
                            <span className="text-gray-400">
                                Product by <Link href="https://neuralarc.ai" target="_blank" rel="noopener noreferrer" className="font-bold hover:text-gray-300 transition-colors duration-300">NeuralArc</Link>
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </footer>
    )
}
