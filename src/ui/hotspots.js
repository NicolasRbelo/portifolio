import * as THREE from 'three'

const TAGS = {
  projetos: 'Projetos',
  experiencia: 'Experiência',
  sobre: 'Sobre mim',
  contato: 'Contato',
}

export class HotspotLabels {
  constructor(layer, hotspots, onActivate) {
    this.layer = layer
    this.hotspots = hotspots
    this.onActivate = onActivate
    this.elements = {}
    this.projected = new THREE.Vector3()

    Object.entries(hotspots).forEach(([key, position]) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'hotspot-label'
      el.innerHTML = `<span class="pin"></span><span class="tag">${TAGS[key]}</span>`
      el.setAttribute('aria-label', `Abrir ${TAGS[key]}`)
      el.addEventListener('click', () => this.onActivate(key))
      layer.appendChild(el)
      this.elements[key] = { el, position }
    })
  }

  update(camera, width, height) {
    Object.values(this.elements).forEach((entry) => {
      const { el, position } = entry
      this.projected.copy(position).project(camera)
      const visible = this.projected.z < 1
      if (!visible) {
        el.classList.remove('is-visible')
        return
      }
      // on narrow (portrait) screens some objects fall outside the frame; the
      // label stays reachable, pinned to the edge with an arrow toward its object
      entry.halfWidth = entry.halfWidth || el.offsetWidth / 2
      const edge = (entry.halfWidth || 60) + 10
      const rawX = (this.projected.x * 0.5 + 0.5) * width
      const x = THREE.MathUtils.clamp(rawX, edge, width - edge)
      const y = THREE.MathUtils.clamp((-this.projected.y * 0.5 + 0.5) * height, 70, height - 24)
      el.dataset.side = rawX < edge ? 'left' : rawX > width - edge ? 'right' : ''
      el.style.left = `${x}px`
      el.style.top = `${y - 16}px`
      el.classList.add('is-visible')
    })
  }
}
