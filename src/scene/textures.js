import * as THREE from 'three'

/** All textures here are generated at runtime on a 2D canvas (or loaded from a
 * small CC0 photo for the floor — see ASSETS_CREDITS.md) — no fabricated imagery. */

const photoLoader = new THREE.TextureLoader()
const assetBase = import.meta.env.BASE_URL

/** Loads a real (CC0) photographed PBR color+normal pair tiled to the given repeat
 * count, for the room's floor. */
export function loadSurfaceTextures(colorFile, normalFile, repeatX, repeatY) {
  const map = photoLoader.load(`${assetBase}textures/${colorFile}`)
  map.wrapS = THREE.RepeatWrapping
  map.wrapT = THREE.RepeatWrapping
  map.repeat.set(repeatX, repeatY)
  map.colorSpace = THREE.SRGBColorSpace

  const normalMap = photoLoader.load(`${assetBase}textures/${normalFile}`)
  normalMap.wrapS = THREE.RepeatWrapping
  normalMap.wrapT = THREE.RepeatWrapping
  normalMap.repeat.set(repeatX, repeatY)

  return { map, normalMap }
}

function canvas(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  draw(ctx, w, h)
  const texture = new THREE.CanvasTexture(c)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** Deterministic PRNG, so the skyline is the same building-for-building by day
 * and by night. */
function seededRandom(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}

function mixColor(a, b, t) {
  const pa = hexToRgb(a)
  const pb = hexToRgb(b)
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`
}

const SKY = {
  night: ['#0a0c1a', '#141a2e', '#1c2436'],
  day: ['#3f7fc8', '#79b0e6', '#c4def2'],
  golden: ['#2c3264', '#c4647a', '#ffb067'],
}

/** The view out the window: São Paulo a few floors up, redrawn for the time of
 * day — stars and lit windows at night, blue sky and the sun crossing it by day,
 * an orange horizon at dawn and dusk. */
export function createWindowView() {
  const W = 320
  const H = 384
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  const texture = new THREE.CanvasTexture(c)
  texture.colorSpace = THREE.SRGBColorSpace

  const rng = seededRandom(7)
  const stars = Array.from({ length: 60 }, () => [rng() * W, rng() * H * 0.45, 0.2 + rng() * 0.5])
  const clouds = Array.from({ length: 4 }, () => [rng() * W, 30 + rng() * 110, 40 + rng() * 50])
  const buildings = []
  let x = 0
  while (x < W) {
    const bw = 24 + rng() * 30
    const bh = 90 + rng() * 190
    const cols = Math.max(2, Math.floor(bw / 7))
    const rows = Math.max(3, Math.floor(bh / 10))
    const windows = []
    for (let r = 0; r < rows; r += 1) {
      for (let col = 0; col < cols; col += 1) windows.push([col, r, rng() < 0.35, rng() < 0.7])
    }
    buildings.push({ x, bw, bh, shade: rng(), windows })
    x += bw + 2
  }
  const FACADES = ['#7d8798', '#9aa1ad', '#6b778a', '#a89f92']

  function draw({ day, golden, sunX, sunHeight, sunUp }) {
    const night = 1 - day
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    SKY.night.forEach((nightStop, i) => {
      const base = mixColor(nightStop, SKY.day[i], day)
      const [r, g, b] = base.match(/\d+/g).map(Number)
      const gold = hexToRgb(SKY.golden[i])
      sky.addColorStop([0, 0.6, 1][i], `rgb(${[r, g, b].map((v, k) => Math.round(v + (gold[k] - v) * golden)).join(',')})`)
    })
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)

    stars.forEach(([sx, sy, a]) => {
      ctx.fillStyle = `rgba(255,255,255,${a * night * (1 - golden)})`
      ctx.fillRect(sx, sy, 1, 1)
    })
    if (night > 0.5) {
      // a crescent moon, high and to the left
      ctx.globalAlpha = (night - 0.5) * 2
      ctx.fillStyle = '#e8e6f0'
      ctx.beginPath()
      ctx.arc(70, 64, 13, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = mixColor(SKY.night[0], SKY.night[1], 0.3)
      ctx.beginPath()
      ctx.arc(77, 59, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }

    if (sunUp) {
      // the sun, low and orange near the horizon, small and white at midday
      const sx = sunX * W
      const sy = 250 - sunHeight * 190
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 90)
      glow.addColorStop(0, `rgba(255,236,190,${0.75 * Math.max(day, golden)})`)
      glow.addColorStop(1, 'rgba(255,236,190,0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = mixColor('#fff7e2', '#ffa257', golden)
      ctx.beginPath()
      ctx.arc(sx, sy, 15 + golden * 4, 0, Math.PI * 2)
      ctx.fill()
    }

    clouds.forEach(([cx, cy, cw]) => {
      ctx.fillStyle = `rgba(255,255,255,${0.55 * day})`
      ctx.beginPath()
      ctx.ellipse(cx, cy, cw, 9, 0, 0, Math.PI * 2)
      ctx.ellipse(cx + cw * 0.35, cy - 7, cw * 0.5, 9, 0, 0, Math.PI * 2)
      ctx.fill()
    })

    buildings.forEach(({ x: bx, bw, bh, shade, windows }) => {
      const by = H - bh
      const nightFacade = `#${[14 + shade * 8, 16 + shade * 8, 26 + shade * 10].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
      ctx.fillStyle = mixColor(nightFacade, FACADES[Math.floor(shade * FACADES.length)], day * 0.85)
      ctx.fillRect(bx, by, bw, bh)
      windows.forEach(([col, r, lit, warm]) => {
        const wx = bx + 3 + col * 7
        const wy = by + 6 + r * 10
        if (lit && night > 0.05) {
          ctx.fillStyle = warm ? `rgba(255,214,140,${0.85 * night})` : `rgba(140,200,255,${0.7 * night})`
          ctx.fillRect(wx, wy, 3, 4)
        } else if (day > 0.05) {
          ctx.fillStyle = `rgba(40,58,84,${0.55 * day})`
          ctx.fillRect(wx, wy, 3, 4)
        }
      })
    })

    // daytime haze over the horizon
    const haze = ctx.createLinearGradient(0, H * 0.45, 0, H)
    haze.addColorStop(0, 'rgba(220,232,242,0)')
    haze.addColorStop(1, `rgba(220,232,242,${0.28 * day})`)
    ctx.fillStyle = haze
    ctx.fillRect(0, H * 0.45, W, H * 0.55)

    // one steady amber beacon on the tallest tower, only in the dark
    ctx.fillStyle = `rgba(255,170,90,${0.9 * night})`
    ctx.beginPath()
    ctx.arc(W * 0.78, H * 0.28, 2.2, 0, Math.PI * 2)
    ctx.fill()

    texture.needsUpdate = true
  }

  return { texture, draw }
}

