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

/** The view out the window: a real city skyline at night, lit windows, no
 * fantasy skyline — this is an apartment a few floors up, nothing more. */
export function cityNightTexture() {
  return canvas(320, 384, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#0a0c1a')
    sky.addColorStop(0.6, '#141a2e')
    sky.addColorStop(1, '#1c2436')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, h)

    for (let i = 0; i < 60; i += 1) {
      const x = Math.random() * w
      const y = Math.random() * h * 0.45
      ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.5})`
      ctx.fillRect(x, y, 1, 1)
    }

    // a skyline of lit office/apartment towers, each with a scatter of lit windows
    let x = 0
    while (x < w) {
      const bw = 24 + Math.random() * 30
      const bh = 90 + Math.random() * 190
      const by = h - bh
      ctx.fillStyle = `rgb(${14 + Math.random() * 8},${16 + Math.random() * 8},${26 + Math.random() * 10})`
      ctx.fillRect(x, by, bw, bh)
      const cols = Math.max(2, Math.floor(bw / 7))
      const rows = Math.max(3, Math.floor(bh / 10))
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          if (Math.random() < 0.35) {
            ctx.fillStyle = Math.random() < 0.7 ? 'rgba(255,214,140,0.85)' : 'rgba(140,200,255,0.7)'
            ctx.fillRect(x + 3 + c * 7, by + 6 + r * 10, 3, 4)
          }
        }
      }
      x += bw + 2
    }

    // a faint red aircraft-warning blink on the tallest tower would be too busy;
    // keep it to one steady amber beacon instead
    ctx.fillStyle = 'rgba(255,170,90,0.9)'
    ctx.beginPath()
    ctx.arc(w * 0.78, h * 0.28, 2.2, 0, Math.PI * 2)
    ctx.fill()
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
