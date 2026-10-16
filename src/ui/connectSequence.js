const LINES = [
  { text: 'VAULT-TEC TERMLINK PROTOCOL v2.3', pause: 260 },
  { text: 'INICIALIZANDO INTERFACE DE OVERSEER...', pause: 420 },
  { text: '> Verificando integridade do sistema...... OK', pause: 240 },
  { text: '> Montando unidade de armazenamento........ OK', pause: 240 },
  { text: '> Carregando perfil do usuário.............. OK', pause: 240 },
  { text: '> Estabelecendo conexão segura.............. OK', pause: 240 },
  { text: '> Autenticando credenciais.................. OK', pause: 340 },
  { text: 'ACESSO CONCEDIDO', pause: 260 },
  { text: 'BEM-VINDO, NICOLAS.DEV', pause: 900 },
]

const CHAR_DELAY = 16

// precompute, for each line, the [startMs, endMs) window during which it types out
let cursor = 0
const SCHEDULE = LINES.map((line) => {
  const typeStart = cursor
  const typeEnd = typeStart + line.text.length * CHAR_DELAY
  cursor = typeEnd + line.pause
  return { text: line.text, typeStart, typeEnd }
})
const TOTAL_DURATION = cursor + 400

/** Drives a terminal boot log purely off elapsed time via requestAnimationFrame (not
 * chained setTimeouts), so it stays correct even under heavy main-thread load or a
 * throttled timer queue. Clicking or pressing a key skips straight to the end. */
export function runConnectSequence(logEl, onComplete) {
  let finished = false
  let skip = false
  const paragraphs = SCHEDULE.map(() => {
    const p = document.createElement('p')
    logEl.appendChild(p)
    return p
  })

  function requestSkip(event) {
    if (event && event.preventDefault) event.preventDefault()
    skip = true
  }
  window.addEventListener('keydown', requestSkip)
  window.addEventListener('pointerdown', requestSkip)

  function finish() {
    if (finished) return
    finished = true
    window.removeEventListener('keydown', requestSkip)
    window.removeEventListener('pointerdown', requestSkip)
    onComplete()
  }

  const start = performance.now()

  function tick() {
    if (finished) return
    const elapsed = skip ? TOTAL_DURATION : performance.now() - start

    SCHEDULE.forEach((line, i) => {
      if (elapsed <= line.typeStart) return
      const span = Math.max(1, line.typeEnd - line.typeStart)
      const t = Math.min(1, (elapsed - line.typeStart) / span)
      const count = Math.round(t * line.text.length)
      paragraphs[i].textContent = line.text.slice(0, count)
    })

    if (elapsed >= TOTAL_DURATION) {
      finish()
      return
    }
    requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}
