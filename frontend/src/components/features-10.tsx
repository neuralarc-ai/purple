import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { ReactNode } from 'react'

export default function Features() {
    return (
        <section className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
            <div className="mx-auto max-w-2xl px-6 lg:max-w-5xl">
                <div className="mx-auto grid gap-4 lg:grid-cols-2">
                    <FeatureCard className="bg-black">
                        <CardHeader className="pb-3">
                            <CardHeading
                                icon={<i className="ri-task-line text-lg"></i>}
                                title="Autonomous Task Execution"
                                description="Schedule meetings, manage calendars, process invoices, and generate reports automatically."
                            />
                        </CardHeader>

                        <div className="relative mb-6 border-t border-dashed sm:mb-0">
                            <div className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,var(--color-helium-orange),var(--color-white)_100%)]"></div>
                            <div className="aspect-76/59 p-1 px-6">
                                <Image
                                    src="/home/chat.png"
                                    className="rounded-lg"
                                    alt="task execution illustration"
                                    width={1207}
                                    height={929}
                                />
                            </div>
                        </div>
                    </FeatureCard>

                    <FeatureCard className="bg-black">
                        <CardHeader className="pb-3">
                            <CardHeading
                                icon={<i className="ri-global-line text-lg"></i>}
                                title="Seamless Browser Automation"
                                description="Navigate the web, interact with websites, and automate data entry and competitor analysis."
                            />
                        </CardHeader>

                        <CardContent>
                            <div className="relative mb-6 sm:mb-0">
                                <div className="absolute -inset-6 [background:radial-gradient(50%_50%_at_75%_50%,transparent,var(--color-black)_100%)]"></div>
                                <div className="aspect-76/59 border">
                                    <Image
                                        src="/home/browser-automation.png"
                                        className="rounded-lg object-right scale-200"
                                        alt="browser automation illustration"
                                        width={1407}
                                        height={1129}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </FeatureCard>

                    <FeatureCard className="bg-black p-6">
                        <CardHeading
                            icon={<i className="ri-search-line text-lg"></i>}
                            title="Advanced Web & Search Capabilities"
                            description="Find information from web, academic papers, and news articles with intelligent search."
                        />
                    </FeatureCard>

                    <FeatureCard className="bg-black p-6">
                            <CardHeading
                                icon={<i className="ri-file-list-line text-lg"></i>}
                                title="Comprehensive File Management"
                                description="Create, edit, and manage PDFs, presentations, and spreadsheets automatically."
                            />
                    </FeatureCard>
                </div>
            </div>
        </section>
    )
}

interface FeatureCardProps {
    children: ReactNode
    className?: string
}

const FeatureCard = ({ children, className }: FeatureCardProps) => (
    <Card className={cn('group relative rounded-none shadow-zinc-950/5 border-white/15 pb-0', className)}>
        <CardDecorator />
        {children}
    </Card>
)

const CardDecorator = () => (
    <>
        <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2"></span>
        <span className="border-primary absolute -right-px -top-px block size-2 border-r-2 border-t-2"></span>
        <span className="border-primary absolute -bottom-px -left-px block size-2 border-b-2 border-l-2"></span>
        <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2"></span>
    </>
)

interface CardHeadingProps {
    icon: ReactNode
    title: string
    description: string
}

const CardHeading = ({ icon, title, description }: CardHeadingProps) => (
    <div className="p-6">
        <span className="text-muted-foreground flex items-center gap-2">
            {icon}
            {title}
        </span>
        <p className="mt-8 text-2xl font-semibold">{description}</p>
    </div>
)

