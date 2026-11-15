import { useLayoutEffect, useRef } from 'react';
import type { LivePriceInfo } from '../utils/gumroad';

interface GumroadPriceProps {
  permalink: string;
  price: LivePriceInfo;
  isCachedSnapshot?: boolean;
  isPriceStale?: boolean;
}

export function GumroadPrice({
  permalink,
  price,
  isCachedSnapshot = false,
  isPriceStale = false,
}: GumroadPriceProps) {
  const priceRef = useRef<HTMLSpanElement | null>(null);
  const originalPriceRef = useRef<HTMLSpanElement | null>(null);
  const lastWrittenPriceRef = useRef<string>('');
  const lastWrittenOriginalRef = useRef<string>('');

  useLayoutEffect(() => {
    const el = priceRef.current;
    if (!el || isPriceStale || !price.displayPrice) return;
    const currentText = el.textContent?.trim() ?? '';
    if (currentText === '' || currentText === lastWrittenPriceRef.current) {
      el.textContent = price.displayPrice;
      lastWrittenPriceRef.current = price.displayPrice;
    }
  }, [price.displayPrice, isPriceStale]);

  useLayoutEffect(() => {
    const el = originalPriceRef.current;
    if (!el || isPriceStale || !price.originalPrice) return;
    const currentText = el.textContent?.trim() ?? '';
    if (currentText === '' || currentText === lastWrittenOriginalRef.current) {
      el.textContent = price.originalPrice;
      lastWrittenOriginalRef.current = price.originalPrice;
    }
  }, [price.originalPrice, isPriceStale]);

  if (isPriceStale) {
    return (
      <span
        data-testid="stale-price-fallback"
        className="inline-flex items-baseline shrink-0 text-xs font-medium text-[#776F64] dark:text-[#998F81]"
        title="Cached price hidden — confirm live pricing on Gumroad"
      >
        Verify price
      </span>
    );
  }

  if (isCachedSnapshot) {
    if (!price.displayPrice) {
      return (
        <span
          data-testid="missing-price-fallback"
          className="inline-flex items-baseline shrink-0 text-xs font-medium text-[#776F64] dark:text-[#998F81]"
        >
          Check price
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-baseline gap-2 shrink-0 text-sm font-bold tabular-nums"
        title="Synced from Studio Home — confirm final price on Gumroad"
      >
        {price.originalPrice && (
          <span className="text-xs line-through text-[#776F64] dark:text-[#998F81]">
            {price.originalPrice}
          </span>
        )}
        <span className="text-[#24211D] dark:text-[#F5EDE0]">
          {price.displayPrice}
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-baseline gap-2 shrink-0 text-sm font-bold tabular-nums">
      {price.originalPrice && (
        <span
          ref={originalPriceRef}
          data-gumroad-product={permalink}
          data-gumroad-field="original-price"
          className="text-xs line-through text-[#776F64] dark:text-[#998F81]"
        />
      )}
      <span
        ref={priceRef}
        data-gumroad-product={permalink}
        data-gumroad-field="price"
        className="peer text-[#24211D] dark:text-[#F5EDE0]"
      />
      <span
        data-testid="missing-price-fallback"
        className="hidden peer-empty:inline text-xs font-medium text-[#776F64] dark:text-[#998F81]"
      >
        Check price
      </span>
    </span>
  );
}
