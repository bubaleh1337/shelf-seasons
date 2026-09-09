import type { BookSeason } from "@/lib/seasons";

export function SeasonIcon({ season }: { season: BookSeason }) {
  return <svg aria-hidden="true" className="season-icon" viewBox="0 0 32 32">
    {season === "spring" && <><path d="M16 17c-6 0-9-4-7-8 1.3-2.7 4.7-2.4 7 1 2.3-3.4 5.7-3.7 7-1 2 4-1 8-7 8Z" /><path d="M16 15v11M16 22c-3-3-6-2-8-1M16 20c3-3 6-2 8-1" /></>}
    {season === "summer" && <><circle cx="16" cy="16" r="5" /><path d="M16 3v5M16 24v5M3 16h5M24 16h5M7 7l3.5 3.5M21.5 21.5 25 25M25 7l-3.5 3.5M10.5 21.5 7 25" /></>}
    {season === "autumn" && <><path d="M7 23C5 14 11 7 23 6c1 11-6 19-16 17Z" /><path d="M8 22c4-5 8-8 14-14M13 17l-1-5M16 14l5 1" /></>}
    {season === "winter" && <><path d="M16 3v26M5 9l22 14M27 9 5 23M11 6l5 4 5-4M11 26l5-4 5 4M5 15l6 1-1 6M27 17l-6-1 1-6" /></>}
  </svg>;
}

export function SeasonalPageBackdrop({ season }: { season: BookSeason }) {
  return <div className="seasonal-backdrop" data-backdrop-season={season} aria-hidden="true">
    <span className="seasonal-paper-texture" />
    <svg className="seasonal-wallpaper seasonal-wallpaper-top" viewBox="0 0 520 520">
      <BackdropArtwork season={season} />
    </svg>
    <svg className="seasonal-wallpaper seasonal-wallpaper-bottom" viewBox="0 0 520 520">
      <BackdropArtwork season={season} />
    </svg>
    {season === "autumn" && <svg className="seasonal-garland" viewBox="0 0 760 120">
      <path d="M24 29c178 71 477 70 712-2" />
      {[92, 205, 325, 448, 568, 682].map((x, index) => <g key={x} transform={`translate(${x} ${48 + (index % 2) * 18})`}><path d="M0-12v18" /><circle cx="0" cy="17" r="12" /></g>)}
    </svg>}
    <svg className="seasonal-cozy-vignette" viewBox="0 0 460 320">
      <CozyVignette season={season} />
    </svg>
  </div>;
}

