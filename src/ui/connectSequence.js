const CHAR_DELAY = 16

// "> label........ OK", dot-padded so every OK lines up in the same column
const step = (label) => `> ${label}`.padEnd(38, '.') + ' OK'

function buildLines(ambienceLabel) {
  return [
    { text: 'nicolas@portfolio ~ % ./entrar.sh', pause: 260 },
    { text: 'VERIFICANDO CREDENCIAIS...', pause: 420 },
    { text: step('Autenticando visitante'), pause: 240 },
    { text: step('Carregando o quarto'), pause: 240 },
    ...(ambienceLabel ? [{ text: step(ambienceLabel), pause: 240 }] : []),
    { text: step('Ligando o monitor'), pause: 240 },
    { text: step('Acordando os projetos'), pause: 240 },
    { text: step('Reconhecendo quem bateu na porta'), pause: 340 },
    { text: 'ACESSO LIBERADO', pause: 260 },
    { text: 'BEM-VINDO, A PORTA JÁ ESTÁ ABRINDO', pause: 900 },
  ]
}

/** Drives a terminal boot log purely off elapsed time via requestAnimationFrame (not
 * chained setTimeouts), so it stays correct even under heavy main-thread load or a
 * throttled timer queue. Clicking or pressing a key skips straight to the end.
 * `ambienceLabel` adds a line saying what the room is doing at this hour. */
export function runConnectSequence(logEl, onComplete, ambienceLabel) {
  // for each line, the [startMs, endMs) window during which it types out
  let cursor = 0
  const SCHEDULE = buildLines(ambienceLabel).map((line) => {
    const typeStart = cursor
    const typeEnd = typeStart + line.text.length * CHAR_DELAY
    cursor = typeEnd + line.pause
    return { text: line.text, typeStart, typeEnd }
  })
  const TOTAL_DURATION = cursor + 400

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
