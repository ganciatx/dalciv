/** Tax Identity Shield mark for booth branding. */
export function ShieldMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M32 4L8 14v22c0 16.2 10.4 31.3 24 36 13.6-4.7 24-19.8 24-36V14L32 4z"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M32 8L12 16.5v19.5c0 13.8 8.9 26.7 20 30.8 11.1-4.1 20-17 20-30.8V16.5L32 8z"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M24 36l6 6 12-14"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
