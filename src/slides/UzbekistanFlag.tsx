/** Curved bands and fabric shading retain a crisp flag at every TV resolution. */
export function UzbekistanFlag() {
  const star = "0,-6 1.8,-1.9 5.7,-1.9 2.8,.8 3.6,4.9 0,2.5 -3.6,4.9 -2.8,.8 -5.7,-1.9 -1.8,-1.9"
  return <svg className="schedule-flag" viewBox="0 0 600 330" aria-hidden="true">
    <defs>
      <clipPath id="flag-wave"><path d="M20 42C200-30 390 115 580 40L580 280C390 355 200 210 20 282Z" /></clipPath>
      <linearGradient id="flag-fabric"><stop stopColor="#fff" stopOpacity=".5" /><stop offset=".24" stopColor="#000" stopOpacity=".16" /><stop offset=".48" stopColor="#fff" stopOpacity=".45" /><stop offset=".72" stopColor="#000" stopOpacity=".18" /><stop offset="1" stopColor="#fff" stopOpacity=".35" /></linearGradient>
    </defs>
    <g clipPath="url(#flag-wave)">
      <path d="M20 42C200-30 390 115 580 40V122C390 197 200 52 20 124Z" fill="#1eb5db" />
      <path d="M20 120C200 48 390 193 580 118V202C390 277 200 132 20 204Z" fill="#fff" />
      <path d="M20 200C200 128 390 273 580 198V280C390 355 200 210 20 282Z" fill="#21a45d" />
      <path d="M20 121C200 49 390 194 580 119M20 202C200 130 390 275 580 200" stroke="#db465b" strokeWidth="5" fill="none" />
      <path d="M71 42a29 29 0 1 0 15 49 25 25 0 1 1-15-49" fill="#fff" />
      {[3,4,5].flatMap((count,row)=>Array.from({length:count},(_,col)=><polygon key={`${row}-${col}`} points={star} fill="#fff" transform={`translate(${118 + (5-count)*17 + col*17} ${43 + row*20})`} />))}
      <path d="M20 42C200-30 390 115 580 40V280C390 355 200 210 20 282Z" fill="url(#flag-fabric)" />
    </g>
  </svg>
}
