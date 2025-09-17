import React from 'react'
import Link from 'next/link'

export default function TermsOfUsePage() {
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
                
                <h1 className="text-4xl font-bold mb-8">Terms of Use</h1>
                
                <div className="space-y-8 text-sm leading-relaxed">
                    <div>
                        <h2 className="text-xl font-semibold mb-4">1. Eligibility and Account Responsibility</h2>
                        <p>You must be at least 18 years of age and capable of entering into a legally binding contract to access or use the Services. You are responsible for maintaining the confidentiality of your account credentials and for all activities occurring under your account.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">2. License to Use Services</h2>
                        <p>Subject to your compliance with these Terms, Helium AI grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Services solely for your internal business purposes. You shall not use the Services to develop competing products or reverse engineer any aspect of the platform.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">3. Prohibited Conduct</h2>
                        <p>You shall not:</p>
                        <ul className="list-disc list-inside ml-6 space-y-2 mt-2">
                            <li>Use the Services in any manner that infringes any intellectual property or proprietary rights of any party;</li>
                            <li>Use or access the Services to violate any applicable law or regulation;</li>
                            <li>Introduce malware or harmful code, scrape data, or interfere with service functionality;</li>
                            <li>Misrepresent your identity or affiliation.</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">4. Ownership and Intellectual Property</h2>
                        <p>All content, trademarks, and software associated with the Services are the exclusive property of Helium AI or its licensors. No rights are granted except as explicitly set forth herein.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">5. Third-Party Integrations</h2>
                        <p>The Services may contain links or integrations with third-party platforms. Helium AI is not responsible for the content, functionality, or privacy practices of such third parties.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">6. Disclaimers</h2>
                        <p>The Services are provided "as is" and "as available." Helium AI makes no warranties or representations, express or implied, regarding the Services, including but not limited to merchantability, fitness for a particular purpose, accuracy, or non-infringement.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
                        <p>To the maximum extent permitted by applicable law, Helium AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits or revenue, arising from or related to your use of the Services.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">8. Indemnification</h2>
                        <p>You agree to indemnify, defend, and hold harmless Helium AI, its officers, directors, employees, and affiliates from any claim, demand, liability, or expense arising out of your breach of these Terms or violation of applicable law.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">9. Governing Law and Jurisdiction</h2>
                        <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Pune, Maharashtra.</p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-semibold mb-4">10. Changes</h2>
                        <p>We reserve the right to modify these Terms at any time. Continued use after changes constitutes acceptance of the updated Terms.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
