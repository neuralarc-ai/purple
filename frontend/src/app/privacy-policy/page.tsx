import React from 'react'
import Link from 'next/link'

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="mb-8">
                    <Link 
                        href="/" 
                        className="inline-flex items-center px-4 py-2 bg-white text-black rounded-full hover:bg-gray-100 transition-all duration-300 font-medium hover:-translate-y-1 hover:shadow-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M6 8L2 12L6 16"/>
                            <path d="M2 12H22"/>
                        </svg>
                        Back to Home
                    </Link>
                </div>
                
                <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
                
                <div className="space-y-8 text-sm leading-relaxed">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
                        <p><strong>Personal Data:</strong> Name, email, company, contact details.</p>
                        <p><strong>Technical Data:</strong> IP address, browser type, device identifiers, usage logs.</p>
                        <p><strong>Cookies:</strong> We use cookies for analytics and personalization.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">2. Use of Information</h2>
                        <p>We use the information to:</p>
                        <ul className="list-disc list-inside ml-6 space-y-2 mt-2">
                            <li>Provide, maintain, and improve our Services;</li>
                            <li>Process transactions and communicate with you;</li>
                            <li>Monitor usage trends and enhance security;</li>
                            <li>Comply with legal obligations.</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">3. Legal Basis for Processing</h2>
                        <p>Where applicable, we process your data on the basis of your consent, our contractual obligations, compliance with legal obligations, or legitimate interests.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">4. Data Sharing</h2>
                        <p>We do not sell or rent your data. We may share it with:</p>
                        <ul className="list-disc list-inside ml-6 space-y-2 mt-2">
                            <li>Authorized service providers (under strict confidentiality);</li>
                            <li>Legal or regulatory authorities, when required;</li>
                            <li>Affiliates and successors in interest, in the event of a business transfer.</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">5. Data Retention</h2>
                        <p>We retain your data only as long as necessary to fulfill the purposes outlined in this Policy, unless a longer retention period is required by law.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">6. Security</h2>
                        <p>We implement appropriate administrative, technical, and physical safeguards to protect your information against unauthorized access or disclosure.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">7. Your Rights</h2>
                        <p>Depending on your jurisdiction, you may have rights to access, correct, delete, or restrict the processing of your data. Please contact us at support@helium.ai.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">8. International Transfers</h2>
                        <p>If your data is transferred outside of India, we ensure appropriate safeguards are in place, including data processing agreements and, where applicable, standard contractual clauses.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">9. Changes</h2>
                        <p>We may update this Privacy Policy periodically. We encourage you to review this page regularly.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
