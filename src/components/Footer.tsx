import { NAV_PAGES, STUDIO_PROFILE } from '../data/studioData';
import { GumroadNewsletterForm } from './GumroadNewsletterForm';
import DoodleCrewFooter, {
  type CrewMember,
  type FooterColumn,
  type FooterLink,
} from './ui/doodle-crew-footer';

interface FooterProps {
  twitterUrl: string | null;
}

/**
 * Character indices on lowercase "faraz kayan":
 * 0:'f', 1:'a', 2:'r', 3:'a', 4:'z', 5:' ', 6:'k', 7:'a', 8:'y', 9:'a', 10:'n'
 */
const STUDIO_CREW: CrewMember[] = [
  { kind: 'bird', letter: 0, seat: 'top', offset: -0.02, name: 'Pip', says: 'Clean grids up here.' },
  { kind: 'yeti', letter: 2, seat: 'front', offset: -0.15, name: 'Bruno', says: 'Need a sharper deck?' },
  { kind: 'mushroom', letter: 4, seat: 'front', offset: 0.14, scale: 0.92, name: 'Morel', says: 'Built to customize.' },
  { kind: 'ghost', letter: 6, seat: 'behind', offset: -0.12, name: 'Boo', says: 'Every frame aligned.' },
  { kind: 'kid', letter: 8, seat: 'front', offset: 0.02, scale: 0.85, name: 'Juno', says: 'Explore the Shop!' },
  { kind: 'cat', letter: 10, seat: 'front', offset: 0.34, flip: true, name: 'Patch', says: 'Direct via Gumroad.' },
];

export function Footer({ twitterUrl }: FooterProps) {
  const columns: FooterColumn[] = [
    {
      title: 'Navigation',
      links: NAV_PAGES.map((page) => ({
        label: page.label,
        href: page.href,
      })),
    },
    {
      title: 'Disciplines',
      links: [
        { label: 'Presentations & Decks', href: '/#shop' },
        { label: 'Canva Systems', href: '/#shop' },
        { label: 'Web & UI Assets', href: '/#shop' },
      ],
    },
    {
      title: 'Elsewhere',
      links: [
        { label: 'farazkh.dev', href: STUDIO_PROFILE.personalWebsiteUrl },
        ...(twitterUrl ? [{ label: 'X / Twitter', href: twitterUrl }] : []),
      ],
    },
  ];

  const socials: FooterLink[] = [
    { label: 'farazkh.dev', href: STUDIO_PROFILE.personalWebsiteUrl },
    ...(twitterUrl ? [{ label: 'X / Twitter', href: twitterUrl }] : []),
  ];

  return (
    <DoodleCrewFooter
      wordmark={STUDIO_PROFILE.brandWordmark}
      brand={STUDIO_PROFILE.brandWordmark}
      preserveCase={true}
      blurb={`Independent digital design studio by ${STUDIO_PROFILE.founderName} (${STUDIO_PROFILE.handle}). Templates and design systems released via Gumroad.`}
      tagline={STUDIO_PROFILE.philosophyPullQuote}
      columns={columns}
      actions={[
        { label: 'Explore the Shop', href: '/#shop', icon: 'sparkle', variant: 'solid' },
        { label: 'About the Studio', href: '/about', icon: 'plane', variant: 'outline' },
      ]}
      copyright={STUDIO_PROFILE.copyrightNotice}
      legal={[]}
      socials={socials}
      crew={STUDIO_CREW}
      doodleCount={0}
      preset="auto"
      fontFamily='"Bricolage Grotesque", "Plus Jakarta Sans", sans-serif'
      serifFamily='"Bricolage Grotesque", "Plus Jakarta Sans", sans-serif'
      tracking={-0.03}
      newsletter={<GumroadNewsletterForm variant="footer" />}
      className="border-t-[1.5px] border-[#E3D6BE] dark:border-[#38322B]"
    />
  );
}
