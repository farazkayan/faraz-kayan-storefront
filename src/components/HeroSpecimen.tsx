import { ArrowUpRight } from 'lucide-react';
import heroStudioImage from '../assets/images/playful_doodle_desk_web.webp';
import type { NormalizedGumroadProduct } from '../utils/gumroad';
import { BrandMonogram } from './BrandMonogram';
import { DoodleStar, DoodleTapeCorner } from './DoodleMotifs';
import { GumroadPrice } from './GumroadPrice';
import { StudioImage } from './StudioImage';

interface HeroSpecimenProps {
  featuredProducts: readonly NormalizedGumroadProduct[];
}

/**
 * Hero designer sketchbook canvas on Home (/).
 * Shows live Gumroad featured releases linking directly to their canonical Gumroad
 * product pages when #gumroad-data contains products, or the playful doodle sketchbook
 * illustration framed with the studio's cobalt, coral, and lime swatches.
 */
export function HeroSpecimen({ featuredProducts }: HeroSpecimenProps) {
  const leadProduct = featuredProducts[0] ?? null;
  const secondaryProducts = featuredProducts.slice(1, 3);

  return (
    <div className="relative h-full">
      {/* Subtle corner masking-tape doodle above top-right corner without overlapping content */}
      <DoodleTapeCorner className="hidden sm:block absolute -top-2.5 right-6 w-14 h-5 text-[#24211D] dark:text-[#F5EDE0] rotate-3 z-10 pointer-events-none" />

      <div className="sketch-card rounded-xl h-full flex flex-col overflow-hidden text-left">
        {/* Top sheet bar */}
        <div className="px-5 py-3 border-b-[1.5px] border-[#E3D6BE] dark:border-[#38322B] bg-[#F5EBDA]/70 dark:bg-[#292520] flex items-center justify-between gap-4 text-xs">
          <span className="inline-flex items-center gap-2 font-semibold text-[#24211D] dark:text-[#F5EDE0]">
            <DoodleStar className="w-4 h-4 text-[#4169E1] dark:text-[#6B8FF7]" />
            <span>{leadProduct ? 'Featured Release' : 'Studio Desk'}</span>
          </span>
          <span className="font-mono text-[11px] text-[#5C554C] dark:text-[#BDB3A4]">
            @farazkayan
          </span>
        </div>

        {leadProduct ? (
          <div className="flex-1 flex flex-col justify-between p-5 md:p-6 gap-5">
            <div data-gumroad-product={leadProduct.permalink}>
              <a
                href={leadProduct.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${leadProduct.title} on Gumroad`}
                className="group block aspect-square rounded-lg overflow-hidden border-[1.5px] border-[#24211D] dark:border-[#4A433A] bg-[#F5EBDA] dark:bg-[#292520] mb-4"
              >
                {leadProduct.imageUrl ? (
                  <StudioImage
                    src={leadProduct.imageUrl}
                    alt={leadProduct.imageAlt}
                    fallbackTitle={leadProduct.title}
                    className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <BrandMonogram className="w-8 h-8 text-[#24211D] dark:text-[#F5EDE0]" />
                    <span className="font-display text-lg font-bold text-[#24211D] dark:text-[#F5EDE0]">
                      {leadProduct.title}
                    </span>
                  </div>
                )}
              </a>

              <div className="flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  {(leadProduct.categories.length > 0 || leadProduct.formatLabel) && (
                    <p className="text-xs text-[#5C554C] dark:text-[#BDB3A4] mb-1 truncate">
                      {[
                        ...leadProduct.categories.map((group) => group.label),
                        leadProduct.formatLabel,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                  <h2 className="font-display text-lg font-bold text-[#24211D] dark:text-[#F5EDE0] truncate">
                    <a
                      href={leadProduct.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#4169E1] dark:hover:text-[#6B8FF7] transition-colors duration-150"
                    >
                      {leadProduct.title}
                    </a>
                  </h2>
                </div>

                <div className="shrink-0">
                  <GumroadPrice
                    permalink={leadProduct.permalink}
                    price={leadProduct.price}
                  />
                </div>
              </div>
            </div>

            {secondaryProducts.length > 0 && (
              <div className="pt-4 border-t-[1.5px] border-dashed border-[#E3D6BE] dark:border-[#38322B] divide-y divide-[#E3D6BE] dark:divide-[#38322B]">
                {secondaryProducts.map((item, idx) => (
                  <a
                    key={item.id}
                    href={item.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-gumroad-product={item.permalink}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 group"
                  >
                    <div className="flex items-baseline gap-3 min-w-0">
                      <span className="font-mono text-[11px] tabular-nums text-[#4169E1] dark:text-[#6B8FF7]">
                        0{idx + 2}
                      </span>
                      <span className="text-sm font-semibold text-[#24211D] dark:text-[#F5EDE0] group-hover:text-[#4169E1] dark:group-hover:text-[#6B8FF7] truncate transition-colors duration-150">
                        {item.title}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-2 shrink-0">
                      <GumroadPrice
                        permalink={item.permalink}
                        price={item.price}
                      />
                      <ArrowUpRight
                        className="w-3.5 h-3.5 text-[#5C554C] dark:text-[#BDB3A4] group-hover:text-[#4169E1] dark:group-hover:text-[#6B8FF7]"
                        aria-hidden="true"
                      />
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="p-4 pb-3 flex-1 flex flex-col">
              <div className="flex-1 relative aspect-square rounded-lg overflow-hidden border-[1.5px] border-[#24211D] dark:border-[#4A433A] bg-[#F5EBDA] dark:bg-[#292520]">
                <StudioImage
                  src={heroStudioImage}
                  alt="Hand-drawn studio sketchbook spread showing presentation slide grids, website wireframes, cobalt, coral, and lime color swatch cards, and fountain pens"
                  fallbackTitle="faraz kayan studio"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 border-t-[1.5px] border-[#E3D6BE] dark:border-[#38322B] bg-[#F5EBDA]/50 dark:bg-[#292520]/70 flex items-center justify-between gap-4 text-xs">
              <span className="font-medium text-[#24211D] dark:text-[#F5EDE0]">
                Decks, Canva layouts &amp; web starters
              </span>
              {/* Studio palette swatches motif */}
              <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
                <span className="w-3 h-3 rounded-full bg-[#4169E1] border border-[#24211D] dark:border-[#F5EDE0]" />
                <span className="w-3 h-3 rounded-full bg-[#F2765B] border border-[#24211D] dark:border-[#F5EDE0]" />
                <span className="w-3 h-3 rounded-full bg-[#B9D977] border border-[#24211D] dark:border-[#F5EDE0]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
