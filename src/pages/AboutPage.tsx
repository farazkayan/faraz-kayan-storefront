import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { BrandMonogram } from '../components/BrandMonogram';
import {
  DoodleStar,
  DoodleStudioDeskIllustration,
  DoodleTapeCorner,
} from '../components/DoodleMotifs';
import { SiteShell } from '../components/SiteShell';
import { STUDIO_PROFILE } from '../data/studioData';

const PRINCIPLE_COLORS = [
  'bg-[#4169E1] text-white dark:bg-[#6B8FF7] dark:text-[#181613]',
  'bg-[#F2765B] text-[#24211D] dark:bg-[#F58971] dark:text-[#181613]',
  'bg-[#B9D977] text-[#24211D] dark:bg-[#C4E287] dark:text-[#181613]',
];

export function AboutPage() {
  return (
    <SiteShell activePage="about">
      <section className="max-w-[1240px] mx-auto px-6 md:px-10 pt-10 pb-12 md:pt-14 md:pb-16 border-b-[1.5px] border-[#E3D6BE] dark:border-[#38322B]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-6">
            <div className="flex items-center gap-2 mb-3">
              <DoodleStar className="w-4 h-4 text-[#F2765B] dark:text-[#F58971]" />
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#4169E1] dark:text-[#6B8FF7]">
                About · {STUDIO_PROFILE.founderName}
              </p>
            </div>

            <h1 className="font-display font-extrabold text-[clamp(2.2rem,3.9vw,3.35rem)] leading-[1.06] tracking-[-0.03em] text-[#24211D] dark:text-[#F5EDE0] [text-wrap:balance] mb-6">
              Independent digital products, crafted for everyday clarity.
            </h1>

            <div className="space-y-4 text-base leading-[1.72] text-[#5C554C] dark:text-[#BDB3A4] max-w-[56ch] mb-8">
              {STUDIO_PROFILE.aboutParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <a
                href="/#shop"
                className="sketch-btn-primary group inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-2.5 rounded-xl text-sm font-bold"
              >
                <span>Explore the Shop</span>
                <ArrowRight
                  className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>

              <a
                href={STUDIO_PROFILE.personalWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-[#24211D] dark:text-[#F5EDE0] hover:text-[#4169E1] dark:hover:text-[#6B8FF7] underline underline-offset-4 decoration-[#F2765B] decoration-2 transition-colors"
              >
                <span>farazkh.dev</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <aside className="lg:col-span-6 relative">
            <DoodleTapeCorner className="hidden sm:block absolute -top-2.5 left-8 w-14 h-5 text-[#24211D] dark:text-[#F5EDE0] -rotate-2 z-10 pointer-events-none" />

            <div className="sketch-card rounded-xl overflow-hidden">
              <div className="bg-[#F5EBDA]/60 dark:bg-[#292520] px-5 py-4 border-b-[1.5px] border-[#E3D6BE] dark:border-[#38322B]">
                <DoodleStudioDeskIllustration className="w-full h-auto" />
                <div className="mt-2 flex items-center justify-between text-xs text-[#5C554C] dark:text-[#BDB3A4]">
                  <span
                    style={{ fontFamily: 'var(--font-hand)' }}
                    className="text-lg text-[#4169E1] dark:text-[#6B8FF7]"
                  >
                    sketchbook notes &rarr; modular templates
                  </span>
                  <span className="font-mono text-[11px]">{STUDIO_PROFILE.handle}</span>
                </div>
              </div>

              <div className="p-6 md:p-7">
                <div className="flex items-center justify-between pb-4 mb-4 border-b-[1.5px] border-dashed border-[#D6C6AA] dark:border-[#3D362E]">
                  <div className="inline-flex items-center gap-2.5">
                    <BrandMonogram className="w-6 h-6 text-[#24211D] dark:text-[#F5EDE0]" />
                    <span className="font-display text-sm font-bold lowercase text-[#24211D] dark:text-[#F5EDE0]">
                      {STUDIO_PROFILE.brandWordmark}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-[#5C554C] dark:text-[#BDB3A4]">
                    Digital Design Studio
                  </span>
                </div>

                <dl className="space-y-3 text-sm">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[#5C554C] dark:text-[#BDB3A4]">Creator</dt>
                    <dd className="font-semibold text-[#24211D] dark:text-[#F5EDE0] text-right">
                      {STUDIO_PROFILE.founderName}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[#5C554C] dark:text-[#BDB3A4]">Focus</dt>
                    <dd className="font-semibold text-[#24211D] dark:text-[#F5EDE0] text-right">
                      Presentations, Canva &amp; Web Assets
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[#5C554C] dark:text-[#BDB3A4]">Delivery</dt>
                    <dd className="font-semibold text-[#24211D] dark:text-[#F5EDE0] text-right">
                      Gumroad Digital Downloads
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section
        aria-labelledby="about-philosophy-heading"
        className="max-w-[1240px] mx-auto px-6 md:px-10 py-14 md:py-18"
      >
        <div className="max-w-xl mb-9">
          <p
            style={{ fontFamily: 'var(--font-hand)' }}
            className="text-xl text-[#F2765B] dark:text-[#F58971] mb-1"
          >
            studio principles
          </p>
          <h2
            id="about-philosophy-heading"
            className="font-display font-extrabold text-[clamp(1.6rem,2.6vw,2.2rem)] leading-[1.15] tracking-[-0.025em] text-[#24211D] dark:text-[#F5EDE0]"
          >
            What the store focuses on.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STUDIO_PROFILE.aboutOfferings.map((item, idx) => (
            <div key={item.index} className="sketch-card rounded-xl p-6">
              <span
                className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono text-xs font-bold tabular-nums border-[1.5px] border-[#24211D] dark:border-[#181613] mb-4 ${
                  PRINCIPLE_COLORS[idx % PRINCIPLE_COLORS.length]
                }`}
              >
                {item.index}
              </span>
              <h3 className="font-display text-lg font-bold tracking-tight text-[#24211D] dark:text-[#F5EDE0] mb-2">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#5C554C] dark:text-[#BDB3A4]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
