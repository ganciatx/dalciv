/** Mini crossword grid icon used in nav and footer. */

export function LandingLogo({ size = 'md' }: { size?: 'md' | 'sm' }) {
  const markSize = size === 'sm' ? 14 : 18
  const gap = size === 'sm' ? 2 : 2.5
  const textClass = size === 'sm' ? 'landing-logo-text text-[14px]' : 'landing-logo-text'

  return (
    <>
      <div
        className="landing-logo-mark"
        style={{ width: markSize, height: markSize, gap }}
        aria-hidden
      >
        <span style={{ background: size === 'sm' ? '#C8C5BE' : '#0D0D0C' }} />
        <span style={{ background: size === 'sm' ? '#0D0D0C' : '#C8C5BE' }} />
        <span style={{ background: size === 'sm' ? '#0D0D0C' : '#C8C5BE' }} />
        <span style={{ background: size === 'sm' ? '#C8C5BE' : '#0D0D0C' }} />
      </div>
      <span className={textClass}>Crossword Constructor</span>
    </>
  )
}
