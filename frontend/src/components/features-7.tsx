import Image from 'next/image'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Brain, Zap, Sparkles } from 'lucide-react'
import { ReactNode } from 'react'

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
                <Card className="mx-auto mt-8 grid grid-cols-3 divide-x divide-white/20 overflow-hidden shadow-zinc-950/5 *:text-center md:mt-16 bg-black/20 border-white/30">
                    <div className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Brain
                                    className="size-6 text-white"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium text-white">Deeper, reliable intelligence</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm text-white/80">Advanced AI agents that understand context and deliver accurate insights.</p>
                        </CardContent>
                    </div>

                    <div className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Zap
                                    className="size-6 text-white"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium text-white">Automates workflows</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="mt-3 text-sm text-white/80">Streamline complex processes and accelerate research with intelligent automation.</p>
                        </CardContent>
                    </div>

                    <div className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Sparkles
                                    className="size-6 text-white"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium text-white">No-code, simple to use</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="mt-3 text-sm text-white/80">Build powerful AI workflows without writing code - intuitive interface for everyone.</p>
                        </CardContent>
                    </div>
                </Card>
            </div>
        </section>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div className="relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
        <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-helium-orange)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-helium-orange)_1px,transparent_1px)] bg-[size:24px_24px]"
        />
        <div
            aria-hidden
            className="bg-radial to-black absolute inset-0 from-transparent to-75%"
        />
        <div className="bg-black absolute inset-0 m-auto flex size-12 items-center justify-center border border-helium-orange">{children}</div>
    </div>
)