function CozyVignette({ season }: { season: BookSeason }) {
  return <>
    <ellipse className="vignette-shadow" cx="246" cy="287" rx="187" ry="18" />
    <g className="vignette-books">
      <path className="vignette-book-cover" d="M54 245h196v32H54c-17 0-17-32 0-32Z" />
      <path className="vignette-pages" d="M65 251h178v20H65c-10 0-10-20 0-20Z" />
      <path className="vignette-book-cover" d="M83 205h190v39H83c-18 0-18-39 0-39Z" />
      <path className="vignette-pages" d="M92 212h173v24H92c-10 0-10-24 0-24Z" />
    </g>
    {season === "spring" && <>
      <path className="vignette-vase" d="M303 159h60l-8 113h-45Z" />
      <path className="vignette-stem" d="M332 163c-15-48-54-73-84-92m83 90c18-55 50-79 82-91m-104 63c-21-14-39-18-57-15m103 0c17-18 35-24 51-25" />
      {[{x:246,y:68},{x:251,y:117},{x:413,y:68},{x:407,y:93},{x:287,y:97}].map(({x,y}) => <g className="vignette-blossom" key={`${x}-${y}`} transform={`translate(${x} ${y})`}><circle cx="-7" r="7"/><circle cx="7" r="7"/><circle cy="-7" r="7"/><circle cy="7" r="7"/><circle r="3"/></g>)}
      <path className="vignette-ribbon" d="M383 246c26-34 49-15 25 8 31 7 17 29-10 10l-17 18-7-7 18-17c-25-3-28-24-9-12Z" />
    </>}
    {season === "summer" && <>
      <path className="vignette-vase" d="M306 172h63l-9 100h-46Z" />
      <path className="vignette-stem" d="M337 173c-7-56-28-83-55-108m57 104c16-60 41-88 73-102m-87 67c-32-17-49-20-69-12m95 3c21-18 37-22 58-18" />
      {[{x:280,y:63},{x:413,y:65},{x:256,y:121},{x:408,y:106}].map(({x,y}) => <g className="vignette-sunflower" key={`${x}-${y}`} transform={`translate(${x} ${y})`}><circle r="17"/><circle className="vignette-book-cover" r="7"/></g>)}
      <path className="vignette-shell" d="M391 271c-2-32 18-50 43-43 20 6 25 31 7 51h-47Zm8-5 15-32m2 35 8-37m8 40-1-34" />
    </>}
    {season === "autumn" && <>
      <path className="vignette-mug" d="M264 212h71v62h-71Zm71 12c43-7 43 43 1 38m-51-63c-20-26 25-32 5-59m22 59c-19-24 20-29 4-51" />
      <path className="vignette-pumpkins" d="M350 270c-23-7-29-36-12-52 13-13 29-8 36 2 10-15 33-12 41 3 17-8 34 7 33 26-1 12-7 19-17 24Zm24-51c-3-15 3-24 16-29m-35 35c6 16 7 31 3 45m23-50c-4 17-4 34-1 51m25-45c-8 14-9 29-6 44" />
      <path className="vignette-leaf" d="M102 191c25-35 67-25 72 10-8 31-41 47-67 30-18-12-20-27-5-40Zm6 34 54-28m-36 17-9-21m25 12 10 17" />
    </>}
    {season === "winter" && <>
      <path className="vignette-mug" d="M276 214h68v59h-68Zm68 11c40-6 40 40 1 36m-48-61c-20-24 22-30 5-56m21 56c-18-23 20-29 4-51" />
      <path className="vignette-tree" d="m381 80-38 64h21l-37 58h25l-38 63h133l-38-63h25l-37-58h21Z" />
      <path className="vignette-stem" d="M78 208c30-46 66-82 119-116m-93 83c27 1 43 8 59 22m-36-51c17-2 33 2 47 11m-19-41c16 2 27 7 38 17" />
      {[{x:70,y:88},{x:132,y:67},{x:214,y:109},{x:251,y:62},{x:408,y:52}].map(({x,y}) => <g className="vignette-snowflake" key={`${x}-${y}`} transform={`translate(${x} ${y})`}><path d="M0-11v22M-10-6 10 6M10-6-10 6"/></g>)}
    </>}
  </>;
}

