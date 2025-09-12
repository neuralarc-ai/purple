import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

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

const TermsOfUseDialog = () => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="link" className="text-sm hover:text-gray-300 transition-colors duration-300 p-0 h-auto text-black sm:text-white">
                    Terms of Use
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Terms of Use</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 text-sm">
                    <div>
                        <h3 className="font-semibold mb-2">1. Eligibility and Account Responsibility</h3>
                        <p>You must be at least 18 years of age and capable of entering into a legally binding contract to access or use the Services. You are responsible for maintaining the confidentiality of your account credentials and for all activities occurring under your account.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">2. License to Use Services</h3>
                        <p>Subject to your compliance with these Terms, Helium AI grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Services solely for your internal business purposes. You shall not use the Services to develop competing products or reverse engineer any aspect of the platform.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">3. Prohibited Conduct</h3>
                        <p>You shall not:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Use the Services in any manner that infringes any intellectual property or proprietary rights of any party;</li>
                            <li>Use or access the Services to violate any applicable law or regulation;</li>
                            <li>Introduce malware or harmful code, scrape data, or interfere with service functionality;</li>
                            <li>Misrepresent your identity or affiliation.</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">4. Ownership and Intellectual Property</h3>
                        <p>All content, trademarks, and software associated with the Services are the exclusive property of Helium AI or its licensors. No rights are granted except as explicitly set forth herein.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">5. Third-Party Integrations</h3>
                        <p>The Services may contain links or integrations with third-party platforms. Helium AI is not responsible for the content, functionality, or privacy practices of such third parties.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">6. Disclaimers</h3>
                        <p>The Services are provided "as is" and "as available." Helium AI makes no warranties or representations, express or implied, regarding the Services, including but not limited to merchantability, fitness for a particular purpose, accuracy, or non-infringement.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">7. Limitation of Liability</h3>
                        <p>To the maximum extent permitted by applicable law, Helium AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits or revenue, arising from or related to your use of the Services.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">8. Indemnification</h3>
                        <p>You agree to indemnify, defend, and hold harmless Helium AI, its officers, directors, employees, and affiliates from any claim, demand, liability, or expense arising out of your breach of these Terms or violation of applicable law.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">9. Governing Law and Jurisdiction</h3>
                        <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Pune, Maharashtra.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">10. Changes</h3>
                        <p>We reserve the right to modify these Terms at any time. Continued use after changes constitutes acceptance of the updated Terms.</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

const PrivacyPolicyDialog = () => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="link" className="text-sm hover:text-gray-300 transition-colors duration-300 p-0 h-auto text-black sm:text-white">
                    Privacy Policy
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Privacy Policy</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 text-sm">
                    <div>
                        <h3 className="font-semibold mb-2">1. Information We Collect</h3>
                        <p><strong>Personal Data:</strong> Name, email, company, contact details.</p>
                        <p><strong>Technical Data:</strong> IP address, browser type, device identifiers, usage logs.</p>
                        <p><strong>Cookies:</strong> We use cookies for analytics and personalization.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">2. Use of Information</h3>
                        <p>We use the information to:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Provide, maintain, and improve our Services;</li>
                            <li>Process transactions and communicate with you;</li>
                            <li>Monitor usage trends and enhance security;</li>
                            <li>Comply with legal obligations.</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">3. Legal Basis for Processing</h3>
                        <p>Where applicable, we process your data on the basis of your consent, our contractual obligations, compliance with legal obligations, or legitimate interests.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">4. Data Sharing</h3>
                        <p>We do not sell or rent your data. We may share it with:</p>
                        <ul className="list-disc list-inside ml-4 space-y-1">
                            <li>Authorized service providers (under strict confidentiality);</li>
                            <li>Legal or regulatory authorities, when required;</li>
                            <li>Affiliates and successors in interest, in the event of a business transfer.</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">5. Data Retention</h3>
                        <p>We retain your data only as long as necessary to fulfill the purposes outlined in this Policy, unless a longer retention period is required by law.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">6. Security</h3>
                        <p>We implement appropriate administrative, technical, and physical safeguards to protect your information against unauthorized access or disclosure.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">7. Your Rights</h3>
                        <p>Depending on your jurisdiction, you may have rights to access, correct, delete, or restrict the processing of your data. Please contact us at support@helium.ai.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">8. International Transfers</h3>
                        <p>If your data is transferred outside of India, we ensure appropriate safeguards are in place, including data processing agreements and, where applicable, standard contractual clauses.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold mb-2">9. Changes</h3>
                        <p>We may update this Privacy Policy periodically. We encourage you to review this page regularly.</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default function Footer() {
    return (
        <footer className="relative h-screen overflow-hidden">
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
                            <TermsOfUseDialog />
                            <PrivacyPolicyDialog />
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
