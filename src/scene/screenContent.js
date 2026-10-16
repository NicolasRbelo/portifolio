import * as THREE from 'three'

/** Canvas-driven "live" screen content: real pixels (scrolling code, a tiny game
 * title screen, a HUD readout) instead of a flat emissive color. MeshBasicMaterial
 * + toneMapped:false keeps these legible regardless of room exposure. */

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d') }
}

function makeMaterial(canvas) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  return { texture, material: new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }) }
}

const CODE_LINES = [
  "$ cd ~/erp && npm run dev",
  "VITE ready in 312 ms",
  "> http://localhost:5173",
  "def handle_pedido(req):",
  "    return jsonify(ok=True)",
  "SELECT * FROM estoque",
  "  WHERE qtd < 10;",
  "git commit -m 'fix: auth'",
  "pytest -v tests/ ......",
  "12 passed in 2.31s",
  "docker compose up -d",
  "class ERP(db.Model):",
  "  id = Column(Integer)",
  "async def get_clientes():",
  "useEffect(() => {",
  "  fetchDados()",
  "}, [])",
  "# TODO: refactor service",
  "CREATE INDEX idx_user",
  "deploy -> hostinger OK",
]

export function createCodeScreen(width = 300, height = 220) {
  const { canvas, ctx } = makeCanvas(width, height)
  const { texture, material } = makeMaterial(canvas)
  const lineHeight = 15
  const maxLines = Math.floor(height / lineHeight)
  let lines = Array.from({ length: maxLines }, () => CODE_LINES[Math.floor(Math.random() * CODE_LINES.length)])

  function draw(active) {
    ctx.fillStyle = active ? '#07220f' : '#04140a'
    ctx.fillRect(0, 0, width, height)
    ctx.font = '700 13px "Share Tech Mono", monospace'
    ctx.textBaseline = 'top'
    lines.forEach((line, i) => {
      const fade = 0.55 + (i / lines.length) * 0.45
      ctx.fillStyle = active ? `rgba(180,255,190,${fade})` : `rgba(80,255,40,${fade})`
      ctx.fillText(line, 8, 6 + i * lineHeight)
    })
    if (active) {
      ctx.fillStyle = 'rgba(157,255,176,0.9)'
      ctx.fillRect(6, height - lineHeight + 4, 8, 11)
    }
    texture.needsUpdate = true
  }

  function tick(active) {
    if (Math.random() < 0.5) {
      lines.shift()
      lines.push(CODE_LINES[Math.floor(Math.random() * CODE_LINES.length)])
    }
    draw(active)
  }

  draw(false)
  return { texture, material, tick }
}

export function createGameScreen(width = 300, height = 220) {
  const { canvas, ctx } = makeCanvas(width, height)
  const { texture, material } = makeMaterial(canvas)
  let phase = 0

  function draw(active) {
    ctx.fillStyle = active ? '#2a1400' : '#1a0d00'
    ctx.fillRect(0, 0, width, height)
    ctx.strokeStyle = '#ffb000'
    ctx.lineWidth = 6
    ctx.strokeRect(10, 10, width - 20, height - 20)

    ctx.fillStyle = '#ffb000'
    ctx.font = '700 26px "Share Tech Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('VAULT', width / 2, 70)
    ctx.fillText('QUEST', width / 2, 100)

    // little pixel sprite row, genre-flavored "game" furniture
    const blocks = [0xffb000, 0x39ff14, 0xff3b30, 0x39ff14, 0xffb000]
    const bw = 18
    const startX = width / 2 - (blocks.length * bw) / 2
    blocks.forEach((c, i) => {
      ctx.fillStyle = `#${c.toString(16).padStart(6, '0')}`
      ctx.fillRect(startX + i * bw, 128, bw - 4, bw - 4)
    })

    if (Math.floor(phase / 20) % 2 === 0 || active) {
      ctx.fillStyle = active ? '#ffe9b0' : '#ffb000'
      ctx.font = '600 16px "Share Tech Mono", monospace'
      ctx.fillText(active ? '> ACESSANDO...' : 'PRESS START', width / 2, 175)
    }
    ctx.textAlign = 'left'
    texture.needsUpdate = true
  }

  function tick(active) {
    phase += 1
    draw(active)
  }

  draw(false)
  return { texture, material, tick }
}

export function createHudScreen(width = 200, height = 200) {
  const { canvas, ctx } = makeCanvas(width, height)
  const { texture, material } = makeMaterial(canvas)
  let phase = 0

  function draw(active) {
    ctx.fillStyle = active ? '#07220f' : '#04140a'
    ctx.fillRect(0, 0, width, height)
    ctx.strokeStyle = active ? '#9dffb0' : '#39ff14'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(width / 2, height / 2, width / 2 - 14, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = active ? '#9dffb0' : '#39ff14'
    ctx.font = '700 15px "Share Tech Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('STATUS', width / 2, height / 2 - 28)
    ctx.font = '600 11px "Share Tech Mono", monospace'
    ctx.fillText(active ? 'CONECTADO' : 'ONLINE', width / 2, height / 2 - 10)

    const barY = height / 2 + 14
    for (let i = 0; i < 6; i += 1) {
      const lit = i <= (phase / 10) % 6
      ctx.fillStyle = lit ? (active ? '#ffe9b0' : '#ffb000') : 'rgba(255,176,0,0.2)'
      ctx.fillRect(width / 2 - 30 + i * 11, barY, 8, 10)
    }
    ctx.textAlign = 'left'
    texture.needsUpdate = true
  }

  function tick(active) {
    phase += 1
    draw(active)
  }

  draw(false)
  return { texture, material, tick }
}
