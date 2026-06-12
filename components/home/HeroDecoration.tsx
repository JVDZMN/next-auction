'use client'

export function HeroDecoration() {
  return (
    <>
      {/* Desktop — large geometric panel, right-aligned */}
      <svg
        className="absolute right-0 top-0 pointer-events-none hidden lg:block"
        style={{ zIndex: 0, width: '40%', height: '100%' }}
        viewBox="0 0 600 600"
        preserveAspectRatio="xMaxYMid slice"
        fill="none"
      >
        <path d="M 400 0 L 600 200" stroke="var(--copper)" strokeOpacity="0.25" strokeWidth="1"/>
        <path d="M 350 50 L 500 50 L 500 200" stroke="var(--copper)" strokeOpacity="0.2" strokeWidth="1"/>
        <path d="M 250 0 L 250 100 L 450 100" stroke="#9ca3af" strokeOpacity="0.25" strokeWidth="1"/>
        <path d="M 500 400 L 600 400 L 600 500" stroke="var(--copper)" strokeOpacity="0.2" strokeWidth="1"/>
        <path d="M 300 250 L 380 250 L 380 350" stroke="#9ca3af" strokeOpacity="0.15" strokeWidth="1"/>

        <rect x="392" y="-8" width="16" height="16" className="pulse-diamond" fill="var(--copper)" opacity="0.35" transform="rotate(45 400 0)"/>
        <rect x="492" y="192" width="14" height="14" fill="var(--copper)" opacity="0.3" transform="rotate(45 499 199)"/>
        <rect x="592" y="392" width="12" height="12" fill="var(--copper)" opacity="0.3" transform="rotate(45 598 398)"/>

        <rect x="242" y="-8" width="14" height="14" fill="#9ca3af" opacity="0.3" transform="rotate(45 249 0)"/>
        <rect x="442" y="92" width="10" height="10" fill="#9ca3af" opacity="0.25" transform="rotate(45 447 97)"/>
      </svg>

      <svg
        className="absolute top-2 right-2 w-28 h-28 pointer-events-none lg:hidden"
        style={{ zIndex: 20 }}
        viewBox="0 0 120 120"
        fill="none"
      >
        <path d="M 60 0 L 120 60" stroke="var(--copper)" strokeOpacity="0.3" strokeWidth="1"/>
        <path d="M 30 0 L 30 30 L 90 30" stroke="#9ca3af" strokeOpacity="0.3" strokeWidth="1"/>
        <rect x="54" y="2" width="12" height="12" fill="var(--copper)" className="pulse-diamond" opacity="0.45" transform="rotate(45 60 8)"/>
        <rect x="24" y="24" width="8" height="8" fill="#9ca3af" opacity="0.4" transform="rotate(45 28 28)"/>
      </svg>
    </>
  )
}
