import * as THREE from 'three'
import './style.css'
import {
  createRenderer,
  createCamera,
  createLights,
  fovForAspect,
  CAMERA_WIDE,
  CAMERA_CLOSE_MAP,
  CLOSE_FOV,
  ZOOM_FOV,
} from './scene/setup.js'
import { buildRoom } from './scene/room.js'
import { CRTComposer } from './shaders/crtComposer.js'
import { HotspotLabels } from './ui/hotspots.js'
import { buildPanelContent } from './ui/panels.js'
import { runConnectSequence } from './ui/connectSequence.js'
import { contact } from './content/data.js'

document.getElementById('cv-corner-link').href = contact.cv.url

const stage = document.getElementById('stage')
const canvas = document.getElementById('scene-canvas')
const hotspotLayer = document.getElementById('hotspot-layer')
const bootEl = document.getElementById('boot')
const bootLog = document.getElementById('boot-log')
const panelRoot = document.getElementById('panel-root')
const panelTitle = document.getElementById('panel-title')
const panelKicker = document.getElementById('panel-kicker')
const panelBody = document.getElementById('panel-body')

const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0x05070a, 0.055)

const renderer = createRenderer(canvas)
const camera = createCamera(stage.clientWidth / stage.clientHeight)
createLights(scene)

const { group: roomGroup, hotspots, hitboxes, glowSprites, screenContent } = buildRoom()
scene.add(roomGroup)

function size() {
  return { w: stage.clientWidth, h: stage.clientHeight }
}

const { w: initW, h: initH } = size()
renderer.setSize(initW, initH)
const composer = new CRTComposer(renderer, initW, initH)

// camStage: 'log' (boot) -> 'intro' (dolly out) -> 'idle' (wide, free) ->
// 'zoom-in' -> 'zoomed' (panel open) -> 'zoom-out' -> back to 'idle'
let camStage = 'log'

function handleResize() {
  const { w, h } = size()
  camera.aspect = w / h
  camera.userData.wideFov = fovForAspect(camera.aspect)
  if (camStage === 'idle') camera.fov = camera.userData.wideFov
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
  composer.setSize(w, h)
}

window.addEventListener('resize', handleResize)
handleResize()

// ---------- interaction state ----------

let interactive = false
let activeHotspot = null
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2(-10, -10)
let hovered = null

function setScreenActive(key, active) {
  const content = screenContent[key]
  if (content) content.tick(active)
}

function openPanel(key) {
  const content = buildPanelContent(key)
  if (!content || !interactive || camStage !== 'idle') return
  activeHotspot = key
  interactive = false
  hotspotLayer.classList.remove('is-visible')
  panelKicker.textContent = content.kicker
  panelTitle.textContent = content.title
  panelBody.innerHTML = content.html
  beginCameraTween(CAMERA_CLOSE_MAP[key] ?? CAMERA_WIDE, ZOOM_FOV, 'zoom-in', () => {
    camStage = 'zoomed'
    panelRoot.classList.add('is-open')
    panelRoot.querySelector('.panel-close').focus()
  })
}

function closePanel() {
  if (camStage !== 'zoomed') return
  panelRoot.classList.remove('is-open')
  if (activeHotspot) setScreenActive(activeHotspot, false)
  beginCameraTween(CAMERA_WIDE, null, 'zoom-out', () => {
    camStage = 'idle'
    interactive = true
    hotspotLayer.classList.add('is-visible')
    activeHotspot = null
  })
}

panelRoot.addEventListener('click', (event) => {
  if (event.target.closest('[data-close]')) closePanel()
})
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closePanel()
})

const labels = new HotspotLabels(hotspotLayer, hotspots, (key) => openPanel(key))

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

canvas.addEventListener('pointermove', (event) => {
  if (!interactive) return
  updatePointer(event)
})

canvas.addEventListener('pointerleave', () => {
  pointer.set(-10, -10)
})

canvas.addEventListener('click', (event) => {
  if (!interactive) return
  updatePointer(event)
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(hitboxes, false)
  if (hits.length > 0) {
    openPanel(hits[0].object.userData.hotspot)
  }
})

// ---------- camera tweening (shared by the intro and the zoom-to-object moves) ----------

const easeOutCubic = (t) => 1 - (1 - t) ** 3
const tmpTarget = new THREE.Vector3()
const tweenFrom = { position: new THREE.Vector3(), target: new THREE.Vector3(), fov: CLOSE_FOV }

let tween = null // { from, to: {position,target,fov}, duration, start, onDone }

function beginCameraTween(to, fov, nextStage, onDone) {
  tweenFrom.position.copy(camera.position)
  camera.getWorldDirection(tmpTarget)
  tweenFrom.target.copy(camera.position).add(tmpTarget)
  tweenFrom.fov = camera.fov
  camStage = nextStage
  tween = {
    from: { position: tweenFrom.position.clone(), target: tweenFrom.target.clone(), fov: tweenFrom.fov },
    to: { position: to.position, target: to.target, fov: fov ?? camera.userData.wideFov },
    duration: nextStage === 'intro' ? 2200 : 1100,
    start: performance.now(),
    onDone,
  }
}

runConnectSequence(bootLog, () => {
  bootEl.classList.add('is-hidden')
  beginCameraTween(CAMERA_WIDE, null, 'intro', () => {
    camStage = 'idle'
    interactive = true
    canvas.classList.add('is-interactive')
    hotspotLayer.classList.add('is-visible')
  })
})

// ---------- animation loop ----------

const clock = new THREE.Clock()
let frame = 0

function animate() {
  requestAnimationFrame(animate)

  // the boot log sits on an opaque background, so skip the (expensive, multi-pass)
  // render entirely while it plays — this also keeps the typing timers from lagging
  if (camStage === 'log') {
    clock.getDelta()
    return
  }

  const delta = Math.min(clock.getDelta(), 0.1)
  frame += 1

  if (tween) {
    const t = Math.min((performance.now() - tween.start) / tween.duration, 1)
    const eased = easeOutCubic(t)
    camera.position.lerpVectors(tween.from.position, tween.to.position, eased)
    tmpTarget.lerpVectors(tween.from.target, tween.to.target, eased)
    camera.lookAt(tmpTarget)
    camera.fov = THREE.MathUtils.lerp(tween.from.fov, tween.to.fov, eased)
    camera.updateProjectionMatrix()
    if (t >= 1) {
      const done = tween.onDone
      tween = null
      if (done) done()
    }
  }

  // live screen content: scrolling code, a blinking title screen, a HUD — throttled,
  // the zoomed-in screen (if any) redraws in its highlighted "active" variant
  if (frame % 9 === 0) {
    Object.entries(screenContent).forEach(([key, content]) => {
      content.tick(key === activeHotspot)
    })
  }

  glowSprites.forEach((sprite, i) => {
    sprite.material.opacity = 0.4 + Math.sin(clock.elapsedTime * 8.0 + i * 2.1) * 0.06
  })

  if (interactive) {
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(hitboxes, false)
    const hit = hits[0]?.object.userData.hotspot ?? null
    if (hit !== hovered) {
      hovered = hit
      canvas.style.cursor = hovered ? 'pointer' : 'default'
    }
  }

  const { w, h } = size()
  if (camStage === 'idle') labels.update(camera, w, h)

  composer.render(scene, camera, delta)
}

animate()
