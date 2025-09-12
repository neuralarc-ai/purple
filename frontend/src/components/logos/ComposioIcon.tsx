import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ComposioIconProps {
  toolkitSlug: string
  className?: string
  size?: number
  fallbackIcon?: React.ReactNode
}

export default function ComposioIcon({ 
  toolkitSlug, 
  className, 
  size = 32,
  fallbackIcon 
}: ComposioIconProps) {
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const fetchIcon = async () => {
      try {
        setIsLoading(true)
        setHasError(false)
        
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
        const response = await fetch(`${backendUrl}/composio/toolkits/${toolkitSlug}/icon`)
        const data = await response.json()
        
        if (data.success && data.icon_url) {
          setIconUrl(data.icon_url)
        } else {
          setHasError(true)
        }
      } catch (error) {
        console.error(`Failed to fetch icon for ${toolkitSlug}:`, error)
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    }

    if (toolkitSlug) {
      fetchIcon()
    }
  }, [toolkitSlug])

  if (isLoading) {
    return (
      <div 
        className={cn('flex items-center justify-center rounded bg-muted animate-pulse', className)}
        style={{ width: size, height: size }}
      />
    )
  }

  if (iconUrl && !hasError) {
    return (
      <img
        src={iconUrl}
        alt={`${toolkitSlug} icon`}
        className={cn('object-contain', className)}
        style={{ width: size, height: size }}
        onError={() => setHasError(true)}
      />
    )
  }

  // Fallback to provided fallback icon or default
  if (fallbackIcon) {
    return <>{fallbackIcon}</>
  }

  // Default fallback - first letter of toolkit name
  const firstLetter = toolkitSlug.charAt(0).toUpperCase()
  return (
    <div 
      className={cn('flex items-center justify-center rounded bg-muted text-muted-foreground font-semibold', className)}
      style={{ width: size, height: size }}
    >
      {firstLetter}
    </div>
  )
}
