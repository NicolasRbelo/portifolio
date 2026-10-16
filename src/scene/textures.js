import * as THREE from 'three'

/** All textures here are generated at runtime on a 2D canvas — no external image files,
 * consistent with the room's "geometry + procedural color" material approach. */

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

export function vaultPlaqueTexture(topLine, bottomLine) {
  return canvas(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1b2118'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#3a4a3a'
    ctx.lineWidth = 6
    ctx.strokeRect(10, 10, w - 20, h - 20)
    ctx.fillStyle = '#ffb000'
    ctx.font = '700 96px "Share Tech Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(topLine, w / 2, h * 0.42)
    ctx.fillStyle = '#6b7a63'
    ctx.font = '400 32px "Share Tech Mono", monospace'
    ctx.fillText(bottomLine, w / 2, h * 0.78)
  })
}

export function hazardStripeTexture() {
  return canvas(256, 64, (ctx, w, h) => {
    ctx.fillStyle = '#12100a'
    ctx.fillRect(0, 0, w, h)
    ctx.save()
    ctx.translate(w / 2, h / 2)
    ctx.fillStyle = '#d9a515'
    const stripeW = 26
    for (let x = -w; x < w * 2; x += stripeW * 2) {
      ctx.save()
      ctx.rotate(Math.PI / 4)
      ctx.fillRect(x, -h * 2, stripeW, h * 4)
      ctx.restore()
    }
    ctx.restore()
  })
}

export function radiationPosterTexture() {
  return canvas(256, 320, (ctx, w, h) => {
    ctx.fillStyle = '#1a1407'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#8c5f00'
    ctx.lineWidth = 5
    ctx.strokeRect(8, 8, w - 16, h - 16)
    ctx.fillStyle = '#ffb000'
    ctx.beginPath()
    const cx = w / 2
    const cy = h * 0.42
    const r = 46
    ctx.arc(cx, cy, 14, 0, Math.PI * 2)
    ctx.fill()
    for (let i = 0; i < 3; i += 1) {
      const a0 = (i / 3) * Math.PI * 2 - Math.PI / 2
      const a1 = a0 + (Math.PI * 2) / 3 - 0.18
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, a0 + 0.09, a1)
      ctx.closePath()
      ctx.fill()
    }
    ctx.fillStyle = '#d9a515'
    ctx.font = '700 22px "Share Tech Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('CUIDADO', w / 2, h * 0.72)
    ctx.font = '400 13px "Share Tech Mono", monospace'
    ctx.fillStyle = '#8c5f00'
    ctx.fillText('RISCO DE RADIAÇÃO', w / 2, h * 0.8)
  })
}

export function rugTexture() {
  return canvas(256, 384, (ctx, w, h) => {
    ctx.fillStyle = '#4a1816'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#2c0f0e'
    ctx.lineWidth = 10
    ctx.strokeRect(14, 14, w - 28, h - 28)
    ctx.strokeStyle = '#7a3a2a'
    ctx.lineWidth = 3
    ctx.strokeRect(30, 30, w - 60, h - 60)
    ctx.fillStyle = '#7a3a2a'
    const cx = w / 2
    const cy = h / 2
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(cx + Math.cos(a) * 46, cy + Math.sin(a) * 70, 16, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#c99a4a'
    ctx.beginPath()
    ctx.arc(cx, cy, 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 0.18
    for (let y = 0; y < h; y += 4) {
      ctx.fillStyle = y % 8 === 0 ? '#000000' : '#ffffff'
      ctx.fillRect(0, y, w, 1)
    }
    ctx.globalAlpha = 1
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
