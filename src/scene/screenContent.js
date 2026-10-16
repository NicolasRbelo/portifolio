import * as THREE from 'three'

/** Canvas-driven "live" magical surfaces: a swirling crystal orb, a scrying mirror,
 * a glowing grimoire page — instead of a flat emissive color. MeshBasicMaterial +
 * toneMapped:false keeps these legible regardless of room exposure. */

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d') }
}

function makeMaterial(canvas) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return { texture, material: new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }) }
}

const RUNES = ['ᚠ', 'ᚱ', 'ᛁ', 'ᛇ', 'ᛒ', 'ᛚ', 'ᛦ', '᛫']

export function createOrbVision(width = 260, height = 260) {
  const { canvas, ctx } = makeCanvas(width, height)
  const { texture, material } = makeMaterial(canvas)
  const cx = width / 2
  const cy = height / 2
  const r = width / 2 - 4
  let phase = 0

  function draw(active) {
    ctx.clearRect(0, 0, width, height)
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.clip()

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    grad.addColorStop(0, active ? '#2a1a4a' : '#160c2a')
    grad.addColorStop(1, '#05030a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    for (let i = 0; i < 4; i += 1) {
      const a = phase * 0.02 + (i / 4) * Math.PI * 2
      const mx = cx + Math.cos(a) * r * 0.5
      const my = cy + Math.sin(a * 1.3) * r * 0.5
      const mg = ctx.createRadialGradient(mx, my, 0, mx, my, r * 0.45)
      const alpha = active ? 0.5 : 0.28
      mg.addColorStop(0, `rgba(154,123,255,${alpha})`)
      mg.addColorStop(1, 'rgba(154,123,255,0)')
      ctx.fillStyle = mg
      ctx.fillRect(0, 0, width, height)
    }

    ctx.fillStyle = active ? 'rgba(216,173,90,0.9)' : 'rgba(216,173,90,0.5)'
    ctx.font = '400 16px "Share Tech Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let i = 0; i < 6; i += 1) {
      const a = phase * 0.015 + (i / 6) * Math.PI * 2
      const rx = cx + Math.cos(a) * r * 0.72
      const ry = cy + Math.sin(a) * r * 0.72
      ctx.fillText(RUNES[(i + Math.floor(phase / 40)) % RUNES.length], rx, ry)
    }

    ctx.restore()
    ctx.strokeStyle = active ? '#d8ad5a' : '#8a6a2a'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2)
    ctx.stroke()
    texture.needsUpdate = true
  }

  function tick(active) {
    phase += 1
    draw(active)
  }

  draw(false)
  return { texture, material, tick }
}

export function createMirrorVision(width = 220, height = 320) {
  const { canvas, ctx } = makeCanvas(width, height)
  const { texture, material } = makeMaterial(canvas)
  let phase = 0

  function draw(active) {
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, active ? '#1c2a3a' : '#0e1620')
    grad.addColorStop(1, active ? '#0a1420' : '#050a12')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    for (let i = 0; i < 3; i += 1) {
      const t = (phase * 0.01 + i / 3) % 1
      const y = height * t
      const mg = ctx.createRadialGradient(width / 2, y, 0, width / 2, y, width * 0.6)
      mg.addColorStop(0, active ? 'rgba(150,200,255,0.35)' : 'rgba(150,200,255,0.18)')
      mg.addColorStop(1, 'rgba(150,200,255,0)')
      ctx.fillStyle = mg
      ctx.fillRect(0, 0, width, height)
    }

    ctx.fillStyle = active ? 'rgba(220,235,255,0.95)' : 'rgba(180,200,220,0.6)'
    ctx.font = '400 22px "MedievalSharp", cursive'
    ctx.textAlign = 'center'
    if (active) {
      ctx.fillText('VISÃO', width / 2, height * 0.38)
      ctx.font = '400 14px "Share Tech Mono", monospace'
      ctx.fillText('> buscando no éter...', width / 2, height * 0.46)
    } else {
      ctx.font = '400 14px "Share Tech Mono", monospace'
      ctx.fillText('toque para revelar', width / 2, height * 0.9)
    }
    texture.needsUpdate = true
  }

  function tick(active) {
    phase += 1
    draw(active)
  }

  draw(false)
  return { texture, material, tick }
}

export function createGrimoireVision(width = 320, height = 220) {
  const { canvas, ctx } = makeCanvas(width, height)
  const { texture, material } = makeMaterial(canvas)
  let phase = 0

  function draw(active) {
    ctx.fillStyle = '#ead9b0'
    ctx.fillRect(0, 0, width, height)
    ctx.strokeStyle = '#8a6a2a'
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, width - 20, height - 20)

    ctx.fillStyle = '#2a1a3a'
    ctx.font = '400 20px "MedievalSharp", cursive'
    ctx.textAlign = 'center'
    ctx.fillText('CONTATO', width / 2, 36)

    ctx.font = '400 13px "Share Tech Mono", monospace'
    ctx.fillStyle = active ? '#4a2a8a' : '#6a5a3a'
    ctx.textAlign = 'left'
    const lines = ['Pergaminho pronto', 'para mensagem', active ? '> selo rompido' : '> selo intacto']
    lines.forEach((l, i) => ctx.fillText(l, 22, 70 + i * 20))

    for (let i = 0; i < 5; i += 1) {
      const lit = active && i <= (phase / 8) % 5
      ctx.fillStyle = lit ? '#9a7bff' : 'rgba(138,106,42,0.35)'
      ctx.fillRect(22 + i * 26, height - 40, 18, 18)
    }
    texture.needsUpdate = true
  }

  function tick(active) {
    phase += 1
    draw(active)
  }

  draw(false)
  return { texture, material, tick }
}
