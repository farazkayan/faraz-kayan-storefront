import { useId } from 'react';
import { ArrowUpRight } from 'lucide-react';

interface GumroadNewsletterFormProps {
  variant?: 'section' | 'footer';
}

/**
 * Native Gumroad Follow Newsletter Form.
 *
 * Strictly preserves Gumroad's required attributes:
 * - <form data-gumroad-follow>
 * - <input type="email" required ... />
 * - <button type="submit">
 * - <p data-gumroad-follow-message> inside the form for Gumroad confirmation/errors
 *
 * Does not intercept submissions, store emails, or invent fake confirmation messages.
 */
export function GumroadNewsletterForm({
  variant = 'section',
}: GumroadNewsletterFormProps) {
  const inputId = useId();
  const noteId = useId();

  if (variant === 'footer') {
    return (
      <div className="w-full max-w-[38ch]">
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#24211D] dark:text-[#F5EDE0] mb-1.5">
          The Creative Postbox
        </p>
        <p className="text-xs leading-relaxed text-[#5C554C] dark:text-[#BDB3A4] mb-3">
          New releases &amp; creative updates via Gumroad.
        </p>

        <form data-gumroad-follow="" className="space-y-2">
          <label htmlFor={inputId} className="sr-only">
            Email address for creative updates
          </label>
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <input
              id={inputId}
              type="email"
              name="email"
              required
              autoComplete="email"
              aria-describedby={noteId}
              placeholder="you@example.com"
              className="flex-1 min-w-0 h-10 px-3.5 rounded-lg border-[1.5px] border-[#24211D] dark:border-[#4A433A] bg-[#FFFBF2] dark:bg-[#211E1A] text-xs font-medium text-[#24211D] dark:text-[#F5EDE0] placeholder:text-[#776F64] dark:placeholder:text-[#998F81] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4169E1] dark:focus-visible:ring-[#6B8FF7] focus:border-[#4169E1] dark:focus:border-[#6B8FF7]"
            />
            <button
              type="submit"
              className="dcf-news-btn shrink-0 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg text-xs font-bold uppercase tracking-[0.05em] whitespace-nowrap cursor-pointer"
            >
              <span>Subscribe</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
          <p
            id={noteId}
            className="text-[11px] text-[#776F64] dark:text-[#998F81]"
          >
            Unsubscribe whenever you like.
          </p>
          <p
            data-gumroad-follow-message=""
            role="status"
            aria-live="polite"
            className="empty:hidden text-xs font-semibold text-[#4169E1] dark:text-[#6B8FF7] pt-1"
          />
        </form>
      </div>
    );
  }

  return (
    <form data-gumroad-follow="" className="w-full max-w-xl mx-auto">
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>

      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        <input
          id={inputId}
          type="email"
          name="email"
          required
          autoComplete="email"
          aria-describedby={noteId}
          placeholder="you@example.com"
          className="flex-1 min-w-0 min-h-[50px] px-4 rounded-xl border-[1.5px] border-[#24211D] dark:border-[#4A433A] bg-[#FFF7E8] dark:bg-[#181613] text-sm font-medium text-[#24211D] dark:text-[#F5EDE0] placeholder:text-[#776F64] dark:placeholder:text-[#998F81] shadow-[2px_2px_0_#E3D6BE] dark:shadow-[2px_2px_0_#0A0908] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4169E1] dark:focus-visible:ring-[#6B8FF7] focus:border-[#4169E1] dark:focus:border-[#6B8FF7] transition-colors duration-150"
        />

        <button
          type="submit"
          className="sketch-btn-primary group shrink-0 inline-flex items-center justify-center gap-2 min-h-[50px] px-6 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-[0.06em] whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24211D] dark:focus-visible:outline-[#F5EDE0]"
        >
          <span>KEEP ME IN THE LOOP</span>
          <ArrowUpRight
            className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </button>
      </div>

      <p
        id={noteId}
        className="mt-3 text-xs text-[#5C554C] dark:text-[#BDB3A4] text-center"
      >
        Unsubscribe whenever you like.
      </p>

      <p
        data-gumroad-follow-message=""
        role="status"
        aria-live="polite"
        className="empty:hidden mt-4 rounded-lg border-[1.5px] border-[#4169E1] dark:border-[#6B8FF7] bg-[#4169E1]/8 dark:bg-[#6B8FF7]/12 px-4 py-2.5 text-sm font-semibold text-[#24211D] dark:text-[#F5EDE0] text-center"
      />
    </form>
  );
}
