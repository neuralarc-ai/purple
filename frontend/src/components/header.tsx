'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/AuthProvider'
import { LanguageSelector } from '@/components/LanguageSelector'

const menuItems: { name: string; href: string }[] = []

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isVisible, setIsVisible] = React.useState(false)
    const [isHeaderVisible, setIsHeaderVisible] = React.useState(true)
    const [lastScrollY, setLastScrollY] = React.useState(0)
    const { user, isLoading } = useAuth()

    React.useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY
            
            // Show header when at the top
            if (currentScrollY <= 50) {
                setIsHeaderVisible(true)
            }
            // Hide header when scrolling down past 100px
            else if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsHeaderVisible(false)
            }
            
            setLastScrollY(currentScrollY)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [lastScrollY])

    React.useEffect(() => {
        // Trigger animation after component mounts
        const timer = setTimeout(() => {
            setIsVisible(true)
        }, 100)
        return () => clearTimeout(timer)
    }, [])
    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className={cn(
                    "fixed z-20 w-full px-2 transition-all duration-300 ease-out",
                    isVisible 
                        ? "translate-y-0 opacity-100 blur-0" 
                        : "-translate-y-4 opacity-0 blur-sm",
                    !isHeaderVisible && "-translate-y-full"
                )}>
                <div className="mx-auto mt-2 max-w-6xl px-4 sm:px-6 lg:px-12 transition-all duration-300">
                    <div className="relative flex flex-wrap items-center justify-between gap-4 sm:gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Image
                                    src="/logo-light.svg"
                                    alt="Helium"
                                    width={20}
                                    height={20}
                                    className="sm:w-6 sm:h-6"
                                />                                
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-8 text-sm">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            className="text-black/70 hover:text-black block duration-150">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-6 rounded-3xl border p-4 sm:p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                <LanguageSelector />
                                {!isLoading && (
                                    <>
                                        {user ? (
                                            <Button
                                                asChild
                                                size="sm"
                                                className="w-full sm:w-auto bg-black text-white hover:bg-helium-orange hover:text-white hover:border-helium-orange border border-black rounded-full px-4 py-2 text-sm sm:text-base">
                                                <Link href="/dashboard">
                                                    <span>Dashboard</span>
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button
                                                asChild
                                                size="sm"
                                                className="w-full sm:w-auto bg-black text-white hover:bg-helium-orange hover:text-white hover:border-helium-orange border border-black rounded-full px-4 py-2 text-sm sm:text-base">
                                                <Link href="/auth">
                                                    <span>Sign In</span>
                                                </Link>
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
