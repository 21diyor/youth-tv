import type { CSSProperties } from "react"

/** One crisp, shaded celebration icon, independent of the TV's emoji font. */
export function PremiumPopper() {
  return <svg viewBox="0 0 120 120" width="96" height="96" role="img" aria-label="Bayram tabrigi">
    <defs>
      <linearGradient id="popper-gold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0a8" /><stop offset=".42" stopColor="#eab84d" /><stop offset=".72" stopColor="#ba7b20" /><stop offset="1" stopColor="#fff0b5" /></linearGradient>
      <linearGradient id="popper-blue" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#77c8fb" /><stop offset="1" stopColor="#2346a0" /></linearGradient>
      <filter id="popper-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#866128" floodOpacity=".2" /></filter>
    </defs>
    <g filter="url(#popper-shadow)"><path d="M17 105 37 43 78 83Z" fill="url(#popper-gold)" stroke="#ba862d" strokeWidth="1.5" /><path d="m25 82 10-29 14 14-7 23Z" fill="url(#popper-blue)" /><path d="m19 99 7-17 15 8-3 6Z" fill="#fff5cb" opacity=".8" /><ellipse cx="58" cy="63" rx="29" ry="11" transform="rotate(44 58 63)" fill="#86652b" stroke="#f2d38a" strokeWidth="4" /><ellipse cx="58" cy="63" rx="23" ry="6" transform="rotate(44 58 63)" fill="#433257" /></g>
    <g fill="none" strokeLinecap="round" strokeWidth="5"><path d="M58 44C43 29 69 23 57 10" stroke="#d9a632" /><path d="M76 61C87 39 105 66 111 39" stroke="#3a79c5" /><path d="M72 42C88 28 76 17 92 11" stroke="#baa0cf" /></g>
    <path d="m91 72 4 9 10 1-8 7 2 10-9-5-9 5 2-10-8-7 11-1Z" fill="url(#popper-gold)" />
    <path d="m32 18 3 7 8 1-6 5 1 8-6-4-7 4 1-8-6-5 8-1Z" fill="#68b1d2" />
    <circle cx="101" cy="24" r="4" fill="#e8bd61" /><circle cx="40" cy="8" r="3" fill="#a696c4" /><circle cx="109" cy="65" r="3" fill="#70b6c8" />
  </svg>
}

export function CornerConfetti() {
  return <div className="corner-confetti" aria-hidden="true">
    {Array.from({ length: 40 }, (_, i) => {
      const side = i % 2
      const spread = (i * 47 % 100) / 100
      return <i key={i} className={`corner-particle ${i % 5 === 0 ? "confetti-ribbon" : ""}`} style={{
        left: side ? "100%" : "0%",
        background: ["#d6ac52", "#2465b0", "#79c2bd", "#ead4a4", "#b29acb", "#f0a4b4"][i % 6],
        "--dx": `${(side ? -1 : 1) * (250 + spread * 1050)}px`,
        "--dy": `${-(430 + (i * 31 % 100) * 5.1)}px`,
        "--spin": `${(side ? -1 : 1) * (360 + i * 19)}deg`,
        animationDelay: `${Math.floor(i / 40) * .5 + (i % 20) * .012}s`,
        animationDuration: `${3.3 + (i % 7) * .17}s`,
      } as CSSProperties} />
    })}
  </div>
}
