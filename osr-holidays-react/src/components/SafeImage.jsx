import { useEffect, useState } from 'react'

const FALLBACK_IMAGE = '/travel-placeholder.svg'

const SafeImage = ({ src, alt, className, loading = 'lazy' }) => {
  const [imageSrc, setImageSrc] = useState(src || FALLBACK_IMAGE)

  useEffect(() => {
    setImageSrc(src || FALLBACK_IMAGE)
  }, [src])

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => {
        if (imageSrc !== FALLBACK_IMAGE) {
          setImageSrc(FALLBACK_IMAGE)
        }
      }}
    />
  )
}

export default SafeImage
