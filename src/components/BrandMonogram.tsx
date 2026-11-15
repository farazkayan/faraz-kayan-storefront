interface BrandMonogramProps {
  className?: string;
}

/**
 * Handcrafted FK monogram with subtle ink-stamp frame and 4-point cobalt star.
 */
export function BrandMonogram({ className = 'w-7 h-7' }: BrandMonogramProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="2"
        y="3"
        width="26"
        height="26"
        rx="6"
        className="fill-[#FFFBF2] dark:fill-[#292520] stroke-current"
        strokeWidth="1.8"
      />
      {/* Lowercase-inspired clean geometric f + k */}
      <path
        d="M12.5 9.5C11 9.5 10.2 10.4 10.2 12V22M8.2 14.5H13.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.5 10.5V22M21.8 14.2L16.9 18L22.2 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 4-point cobalt sparkle accent in corner */}
      <path
        d="M25.5 2C25.8 4.4 27 5.6 29.5 6C27 6.3 25.8 7.5 25.5 10C25.1 7.5 23.9 6.3 21.5 6C23.9 5.6 25.1 4.4 25.5 2Z"
        className="fill-[#4169E1] dark:fill-[#6B8FF7] stroke-current"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
