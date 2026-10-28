import { profile, contact, skills, experience, projects, education, certifications, languages } from '../content/data.js'
import { contactFormHtml, mountContactForm } from './contactForm.js'

const LABELS = {
  projetos: '~/projetos',
  experiencia: 'HISTÓRICO.EXE',
  sobre: 'QUADRO DE AVISOS',
  contato: 'NOVA MENSAGEM',
}

function projectEntry(p) {
  const statusLabel = p.status === 'public' ? 'Código público' : 'Código confidencial'
  const statusClass = p.status === 'public' ? 'status-public' : 'status-confidential'
  const link = p.url
    ? `<p><a class="btn" href="${p.url}" target="_blank" rel="noopener noreferrer">Abrir projeto ↗</a></p>`
    : `<p class="${statusClass}">Projeto profissional — ${statusLabel.toLowerCase()}, sem repositório público.</p>`
  return `
    <div class="entry">
      <div class="entry-title">${p.name}</div>
      <div class="entry-meta">${p.stack}</div>
      <p>${p.description}</p>
      ${link}
    </div>
  `
}

function experienceEntry(e) {
  return `
    <div class="entry">
      <div class="entry-title">${e.role}</div>
      <div class="entry-meta">${e.org} · ${e.period}</div>
      <ul>${e.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
    </div>
  `
}

export function buildPanelContent(key) {
  if (key === 'projetos') {
    return {
      kicker: LABELS.projetos,
      title: 'Projetos',
      html: projects.map(projectEntry).join(''),
    }
  }

  if (key === 'experiencia') {
    return {
      kicker: LABELS.experiencia,
      title: 'Experiência',
      html: `
        ${experience.map(experienceEntry).join('')}
        <h3>Formação</h3>
        ${education
          .map((ed) => `<div class="entry"><div class="entry-title">${ed.degree}</div><div class="entry-meta">${ed.org} · ${ed.period}</div></div>`)
          .join('')}
        <h3>Certificações</h3>
        <div class="tag-row">${certifications.map((c) => `<span class="tag-chip">${c.name} — ${c.org} (${c.period})</span>`).join('')}</div>
      `,
    }
  }

  if (key === 'sobre') {
    return {
      kicker: LABELS.sobre,
      title: 'Sobre mim',
      html: `
        <p>${profile.summary}</p>
        <h3>Stack</h3>
        ${skills
          .map(
            (s) => `<p><strong>${s.group}:</strong> <span class="tag-row" style="display:inline-flex">${s.items
              .map((i) => `<span class="tag-chip">${i}</span>`)
              .join('')}</span></p>`,
          )
          .join('')}
        <h3>Idiomas</h3>
        <p>${languages.map((l) => `${l.name} — ${l.level}`).join(', ')}</p>
      `,
    }
  }

  if (key === 'contato') {
    return {
      kicker: LABELS.contato,
      title: 'Contato',
      // wires the message form once the panel's HTML is in the page
      mount: mountContactForm,
      html: `
        <p>Me mande uma mensagem por aqui — chega direto no meu e-mail.</p>
        ${contactFormHtml()}
        <h3>Ou fale direto</h3>
        <div class="contact-grid">
          <a class="btn" href="${contact.whatsapp.url}" target="_blank" rel="noopener noreferrer">WhatsApp — ${contact.whatsapp.label}</a>
          <a class="btn" href="mailto:${contact.email}">E-mail — ${contact.email}</a>
          <a class="btn" href="${contact.linkedin.url}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a class="btn" href="${contact.github.url}" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a class="btn" href="${contact.cv.url}" download>Baixar currículo (PDF) ↓</a>
        </div>
      `,
    }
  }

  return null
}