/** The patch of sun the window throws on the floor: four soft-edged panes split
 * by the window's cross mullion. Drawn additively, so black is transparent. */
export function sunPatchTexture() {
  return canvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, w, h)
    ctx.shadowColor = '#fff'
    ctx.shadowBlur = 18
    ctx.fillStyle = '#fff'
    const pad = 28
    const gap = 8
    const half = (w - pad * 2 - gap) / 2
    ;[0, 1].forEach((cx) => {
      ;[0, 1].forEach((cy) => ctx.fillRect(pad + cx * (half + gap), pad + cy * (half + gap), half, half))
    })
  })
}

/** Vertical falloff for the faint shaft of light between window and floor. */
export function lightShaftTexture() {
  return canvas(16, 128, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#fff')
    g.addColorStop(0.7, '#555')
    g.addColorStop(1, '#000')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })
}

/** The rug under the desk/rest area — a plain, modern area rug: dark plum field,
 * lighter woven border. No fantasy pattern, just a rug someone actually bought. */
export function rugTexture() {
  return canvas(256, 384, (ctx, w, h) => {
    ctx.fillStyle = '#3a1830'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#241020'
    ctx.lineWidth = 10
    ctx.strokeRect(14, 14, w - 28, h - 28)
    ctx.strokeStyle = '#8a6a5a'
    ctx.lineWidth = 3
    ctx.strokeRect(30, 30, w - 60, h - 60)
    ctx.globalAlpha = 0.15
    for (let y = 0; y < h; y += 4) {
      ctx.fillStyle = y % 8 === 0 ? '#000000' : '#ffffff'
      ctx.fillRect(0, y, w, 1)
    }
    ctx.globalAlpha = 1
  })
}

const PIXEL_ICON = [
  '..X....X..',
  '...X..X...',
  '..XXXXXX..',
  '.XX.XX.XX.',
  'XXXXXXXXXX',
  'X.XXXXXX.X',
  'X.X....X.X',
  '...XX.XX..',
]

/** A framed print of the kind every setup like this has on the wall: a pixel
 * icon over a short title, in the room's own neon/cyan/amber palette. */
export function posterTexture({ bg, accent, title, subtitle = '' }) {
  return canvas(256, 352, (ctx, w, h) => {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = accent
    ctx.lineWidth = 8
    ctx.strokeRect(12, 12, w - 24, h - 24)

    const cell = 14
    const iconW = PIXEL_ICON[0].length * cell
    const ox = (w - iconW) / 2
    const oy = 60
    ctx.fillStyle = accent
    PIXEL_ICON.forEach((row, r) => {
      ;[...row].forEach((ch, c) => {
        if (ch === 'X') ctx.fillRect(ox + c * cell, oy + r * cell, cell - 1, cell - 1)
      })
    })

    ctx.textAlign = 'center'
    ctx.fillStyle = accent
    ctx.font = 'bold 38px "JetBrains Mono", monospace'
    ctx.fillText(title, w / 2, 250)
    if (subtitle) {
      ctx.globalAlpha = 0.75
      ctx.font = '20px "JetBrains Mono", monospace'
      ctx.fillText(subtitle, w / 2, 290)
      ctx.globalAlpha = 1
    }
  })
}

export function shadowBlobTexture() {
  return canvas(128, 128, (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    grad.addColorStop(0, 'rgba(0,0,0,0.9)')
    grad.addColorStop(0.6, 'rgba(0,0,0,0.5)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  })
}

export function glowSpriteTexture(hex) {
  return canvas(128, 128, (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    grad.addColorStop(0, hex)
    grad.addColorStop(0.18, hex)
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  })
}

export function makeGlowSprite(hex, size) {
  const material = new THREE.SpriteMaterial({
    map: glowSpriteTexture(hex),
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(size, size, 1)
  return sprite
}
