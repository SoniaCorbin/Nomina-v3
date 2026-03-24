import React, { useEffect, useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

type NominaImageCacheHost = {
  NOMINA?: {
    cacheImage?: (url: string) => Promise<string | null>
  }
}

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(props.src)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props

  useEffect(() => {
    setDidError(false)
    setResolvedSrc(src)

    const url = typeof src === 'string' ? src : ''
    const canCache = /^https?:\/\//i.test(url)
    const cacheFn = (globalThis as typeof globalThis & NominaImageCacheHost).NOMINA?.cacheImage

    if (!canCache || !cacheFn) return

    let cancelled = false
    cacheFn(url)
      .then((localUrl) => {
        if (cancelled) return
        if (localUrl && typeof localUrl === 'string') setResolvedSrc(localUrl)
      })
      .catch(() => {
        // ignore
      })

    return () => {
      cancelled = true
    }
  }, [src])

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img src={resolvedSrc} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}