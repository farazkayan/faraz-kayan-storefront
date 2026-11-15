import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface StudioImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
  loading?: 'eager' | 'lazy';
}

export function StudioImage({
  src,
  alt,
  className = '',
  fallbackTitle,
  loading = 'eager',
}: StudioImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-2 bg-[#F5EBDA] dark:bg-[#292520] text-[#5C554C] dark:text-[#BDB3A4] p-6 text-center ${className}`}
      >
        <ImageOff className="w-5 h-5 opacity-70" aria-hidden="true" />
        <span className="text-xs font-medium tracking-wide">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
