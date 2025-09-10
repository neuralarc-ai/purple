import Image from 'next/image'

export default function FeaturesSection() {
    return (
        <section className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl space-y-12 px-6">
                <div className="relative z-10 grid items-center justify-center text-center gap-4 md:gap-12">
                    <h2 className="text-4xl xl:text-6xl font-semibold leading-none text-white">Stop switching between AI tools. <br />Start succeeding with one.</h2>
                    <p className="max-w-lg mx-auto text-white/80">Helium seamlessly integrates with your existing workflows to automate tasks, generate insights, and manage your business operations all from your intelligent digital companion.</p>
                </div>
                <div className="relative rounded-2xl p-3 md:-mx-8 lg:col-span-3">
                    <div className="aspect-88/36 relative">
                        <div className="bg-linear-to-t z-10 rounded-2xl from-black absolute inset-0 to-transparent"></div>
                        {/* <Image src="/home/app-screen.jpeg" className="absolute inset-0 rounded-2xl" alt="payments illustration dark" width={2797} height={1137} /> */}
                        <Image src="/home/app-screen.jpeg" className="hidden dark:block rounded-xl" alt="payments illustration dark" width={2797} height={1137} />
                        <Image src="/home/app-screen.jpeg" className="dark:hidden rounded-xl" alt="payments illustration light" width={2797} height={1137} />
                    </div>
                </div>
                <div className="relative mx-auto grid max-w-4xl divide-x divide-y divide-white/30 border border-white/30 *:p-12 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-3">
                        <div className="flex items-start gap-2">
                            <i className="ri-cpu-line text-white"></i>
                            <h3 className="text-sm font-medium text-white">Deeper, reliable intelligence</h3>
                        </div>
                        <p className="text-sm text-white/80">Advanced AI agents that understand context and deliver accurate insights.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-start gap-2">
                            <i className="ri-flashlight-line text-white"></i>
                            <h3 className="text-sm font-medium text-white">Automates workflows</h3>
                        </div>
                        <p className="text-sm text-white/80">Streamline complex processes and accelerate research with intelligent automation.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-start gap-2">
                            <i className="ri-sparkling-2-line text-white"></i>
                            <h3 className="text-sm font-medium text-white">No-code, simple to use</h3>
                        </div>
                        <p className="text-sm text-white/80">Build powerful AI workflows without writing code - intuitive interface for everyone.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}