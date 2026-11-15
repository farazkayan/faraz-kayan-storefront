import { useState } from 'react';
import { ArrowRight, Minus, Plus } from 'lucide-react';
import { DoodleSparkles, DoodleStar } from '../components/DoodleMotifs';
import { SiteShell } from '../components/SiteShell';
import { FAQ_GROUPS } from '../data/studioData';

export function FaqPage() {
  const [openId, setOpenId] = useState<string | null>(
    FAQ_GROUPS[0]?.items[0]?.id ?? null
  );

  const handleToggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <SiteShell activePage="faq">
      <section className="max-w-[1240px] mx-auto px-6 md:px-10 pt-10 pb-10 md:pt-14 md:pb-12 border-b-[1.5px] border-[#E3D6BE] dark:border-[#38322B]">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2.5 mb-2">
            <DoodleSparkles className="w-6 h-6 text-[#4169E1] dark:text-[#6B8FF7]" />
            <span
              style={{ fontFamily: 'var(--font-hand)' }}
              className="text-xl text-[#F2765B] dark:text-[#F58971]"
            >
              quick answers
            </span>
          </div>
          <h1 className="font-display font-extrabold text-[clamp(2.2rem,3.9vw,3.35rem)] leading-[1.06] tracking-[-0.03em] text-[#24211D] dark:text-[#F5EDE0] [text-wrap:balance] mb-4">
            Frequently asked questions.
          </h1>
          <p className="text-base leading-[1.65] text-[#5C554C] dark:text-[#BDB3A4]">
            Practical details on digital downloads, software compatibility,
            editing files, and accessing purchases via Gumroad.
          </p>
        </div>
      </section>

      <section className="max-w-[1240px] mx-auto px-6 md:px-10 py-12 md:py-16 space-y-12">
        {FAQ_GROUPS.map((group) => (
          <div
            key={group.id}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12"
          >
            <div className="lg:col-span-4">
              <div className="flex items-center gap-2">
                <DoodleStar className="w-4 h-4 text-[#4169E1] dark:text-[#6B8FF7] shrink-0" />
                <h2 className="font-display font-bold text-xl text-[#24211D] dark:text-[#F5EDE0]">
                  {group.title}
                </h2>
              </div>
            </div>

            <div className="lg:col-span-8 sketch-card rounded-xl divide-y divide-[#E3D6BE] dark:divide-[#38322B] overflow-hidden">
              {group.items.map((item) => {
                const isOpen = openId === item.id;
                const panelId = `faq-panel-${item.id}`;
                return (
                  <div key={item.id} className="px-6">
                    <h3 className="m-0">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => handleToggle(item.id)}
                        className="w-full py-5 flex items-center justify-between gap-6 text-left text-base font-semibold text-[#24211D] dark:text-[#F5EDE0] hover:text-[#4169E1] dark:hover:text-[#6B8FF7] transition-colors duration-150 cursor-pointer"
                      >
                        <span>{item.question}</span>
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border-[1.5px] shrink-0 transition-colors duration-150 ${
                            isOpen
                              ? 'border-[#24211D] bg-[#4169E1] text-white dark:border-[#F5EDE0] dark:bg-[#6B8FF7] dark:text-[#181613]'
                              : 'border-[#D6C6AA] bg-[#FFF7E8] text-[#5C554C] dark:border-[#4A433A] dark:bg-[#292520] dark:text-[#BDB3A4]'
                          }`}
                        >
                          {isOpen ? (
                            <Minus className="w-4 h-4" aria-hidden="true" />
                          ) : (
                            <Plus className="w-4 h-4" aria-hidden="true" />
                          )}
                        </span>
                      </button>
                    </h3>
                    {isOpen && (
                      <div
                        id={panelId}
                        className="pb-5 pr-10 text-sm leading-relaxed text-[#5C554C] dark:text-[#BDB3A4] max-w-[65ch]"
                      >
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-8 border-t-[1.5px] border-dashed border-[#D6C6AA] dark:border-[#3D362E] flex flex-wrap items-center gap-6">
          <a
            href="/#shop"
            className="sketch-btn-primary group inline-flex items-center gap-2 min-h-[46px] px-6 py-2.5 rounded-xl text-sm font-bold"
          >
            <span>Browse the Shop</span>
            <ArrowRight
              className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>

          <a
            href="/about"
            className="inline-flex items-center min-h-[44px] text-sm font-semibold text-[#24211D] dark:text-[#F5EDE0] hover:text-[#4169E1] dark:hover:text-[#6B8FF7] underline underline-offset-4 decoration-[#F2765B] decoration-2"
          >
            About the Studio
          </a>
        </div>
      </section>
    </SiteShell>
  );
}
