import * as THREE from 'three'

/** Canvas-driven "live" screens: scrolling code on the monitor, a retro loading
 * screen on the TV, a chat mockup on the phone — real pixels instead of a flat
 * emissive color. MeshBasicMaterial + toneMapped:false keeps these legible
 * regardless of room exposure. */

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
  "# TODO: refatorar service",
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
    ctx.fillStyle = active ? '#0c1f24' : '#081216'
    ctx.fillRect(0, 0, width, height)
    ctx.font = '700 13px "JetBrains Mono", monospace'
    ctx.textBaseline = 'top'
    lines.forEach((line, i) => {
      const fade = 0.55 + (i / lines.length) * 0.45
      ctx.fillStyle = active ? `rgba(160,235,255,${fade})` : `rgba(74,217,255,${fade * 0.85})`
      ctx.fillText(line, 8, 6 + i * lineHeight)
    })
    if (active) {
      ctx.fillStyle = 'rgba(160,235,255,0.9)'
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
    ctx.fillStyle = active ? '#1a0a1e' : '#120814'
    ctx.fillRect(0, 0, width, height)
    ctx.strokeStyle = '#ff3ec9'
    ctx.lineWidth = 6
    ctx.strokeRect(10, 10, width - 20, height - 20)

    ctx.fillStyle = '#ff3ec9'
    ctx.font = '700 22px "JetBrains Mono", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('HISTÓRICO.EXE', width / 2, 56)
    ctx.font = '700 15px "JetBrains Mono", monospace'
    ctx.fillStyle = '#ff8fe0'
    ctx.fillText('NÍVEL: FULL STACK', width / 2, 82)

    // a little XP bar, genre-flavored "progress" readout
    const barW = width - 60
    ctx.strokeStyle = '#ff8fe0'
    ctx.lineWidth = 2
    ctx.strokeRect(30, 108, barW, 14)
    ctx.fillStyle = '#4ad9ff'
    ctx.fillRect(32, 110, barW * 0.72, 10)

    const blocks = [0xff3ec9, 0x4ad9ff, 0xffb347, 0x4ade80, 0xff3ec9]
    const bw = 18
    const startX = width / 2 - (blocks.length * bw) / 2
    blocks.forEach((c, i) => {
      ctx.fillStyle = `#${c.toString(16).padStart(6, '0')}`
      ctx.fillRect(startX + i * bw, 138, bw - 4, bw - 4)
    })

    if (Math.floor(phase / 20) % 2 === 0 || active) {
      ctx.fillStyle = active ? '#bfeeff' : '#4ad9ff'
      ctx.font = '600 15px "JetBrains Mono", monospace'
      ctx.fillText(active ? '> CARREGANDO...' : 'PRESSIONE START', width / 2, 182)
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

export function createPhoneScreen(width = 200, height = 340) {
  const { canvas, ctx } = makeCanvas(width, height)
  const { texture, material } = makeMaterial(canvas)
  let phase = 0

  function draw(active) {
    ctx.fillStyle = active ? '#0a1f14' : '#06120c'
    ctx.fillRect(0, 0, width, height)

    // status bar
    ctx.fillStyle = active ? '#9df5c0' : '#4ade80'
    ctx.font = '600 11px "JetBrains Mono", monospace'
    ctx.textAlign = 'left'
    ctx.fillText('09:41', 10, 16)
    ctx.textAlign = 'right'
    ctx.fillText('100%', width - 10, 16)
    ctx.textAlign = 'left'

    ctx.strokeStyle = active ? '#9df5c0' : '#4ade80'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, 30)
    ctx.lineTo(width, 30)
    ctx.stroke()

    ctx.font = '700 14px "JetBrains Mono", monospace'
    ctx.fillText('Mensagens', 12, 48)

    const bubbles = [
      { text: 'oi! vi seu projeto', mine: false },
      { text: 'disponível pra bater um papo?', mine: false },
      { text: active ? '> digitando...' : 'claro, me chama!', mine: true },
    ]
    let y = 74
    bubbles.forEach((b) => {
      const bw = width - 50
      const bx = b.mine ? 40 : 10
      ctx.fillStyle = b.mine ? 'rgba(74,222,128,0.85)' : 'rgba(255,255,255,0.1)'
      ctx.fillRect(bx, y, bw, 26)
      ctx.fillStyle = b.mine ? '#06120c' : '#9df5c0'
      ctx.font = '500 11px "JetBrains Mono", monospace'
      ctx.fillText(b.text, bx + 8, y + 16)
      y += 34
    })

    if (Math.floor(phase / 15) % 2 === 0 || active) {
      ctx.fillStyle = active ? '#9df5c0' : '#4ade80'
      ctx.beginPath()
      ctx.arc(width / 2, height - 24, 4, 0, Math.PI * 2)
      ctx.fill()
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
