import { contact } from '../content/data.js'

const ENDPOINT = 'https://api.web3forms.com/submit'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The "new message" form inside the Contato panel, styled like a chat on the
 * phone that opened it. */
export function contactFormHtml() {
  return `
    <form class="message-form" novalidate>
      <div class="field">
        <label for="msg-name">Seu nome</label>
        <input id="msg-name" name="name" type="text" autocomplete="name" maxlength="80" required />
      </div>
      <div class="field">
        <label for="msg-email">Seu e-mail</label>
        <input id="msg-email" name="email" type="email" autocomplete="email" maxlength="120" required />
      </div>
      <div class="field">
        <label for="msg-message">Mensagem</label>
        <textarea id="msg-message" name="message" rows="4" maxlength="2000" required></textarea>
      </div>
      <input class="hp-field" type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" aria-hidden="true" />
      <div class="form-actions">
        <button class="btn" type="submit">Enviar mensagem →</button>
        <p class="form-status" role="status" aria-live="polite"></p>
      </div>
    </form>
  `
}

function setStatus(el, text, state = '') {
  el.textContent = text
  el.dataset.state = state
}

/** Sends through Web3Forms straight to Nicolas's inbox. Without an access key
 * configured it opens the visitor's e-mail app with everything pre-filled. */
export function mountContactForm(root) {
  const form = root.querySelector('.message-form')
  if (!form) return
  const status = form.querySelector('.form-status')
  const submit = form.querySelector('button[type="submit"]')

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const name = form.elements.name.value.trim()
    const email = form.elements.email.value.trim()
    const message = form.elements.message.value.trim()

    const checks = [
      [form.elements.name, name.length > 0],
      [form.elements.email, EMAIL_PATTERN.test(email)],
      [form.elements.message, message.length > 0],
    ]
    checks.forEach(([field, ok]) => field.setAttribute('aria-invalid', String(!ok)))
    const firstBad = checks.find(([, ok]) => !ok)
    if (firstBad) {
      setStatus(status, 'Preencha seu nome, um e-mail válido e a mensagem.', 'error')
      firstBad[0].focus()
      return
    }

    // the hidden checkbox only gets ticked by bots: pretend it worked
    if (form.elements.botcheck.checked) {
      form.reset()
      setStatus(status, 'Mensagem enviada!', 'ok')
      return
    }

    const subject = `Portfólio — mensagem de ${name}`
    if (!contact.formAccessKey) {
      const body = `${message}\n\n— ${name} (${email})`
      window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      setStatus(status, 'Abrindo seu app de e-mail com a mensagem pronta…', 'ok')
      return
    }

    submit.disabled = true
    setStatus(status, 'Enviando…')
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: contact.formAccessKey,
          subject,
          from_name: 'nicolas.dev — portfólio',
          name,
          email,
          message,
        }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.success) throw new Error(result.message || `HTTP ${response.status}`)
      form.reset()
      setStatus(status, 'Mensagem enviada! Respondo em breve.', 'ok')
    } catch {
      setStatus(status, `Não deu pra enviar agora. Tente de novo ou escreva para ${contact.email}.`, 'error')
    } finally {
      submit.disabled = false
    }
  })

  // clear a field's error mark as soon as it's edited
  form.addEventListener('input', (event) => event.target.removeAttribute('aria-invalid'))
}
