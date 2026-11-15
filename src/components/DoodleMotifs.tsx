interface DoodleProps {
  className?: string;
}

/**
 * Hand-drawn 4-point sketchbook star. Used sparingly as an accent mark.
 */
export function DoodleStar({ className = 'w-5 h-5' }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M14 2.5C14.7 9.1 18.8 13.1 25.5 14C18.9 14.8 14.8 18.9 14 25.5C13.1 18.9 9.1 14.9 2.5 14C9.1 13.2 13.2 9.1 14 2.5Z"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Hand-drawn 6-point sketchbook asterisk (✳) for eyebrows and margin notes.
 */
export function DoodleAsterisk({ className = 'w-4 h-4' }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12 3V21M4.3 7.5L19.7 16.5M19.7 7.5L4.3 16.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Crisp 3-sparkle cluster for hero margins and section accents.
 */
export function DoodleSparkles({ className = 'w-7 h-7' }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M15 4.5C15.5 10.2 18.8 13.5 24.5 14C18.8 14.6 15.5 17.9 15 23.5C14.4 17.9 11.1 14.6 5.5 14C11.1 13.4 14.4 10.2 15 4.5Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M27.5 21C27.8 23.6 29.4 25.2 32 25.5C29.4 25.8 27.8 27.4 27.5 30C27.2 27.4 25.6 25.8 23 25.5C25.6 25.2 27.2 23.6 27.5 21Z"
        stroke="#F2765B"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="27.5" r="2" fill="#B9D977" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Hand-drawn wavy squiggle underline for emphasis words and active navigation.
 */
export function DoodleSquiggle({ className = 'w-full h-3' }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 220 14"
      fill="none"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M2 8.5C18 3.2 31 11.4 48 6.8C65 2.2 80 11 97 6.5C114 2 129 11.2 146 6.7C163 2.2 178 10.8 195 6.4C204 4.1 212 6.8 218 7.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Hand-drawn curved arrow for margin annotations.
 */
export function DoodleCurvedArrow({ className = 'w-12 h-9' }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 64 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M5 10C19 6 38 11 51 29"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M41 29.5L52.2 31L51.5 19.8"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Hand-drawn masking-tape corner accent for hero/about sketchbook cards.
 */
export function DoodleTapeCorner({ className = 'w-14 h-5' }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 72 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M4 5L66 2L69 19L6 22L4 5Z"
        fill="#B9D977"
        fillOpacity="0.65"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M16 9L24 16M35 8L43 15"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Hand-drawn stamped studio postcard / postbox illustration for newsletter sections.
 */
export function DoodlePostbox({ className = 'w-14 h-11' }: DoodleProps) {
  return (
    <svg
      viewBox="0 0 88 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Subtle drop shadow card */}
      <rect
        x="10"
        y="14"
        width="68"
        height="42"
        rx="6"
        className="fill-[#24211D]/15 dark:fill-[#0A0908]/60"
      />
      {/* Main postcard envelope */}
      <rect
        x="6"
        y="10"
        width="68"
        height="42"
        rx="6"
        className="fill-[#FFFBF2] dark:fill-[#292520] stroke-current"
        strokeWidth="2.1"
      />
      {/* Folded flap */}
      <path
        d="M7.5 12L40 34L72.5 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Coral stamp seal at center */}
      <circle
        cx="40"
        cy="34"
        r="7"
        fill="#F2765B"
        className="stroke-current"
        strokeWidth="1.7"
      />
      {/* Small lime corner postage mark */}
      <rect
        x="56"
        y="16"
        width="11"
        height="11"
        rx="2"
        fill="#B9D977"
        className="stroke-current"
        strokeWidth="1.5"
      />
      {/* Tiny cobalt sparkle */}
      <path
        d="M78 4C78.3 6.8 79.7 8.2 82.5 8.5C79.7 8.8 78.3 10.2 78 13C77.7 10.2 76.3 8.8 73.5 8.5C76.3 8.2 77.7 6.8 78 4Z"
        className="fill-[#4169E1] dark:fill-[#6B8FF7] stroke-current"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Custom hand-drawn graphic designer's desk & open sketchbook illustration
 * created for the About page. Adapts gracefully to both warm-paper light mode
 * and nighttime-studio dark mode via CSS custom properties and Tailwind classes.
 */
export function DoodleStudioDeskIllustration({
  className = 'w-full h-auto',
}: DoodleProps) {
  return (
    <svg
      viewBox="0 0 460 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Hand-drawn illustration of an open graphic designer sketchbook, color swatch cards, pen, and coffee cup on a studio desk"
      className={className}
    >
      {/* Subtle studio desk dot grid */}
      <g className="text-[#24211D]/20 dark:text-[#F5EDE0]/20">
        {[48, 88, 128, 168, 208, 248, 288, 328, 368, 408].map((x) =>
          [38, 78, 118, 158, 198, 238, 278].map((y) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="currentColor" />
          ))
        )}
      </g>

      {/* Open Sketchbook base shadow */}
      <rect
        x="62"
        y="64"
        width="302"
        height="198"
        rx="8"
        className="fill-[#24211D] dark:fill-[#0E0C0A]"
      />

      {/* Open Sketchbook cover & pages */}
      <rect
        x="56"
        y="58"
        width="302"
        height="198"
        rx="8"
        className="fill-[#FFFBF2] dark:fill-[#292520] stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="2.2"
      />

      {/* Center sketchbook spine & spiral rings */}
      <line
        x1="207"
        y1="58"
        x2="207"
        y2="256"
        className="stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="2"
      />
      {[82, 114, 146, 178, 210, 238].map((y) => (
        <path
          key={y}
          d={`M198 ${y}C202 ${y - 5} 212 ${y - 5} 216 ${y}`}
          className="stroke-[#4169E1] dark:stroke-[#6B8FF7]"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ))}

      {/* Left page: Editorial grid layout wire sketch */}
      <rect
        x="78"
        y="80"
        width="108"
        height="58"
        rx="3"
        className="fill-[#4169E1]/14 dark:fill-[#6B8FF7]/20 stroke-[#4169E1] dark:stroke-[#6B8FF7]"
        strokeWidth="1.9"
      />
      <path
        d="M88 125L114 98L134 118L152 103L174 126"
        className="stroke-[#4169E1] dark:stroke-[#6B8FF7]"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="164" cy="94" r="5" fill="#F2765B" />

      {/* Left page typography lines */}
      <path
        d="M79 156H166M79 170H150M79 184H162"
        className="stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      {/* Hand-drawn wavy underline in coral */}
      <path
        d="M79 206C92 200 105 211 118 205C131 199 144 210 158 204"
        stroke="#F2765B"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Lime sticker corner */}
      <rect
        x="79"
        y="222"
        width="44"
        height="16"
        rx="3"
        fill="#B9D977"
        className="stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="1.7"
      />

      {/* Right page: Swatches, ruler marks & four-point star */}
      <rect
        x="228"
        y="80"
        width="108"
        height="72"
        rx="4"
        className="fill-[#FFF7E8] dark:fill-[#211E1A] stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="1.9"
        strokeDasharray="5 4"
      />
      {/* Three color swatches */}
      <circle
        cx="254"
        cy="116"
        r="14"
        fill="#4169E1"
        className="stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="1.9"
      />
      <circle
        cx="282"
        cy="116"
        r="14"
        fill="#F2765B"
        className="stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="1.9"
      />
      <circle
        cx="310"
        cy="116"
        r="14"
        fill="#B9D977"
        className="stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="1.9"
      />

      {/* Right page grid blocks */}
      <rect
        x="228"
        y="170"
        width="48"
        height="48"
        rx="4"
        className="fill-[#F2765B]/18 stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="1.8"
      />
      <rect
        x="286"
        y="170"
        width="50"
        height="20"
        rx="3"
        className="fill-[#B9D977]/35 stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="1.8"
      />
      <rect
        x="286"
        y="198"
        width="50"
        height="20"
        rx="3"
        className="fill-[#4169E1]/20 stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="1.8"
      />
      <path
        d="M252 183C252.5 189 255 191.5 261 192C255 192.5 252.5 195 252 201C251.5 195 249 192.5 243 192C249 191.5 251.5 189 252 183Z"
        fill="#F2765B"
        className="stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Angled Studio Pen */}
      <g transform="rotate(-24 388 188)">
        <rect
          x="378"
          y="108"
          width="16"
          height="132"
          rx="7"
          fill="#4169E1"
          className="stroke-[#24211D] dark:stroke-[#F5EDE0]"
          strokeWidth="2.1"
        />
        <path
          d="M378 228L386 254L394 228Z"
          className="fill-[#FFFBF2] dark:fill-[#F5EDE0] stroke-[#24211D] dark:stroke-[#F5EDE0]"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="386" cy="249" r="2" className="fill-[#24211D]" />
        <rect
          x="380"
          y="124"
          width="12"
          height="10"
          fill="#B9D977"
          className="stroke-[#24211D] dark:stroke-[#F5EDE0]"
          strokeWidth="1.5"
        />
      </g>

      {/* Studio Mug top-right */}
      <circle
        cx="402"
        cy="68"
        r="24"
        className="fill-[#F5EBDA] dark:fill-[#292520] stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="2.1"
      />
      <path
        d="M424 62C434 62 436 74 424 75"
        className="stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle
        cx="402"
        cy="68"
        r="15"
        fill="#7C583E"
        className="stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="1.7"
      />

      {/* Floating 4-point sparkle accents */}
      <path
        d="M34 92C34.5 98 37.5 101 43.5 101.5C37.5 102 34.5 105 34 111C33.5 105 30.5 102 24.5 101.5C30.5 101 33.5 98 34 92Z"
        fill="#B9D977"
        className="stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M342 30C342.4 35 345 37.6 350 38C345 38.4 342.4 41 342 46C341.6 41 339 38.4 334 38C339 37.6 341.6 35 342 30Z"
        fill="#F2765B"
        className="stroke-[#24211D] dark:stroke-[#F5EDE0]"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M32 252C44 268 62 278 86 280"
        className="stroke-[#4169E1] dark:stroke-[#6B8FF7]"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M78 273L88 280.5L78 287"
        className="stroke-[#4169E1] dark:stroke-[#6B8FF7]"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