function BackdropArtwork({ season }: { season: BookSeason }) {
  if (season === "spring") return <>
    <path className="season-line" d="M520 56C410 96 374 195 288 244c-77 45-168 38-256 134" />
    {[{ x: 414, y: 116 }, { x: 363, y: 180 }, { x: 294, y: 236 }, { x: 218, y: 270 }, { x: 130, y: 314 }].map(({ x, y }) => <g className="season-flower" key={`${x}-${y}`} transform={`translate(${x} ${y})`}><circle r="7" /><circle cx="10" cy="-3" r="7" /><circle cx="5" cy="-12" r="7" /><circle cx="-6" cy="-10" r="7" /><circle cx="-8" cy="1" r="7" /><circle className="season-accent-fill" cx="1" cy="-5" r="3" /></g>)}
    <path className="season-fill" d="M455 80c-8 34-31 38-47 31 10-27 26-38 47-31ZM336 186c-3 27-21 34-39 30 6-23 18-34 39-30ZM196 271c-2 29-23 36-41 30 7-23 20-34 41-30Z" />
  </>;
  if (season === "summer") return <>
    <circle className="season-sun" cx="418" cy="102" r="58" />
    <circle className="season-sun-ring" cx="418" cy="102" r="82" />
    <path className="season-line" d="M520 325c-91-40-173-48-249-15C171 353 129 431 24 466" />
    <path className="season-fill" d="M425 284c-2 51-34 69-70 65 5-43 27-67 70-65ZM317 308c-17 48-54 55-87 40 18-39 47-54 87-40ZM206 355c-10 50-45 62-80 53 13-41 40-60 80-53Z" />
    <path className="season-accent-fill" d="M490 344c-11 29-34 36-57 28 12-25 31-34 57-28ZM141 405c-2 34-26 44-50 37 8-29 25-42 50-37Z" />
  </>;
  if (season === "autumn") return <>
    <path className="season-line" d="M520 44C413 91 396 202 303 247c-83 40-173 24-277 136" />
    {[{ x: 450, y: 102, r: -18 }, { x: 390, y: 177, r: 19 }, { x: 318, y: 230, r: -15 }, { x: 238, y: 264, r: 25 }, { x: 156, y: 307, r: -18 }, { x: 87, y: 361, r: 18 }].map(({ x, y, r }, index) => <path className={index % 2 ? "season-accent-fill" : "season-fill"} d="M0-24C18-17 24-3 16 14 7 29-10 31-20 17-31 1-22-17 0-24Zm-1 5v43" key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r})`} />)}
    <circle className="season-soft-fill" cx="433" cy="420" r="78" />
    <circle className="season-soft-fill" cx="314" cy="456" r="46" />
  </>;
  return <>
    <path className="season-line" d="M518 82c-116 48-128 168-238 201-78 23-154 6-260 96" />
    <path className="season-line" d="M456 100 410 215h34l-51 111h45l-60 135M333 183l-27 69h20l-31 68h25l-36 88" />
    {[{ x: 448, y: 72 }, { x: 369, y: 139 }, { x: 264, y: 219 }, { x: 166, y: 294 }, { x: 84, y: 354 }].map(({ x, y }) => <g className="season-snow" key={`${x}-${y}`} transform={`translate(${x} ${y})`}><path d="M0-14v28M-12-7 12 7M12-7-12 7" /><circle r="2" /></g>)}
    <circle className="season-soft-fill" cx="436" cy="420" r="92" />
  </>;
}

export function ShelfOrnaments({ season }: { season: BookSeason }) {
  return <svg aria-hidden="true" className="shelf-ornaments" viewBox="0 0 190 150">
    {season === "spring" && <>
      <path className="decor-wood" d="M32 136h54l-8-56H41Z" /><path className="decor-line" d="M58 81c2-42 13-56 38-68M62 75C42 50 37 36 40 22M72 57c23-18 38-21 54-19" />
      <g className="decor-petal"><circle cx="95" cy="14" r="6" /><circle cx="104" cy="12" r="6" /><circle cx="101" cy="22" r="6" /><circle cx="92" cy="22" r="6" /></g><g className="decor-petal"><circle cx="126" cy="38" r="5" /><circle cx="134" cy="36" r="5" /><circle cx="131" cy="45" r="5" /><circle cx="123" cy="46" r="5" /></g><g className="decor-petal"><circle cx="40" cy="22" r="5" /><circle cx="48" cy="20" r="5" /><circle cx="45" cy="29" r="5" /><circle cx="37" cy="29" r="5" /></g>
      <path className="decor-accent" d="M122 121c9-15 26-15 36-1-13-3-20 4-24 16h-9c3-7 2-12-3-15Z" />
    </>}
    {season === "summer" && <>
      <path className="decor-ceramic" d="M37 137h65c5-28 1-50-12-66H49c-13 16-17 38-12 66Z" /><path className="decor-line" d="M70 71c-2-38 4-54 25-65M69 67C51 48 45 31 48 17M74 54c22-10 36-9 50-1" />
      <circle className="decor-sun" cx="96" cy="14" r="12" /><circle className="decor-sun" cx="48" cy="19" r="9" /><circle className="decor-sun" cx="126" cy="54" r="8" />
      <path className="decor-accent" d="M126 137c5-24 23-37 45-34-1 22-19 35-45 34Z" /><path className="decor-line" d="M131 132c13-13 24-20 35-24" />
    </>}
    {season === "autumn" && <>
      <path className="decor-lamp" d="M28 137h58l-7-14H35Zm15-19 5-48h19l5 48Z" /><path className="decor-accent" d="M39 70h38L65 28H51Z" /><circle className="decor-glow" cx="58" cy="76" r="33" />
      <path className="decor-pumpkin" d="M103 137c-13-3-20-14-18-27 2-15 13-24 27-22 9-10 26-6 31 5 14-1 24 10 24 24 0 11-7 18-17 20Z" /><path className="decor-line" d="M126 89c-4-9-2-16 6-21M106 94c4 15 4 29 0 42M129 91c-2 16-1 31 2 45M150 98c-6 13-7 26-4 38" />
      <path className="decor-leaf" d="M154 74c14-11 26-5 27 8-12 5-22 3-27-8ZM103 73c-12-9-22-4-22 8 11 4 18 2 22-8Z" />
    </>}
    {season === "winter" && <>
      <path className="decor-tree" d="m43 136 12-30H45l15-31H50l25-47 25 47H90l15 31H95l12 30Z" /><rect className="decor-wood" x="69" y="127" width="13" height="10" rx="2" />
      <path className="decor-mug" d="M116 93h48v44h-48Z" /><path className="decor-line" d="M164 103c24-2 26 28 1 27M125 83c-8-14 10-17 1-31M143 83c-7-13 10-16 2-29" />
      <circle className="decor-globe" cx="139" cy="42" r="25" /><path className="decor-snow" d="M139 26v31M125 34l28 16M153 34l-28 16" /><path className="decor-wood" d="M120 67h38l6 14h-50Z" />
    </>}
  </svg>;
}
