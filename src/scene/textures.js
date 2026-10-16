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

export function arcaneSealTexture(topLine, bottomLine) {
  return canvas(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#241c30'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#8a6a2a'
    ctx.lineWidth = 6
    ctx.strokeRect(10, 10, w - 20, h - 20)
    ctx.strokeStyle = '#9a7bff'
    ctx.lineWidth = 2
    ctx.strokeRect(20, 20, w - 40, h - 40)
    ctx.fillStyle = '#d8ad5a'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const maxWidth = w - 60
    let topSize = 78
    ctx.font = `400 ${topSize}px "MedievalSharp", cursive`
    while (ctx.measureText(topLine).width > maxWidth && topSize > 20) {
      topSize -= 2
      ctx.font = `400 ${topSize}px "MedievalSharp", cursive`
    }
    ctx.fillText(topLine, w / 2, h * 0.4)
    ctx.fillStyle = '#b8a8d8'
    let bottomSize = 28
    ctx.font = `400 ${bottomSize}px "Share Tech Mono", monospace`
    while (ctx.measureText(bottomLine).width > maxWidth && bottomSize > 12) {
      bottomSize -= 2
      ctx.font = `400 ${bottomSize}px "Share Tech Mono", monospace`
    }
    ctx.fillText(bottomLine, w / 2, h * 0.76)
  })
}

export function runeBorderTexture() {
  return canvas(256, 64, (ctx, w, h) => {
    ctx.fillStyle = '#1a1420'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#4a3a8a'
    ctx.lineWidth = 2
    ctx.strokeRect(4, 4, w - 8, h - 8)
    const glyphs = ['ᚠ', 'ᚱ', 'ᛇ', 'ᛒ', 'ᛚ', 'ᛦ']
    ctx.fillStyle = '#c3a8ff'
    ctx.font = '400 30px "Share Tech Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let x = 22; x < w; x += 44) {
      ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], x, h / 2)
    }
  })
}

export function starMapTexture() {
  return canvas(256, 320, (ctx, w, h) => {
    ctx.fillStyle = '#e8d9a8'
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = 0.12
    for (let i = 0; i < 400; i += 1) {
      ctx.fillStyle = Math.random() > 0.5 ? '#8a6a2a' : '#3a2a1c'
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
    }
    ctx.globalAlpha = 1
    ctx.strokeStyle = '#4a3420'
    ctx.lineWidth = 6
    ctx.strokeRect(8, 8, w - 16, h - 16)

    // a rough coastline silhouette for "Arton", with a few marked provinces
    ctx.strokeStyle = '#5a3a20'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(40, 60)
    ctx.bezierCurveTo(30, 120, 70, 160, 60, 210)
    ctx.bezierCurveTo(90, 240, 150, 230, 180, 180)
    ctx.bezierCurveTo(220, 150, 210, 90, 170, 70)
    ctx.bezierCurveTo(130, 40, 70, 40, 40, 60)
    ctx.stroke()

    ctx.fillStyle = '#8a2a2a'
    ;[[80, 100], [130, 150], [110, 190]].forEach(([x, y]) => {
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    })

    // compass rose
    const cx = w / 2
    const cy = h * 0.82
    ctx.strokeStyle = '#8a6a2a'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(cx, cy, 24, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx, cy - 24)
    ctx.lineTo(cx, cy + 24)
    ctx.moveTo(cx - 24, cy)
    ctx.lineTo(cx + 24, cy)
    ctx.stroke()

    ctx.fillStyle = '#4a3420'
    ctx.font = '400 20px "MedievalSharp", cursive'
    ctx.textAlign = 'center'
    ctx.fillText('ARTON', w / 2, h * 0.08)
  })
}

