interface PadelIconProps {
  className?: string;
}

export function PadelIcon({ className = 'h-6 w-6' }: PadelIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Left paddle */}
      <path d="M4.5 2.5c-1.5 0-2.5 1-2.5 2.5v5c0 2.5 2 4.5 4.5 4.5S11 12.5 11 10V5c0-1.5-1-2.5-2.5-2.5h-4z" />
      <line x1="6.5" y1="14.5" x2="5" y2="21.5" />
      {/* Left paddle holes */}
      <circle cx="5" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="8" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="5" cy="9.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="8" cy="9.5" r="0.7" fill="currentColor" stroke="none" />
      {/* Right paddle */}
      <path d="M19.5 2.5c1.5 0 2.5 1 2.5 2.5v5c0 2.5-2 4.5-4.5 4.5S13 12.5 13 10V5c0-1.5 1-2.5 2.5-2.5h4z" />
      <line x1="17.5" y1="14.5" x2="19" y2="21.5" />
      {/* Right paddle holes */}
      <circle cx="16" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="19" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="16" cy="9.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="19" cy="9.5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}
