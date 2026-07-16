import Image from "next/image";
import Link from "next/link";

/** Logo asset (wordmark: PROBLEM + FRAME in frame); lives in `/public`. */
const LOGO_SRC = "/problem-frame-logo.png";

type BrandLogoProps = {
  className?: string;
  /** Tailwind height classes for responsive sizing. */
  heightClass?: string;
};

/**
 * Raster wordmark for “Problem Frame”. Use next to navigation or on auth screens.
 */
export function BrandLogo({
  className = "",
  heightClass = "h-8 w-auto sm:h-9",
}: BrandLogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Problem Frame"
      width={220}
      height={62}
      className={`${heightClass} ${className}`}
      priority
    />
  );
}

/**
 * Clickable logo; default target is the main app area after sign-in.
 */
export function BrandLogoLink({
  href = "/products",
  className = "",
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center ${className}`}
      aria-label="Problem Frame home"
    >
      <BrandLogo />
    </Link>
  );
}