export function rugTexture() {
  return canvas(256, 384, (ctx, w, h) => {
    ctx.fillStyle = '#4a1430'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = '#2c0d1e'
    ctx.lineWidth = 10
    ctx.strokeRect(14, 14, w - 28, h - 28)
    ctx.strokeStyle = '#8a6a2a'
    ctx.lineWidth = 3
    ctx.strokeRect(30, 30, w - 60, h - 60)
    ctx.fillStyle = '#8a6a2a'
    const cx = w / 2
    const cy = h / 2
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(cx + Math.cos(a) * 46, cy + Math.sin(a) * 70, 16, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#d8ad5a'
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

export function stoneWallTexture(repeatX = 4, repeatY = 2) {
  const texture = canvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#2a2420'
    ctx.fillRect(0, 0, w, h)
    const rows = 4
    const rowH = h / rows
    for (let r = 0; r < rows; r += 1) {
      const offset = r % 2 === 0 ? 0 : w / 5
      const blockW = w / 2.4
      for (let x = -blockW; x < w + blockW; x += blockW) {
        ctx.fillStyle = `rgb(${54 + Math.random() * 14},${48 + Math.random() * 12},${42 + Math.random() * 10})`
        ctx.fillRect(x + offset + 2, r * rowH + 2, blockW - 4, rowH - 4)
      }
    }
    ctx.strokeStyle = '#161210'
    ctx.lineWidth = 4
    for (let r = 0; r <= rows; r += 1) ctx.strokeRect(0, r * rowH, w, 0)
    ctx.globalAlpha = 0.5
    ctx.strokeStyle = '#161210'
    for (let r = 0; r < rows; r += 1) {
      const offset = r % 2 === 0 ? 0 : w / 5
      const blockW = w / 2.4
      for (let x = -blockW; x < w + blockW; x += blockW) {
        ctx.strokeRect(x + offset, r * rowH, blockW, rowH)
      }
    }
    ctx.globalAlpha = 1
  })
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeatX, repeatY)
  return texture
}

export function woodFloorTexture(repeatX = 3, repeatY = 3) {
  const texture = canvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#3c2a1a'
    ctx.fillRect(0, 0, w, h)
    const plankH = h / 6
    for (let r = 0; r < 6; r += 1) {
      ctx.fillStyle = `rgb(${58 + Math.random() * 14},${40 + Math.random() * 10},${24 + Math.random() * 8})`
      ctx.fillRect(0, r * plankH, w, plankH - 2)
      ctx.strokeStyle = '#201509'
      ctx.lineWidth = 2
      ctx.strokeRect(0, r * plankH, w, plankH)
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'
      for (let i = 0; i < 4; i += 1) {
        const y = r * plankH + 4 + Math.random() * (plankH - 8)
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.bezierCurveTo(w * 0.3, y + 4, w * 0.6, y - 4, w, y)
        ctx.stroke()
      }
    }
  })
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeatX, repeatY)
  return texture
}

export function nightSkyTexture() {
  return canvas(320, 384, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#0a0a2a')
    sky.addColorStop(0.55, '#241a3a')
    sky.addColorStop(1, '#4a2a3a')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)

    for (let i = 0; i < 140; i += 1) {
      const x = Math.random() * w
      const y = Math.random() * h * 0.7
      const r = Math.random() * 1.4
      ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.6})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    const moonX = w * 0.72
    const moonY = h * 0.22
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 60)
    moonGlow.addColorStop(0, 'rgba(216,217,180,0.35)')
    moonGlow.addColorStop(1, 'rgba(216,217,180,0)')
    ctx.fillStyle = moonGlow
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#e8e9c8'
    ctx.beginPath()
    ctx.arc(moonX, moonY, 22, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = sky
    ctx.beginPath()
    ctx.arc(moonX + 9, moonY - 5, 20, 0, Math.PI * 2)
    ctx.fill()

    // distant rooftops of the city below, a faint skyline silhouette
    ctx.fillStyle = '#140a1c'
    ctx.beginPath()
    ctx.moveTo(0, h)
    let x = 0
    while (x < w) {
      const bw = 18 + Math.random() * 26
      const bh = 20 + Math.random() * 55
      ctx.lineTo(x, h * 0.74 - bh * 0.35)
      ctx.lineTo(x + bw, h * 0.74 - bh * 0.35)
      x += bw
    }
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fill()
  })
}

export function lightShaftTexture() {
  return canvas(64, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, 'rgba(180,190,255,0.55)')
    grad.addColorStop(0.6, 'rgba(180,190,255,0.14)')
    grad.addColorStop(1, 'rgba(180,190,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    const mask = ctx.createLinearGradient(0, 0, w, 0)
    mask.addColorStop(0, 'rgba(0,0,0,1)')
    mask.addColorStop(0.5, 'rgba(0,0,0,0)')
    mask.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = mask
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  })
}

export function dustTexture() {
  return canvas(32, 32, (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    grad.addColorStop(0, 'rgba(255,245,220,0.9)')
    grad.addColorStop(1, 'rgba(255,245,220,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
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
