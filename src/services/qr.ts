// Draws a friend QR code in the style of the in-game one: round dots, rounded finder
// squares, a green gradient and two trainers in the middle.
// All coordinates are in modules (one QR "pixel").

const BORDER = 2
const DOT_RADIUS = 0.35
const FINDER_SIZE = 7

const COLOR_TOP = '#55ba70'
const COLOR_BOTTOM = '#3e8c8a'
const BACKGROUND = '#eff6f9'

// Trainer outline centered on its head: round head flowing into a bell shaped body
const TRAINER_PATH =
  'M-1.9 2.95H1.9C1.9 1.9 1.55 1.35 0.93 1.05A1.4 1.4 0 1 0-0.93 1.05C-1.55 1.35-1.9 1.9-1.9 2.95Z'
const TRAINER_EYES =
  '<rect x="-0.47" y="-0.45" width="0.22" height="0.65" rx="0.11"/>' +
  '<rect x="0.25" y="-0.45" width="0.22" height="0.65" rx="0.11"/>'
const TRAINER_STROKE = 0.58
// Space between the front trainer and the one behind
const TRAINER_GAP = 0.45
// Space cleared around the trainers
const LOGO_MARGIN = 0.6

const roundedRect = (x: number, y: number, size: number, r: number) =>
  `M${x + r} ${y}h${size - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${size - 2 * r}` +
  `a${r} ${r} 0 0 1 ${-r} ${r}h${2 * r - size}a${r} ${r} 0 0 1 ${-r} ${-r}` +
  `v${2 * r - size}a${r} ${r} 0 0 1 ${r} ${-r}z`

const finder = (x: number, y: number) =>
  roundedRect(x, y, 7, 1.1) + roundedRect(x + 1, y + 1, 5, 0.5) + roundedRect(x + 2, y + 2, 3, 0.45)

const trainer = (x: number, y: number, mask: string) =>
  `<g transform="translate(${x} ${y})">${mask}` +
  `<path d="${TRAINER_PATH}" fill="none" stroke="white" stroke-width="${TRAINER_STROKE}"/>` +
  `<g fill="white">${TRAINER_EYES}</g></g>`

export const renderFriendQRSVG = (
  { size, data }: { size: number; data: boolean[][] },
  id: string,
) => {
  const viewSize = size + 2 * BORDER
  const center = viewSize / 2
  const isFinder = (x: number, y: number) =>
    ((x < FINDER_SIZE || x >= size - FINDER_SIZE) && y < FINDER_SIZE) ||
    (x < FINDER_SIZE && y >= size - FINDER_SIZE)

  let dots = ''
  data.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (!dark || isFinder(x, y)) return
      dots +=
        `M${x + BORDER + 0.5 - DOT_RADIUS} ${y + BORDER + 0.5}` +
        `a${DOT_RADIUS} ${DOT_RADIUS} 0 1 0 ${2 * DOT_RADIUS} 0` +
        `a${DOT_RADIUS} ${DOT_RADIUS} 0 1 0 ${-2 * DOT_RADIUS} 0`
    }),
  )

  const finders =
    finder(BORDER, BORDER) +
    finder(BORDER + size - FINDER_SIZE, BORDER) +
    finder(BORDER, BORDER + size - FINDER_SIZE)

  // The back trainer stands up and to the right of the front one
  const back = [center + 1.75, center - 1.85]
  const front = [center - 1.75, center + 0.15]
  const clearing = (width: number) =>
    `<path d="${TRAINER_PATH}" fill="black" stroke="black" stroke-width="${width}"/>`

  // Everything is drawn white in a mask over a single gradient, so the dots get cut
  // around the trainers the same way the in-game code does
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewSize} ${viewSize}">
<defs>
<linearGradient id="${id}-gradient" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${COLOR_TOP}"/><stop offset="1" stop-color="${COLOR_BOTTOM}"/>
</linearGradient>
<mask id="${id}-mask">
<path d="${dots}" fill="white"/>
<path d="${finders}" fill="white" fill-rule="evenodd"/>
${[back, front].map(([x, y]) => `<g transform="translate(${x} ${y})">${clearing(TRAINER_STROKE + 2 * LOGO_MARGIN)}</g>`).join('')}
${trainer(back[0], back[1], '')}
${trainer(front[0], front[1], clearing(TRAINER_STROKE + 2 * TRAINER_GAP))}
</mask>
</defs>
<rect width="${viewSize}" height="${viewSize}" rx="1" fill="${BACKGROUND}"/>
<rect width="${viewSize}" height="${viewSize}" fill="url(#${id}-gradient)" mask="url(#${id}-mask)"/>
</svg>`
}
