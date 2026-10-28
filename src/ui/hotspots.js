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
    const pinned = { left: [], right: [] }
    Object.values(this.elements).forEach((entry) => {
      const { el, position } = entry
      this.projected.copy(position).project(camera)
      const visible = this.projected.z < 1
      if (!visible) {
        el.classList.remove('is-visible')
        return
      }
      // when an object falls outside the frame its label stays reachable,
      // pinned to the edge with an arrow toward it
      const rawX = (this.projected.x * 0.5 + 0.5) * width
      const side = rawX < 0 ? 'left' : rawX > width ? 'right' : ''
      if (el.dataset.side !== side) {
        el.dataset.side = side
        entry.halfWidth = 0 // the pinned style is smaller — re-measure
      }
      entry.halfWidth = entry.halfWidth || el.offsetWidth / 2
      const edge = (entry.halfWidth || 60) + 10
      entry.x = THREE.MathUtils.clamp(rawX, edge, width - edge)
      // stays clear of the corner chrome (title/clock above, CV link/toggle below)
      entry.y = THREE.MathUtils.clamp((-this.projected.y * 0.5 + 0.5) * height, 70, height - 90)
      if (side) pinned[side].push(entry)
      el.classList.add('is-visible')
    })
    // two labels pinned to the same edge stack instead of overlapping
    Object.values(pinned).forEach((entries) => {
      entries.sort((a, b) => a.y - b.y)
      entries.forEach((entry, i) => {
        if (i > 0) entry.y = Math.max(entry.y, entries[i - 1].y + 30)
      })
    })
    Object.values(this.elements).forEach(({ el, x, y }) => {
      if (!el.classList.contains('is-visible')) return
      el.style.left = `${x}px`
      el.style.top = `${y - 16}px`
    })
  }
}
