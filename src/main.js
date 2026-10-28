import * as THREE from 'three'
import './style.css'
import {
  createRenderer,
  createCamera,
  createLights,
  fovForAspect,
  CAMERA_WIDE,
  CAMERA_CLOSE_MAP,
  INTRO_PATH,
  ZOOM_FOV,
} from './scene/setup.js'
import { buildRoom } from './scene/room.js'
import { currentHour, daylightAt, applyDaylight, formatHour, ambienceLogLabel } from './scene/ambience.js'
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
const panelEl = panelRoot.querySelector('.panel')
const panelTitle = document.getElementById('panel-title')
const panelKicker = document.getElementById('panel-kicker')
const panelBody = document.getElementById('panel-body')

const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0x0a0b14, 0.032)

const renderer = createRenderer(canvas)
const camera = createCamera(stage.clientWidth / stage.clientHeight)
const lightRig = createLights(scene)

const { group: roomGroup, hotspots, hitboxes, glowSprites, doorHinge, screenContent, ambience } = buildRoom()
scene.add(roomGroup)

// dev-only "photo mode": jump the camera to any pose and read where each
// hotspot label lands in NDC — stripped from production builds
if (import.meta.env.DEV) {
  const look = (position, target, fov) => {
    camera.position.copy(position)
    camera.lookAt(target)
    camera.fov = fov
    camera.updateProjectionMatrix()
    camera.updateMatrixWorld()
    return Object.fromEntries(
      Object.entries(hotspots).map(([k, v]) => {
        const p = v.clone().project(camera)
        return [k, [+p.x.toFixed(2), +p.y.toFixed(2)]]
      }),
    )
  }
  window.__room = {
    camera,
    door: (angle) => (doorHinge.rotation.y = angle),
    time: (hour) => refreshAmbience(hour),
    // freeze the intro walk at progress u (0..1), door open
    intro: (u) => {
      camStage = 'frozen'
      doorHinge.rotation.y = DOOR_OPEN_ANGLE
      introPositions.getPointAt(u, camera.position)
      camera.lookAt(introTargets.getPointAt(u))
      camera.fov = THREE.MathUtils.lerp(INTRO_PATH.fov, camera.userData.wideFov, u)
      camera.updateProjectionMatrix()
      hotspotLayer.style.display = 'none'
    },
    look: (p, t) => look(new THREE.Vector3(...p), new THREE.Vector3(...t), camera.userData.wideFov),
    pose: (key) => {
      const p = key === 'wide' ? CAMERA_WIDE : CAMERA_CLOSE_MAP[key]
      hotspotLayer.style.display = key === 'wide' ? '' : 'none'
      return look(p.position, p.target, key === 'wide' ? camera.userData.wideFov : ZOOM_FOV)
    },
  }
}

function size() {
  return { w: stage.clientWidth, h: stage.clientHeight }
}

const { w: initW, h: initH } = size()
renderer.setSize(initW, initH)
const composer = new CRTComposer(renderer, initW, initH)

// ---------- time of day: the room follows São Paulo's real clock ----------

const cornerClock = document.querySelector('.corner.tr')

function refreshAmbience(hour = currentHour()) {
  const state = daylightAt(hour)
  applyDaylight(state, { scene, composer, rig: lightRig, glowSprites, ambience })
  cornerClock.textContent = `SÃO PAULO-SP · ${formatHour(hour)}`
  return state
}

const initialAmbience = refreshAmbience()
setInterval(() => refreshAmbience(), 30_000)

// camStage: 'log' (boot) -> 'door-hold' (in the hallway, facing the closed
// door) -> 'intro' (the door swings in, the camera walks through and backs out
// to the wide framing) -> 'idle' -> 'zoom-in' -> 'zoomed' (panel open) ->
// 'zoom-out' -> back to 'idle'
let camStage = 'log'
let doorHoldStart = null
let introStart = null
const DOOR_HOLD_MS = 700
const DOOR_OPEN_MS = 1200
const DOOR_OPEN_ANGLE = Math.PI * 0.5
const WALK_DELAY_MS = 500
const WALK_MS = 4200
const introPositions = new THREE.CatmullRomCurve3(INTRO_PATH.positions, false, 'centripetal')
const introTargets = new THREE.CatmullRomCurve3(INTRO_PATH.targets, false, 'centripetal')
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
  panelEl.dataset.theme = key
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

// ---------- camera tweening (the zoom-to-object moves) ----------

const easeOutCubic = (t) => 1 - (1 - t) ** 3
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const tmpTarget = new THREE.Vector3()
const tweenFrom = { position: new THREE.Vector3(), target: new THREE.Vector3(), fov: ZOOM_FOV }

let tween = null // { from, to: {position,target,fov}, duration, start, onDone }

function beginCameraTween(to, fov, nextStage, onDone) {
  tweenFrom.position.copy(camera.position)
  camera.getWorldDirection(tmpTarget)
  tweenFrom.target.copy(camera.position).add(tmpTarget)
  tweenFrom.fov = camera.fov
  camStage = nextStage
  tween = {
    from: { position: tweenFrom.position.clone(), target: tweenFrom.target.clone(), fov: tweenFrom.fov },
    // null fov = "the wide fov", resolved every frame so a resize mid-tween lands right
    to: { position: to.position, target: to.target, fov },
    duration: 1100,
    start: performance.now(),
    onDone,
  }
}

function enterIdle() {
  camStage = 'idle'
  interactive = true
  canvas.classList.add('is-interactive')
  hotspotLayer.classList.add('is-visible')
}

/** The walk in: the door swings into the room first, then the camera crosses
 * the threshold, turns toward the room and backs out to the wide framing. */
function updateIntro(now) {
  const elapsed = now - introStart
  doorHinge.rotation.y = easeInOutCubic(Math.min(elapsed / DOOR_OPEN_MS, 1)) * DOOR_OPEN_ANGLE
  const walk = Math.min(Math.max((elapsed - WALK_DELAY_MS) / WALK_MS, 0), 1)
  const u = easeInOutCubic(walk)
  introPositions.getPointAt(u, camera.position)
  introTargets.getPointAt(u, tmpTarget)
  camera.lookAt(tmpTarget)
  camera.fov = THREE.MathUtils.lerp(INTRO_PATH.fov, camera.userData.wideFov, u)
  camera.updateProjectionMatrix()
  if (walk >= 1) enterIdle()
}

runConnectSequence(
  bootLog,
  () => {
    bootEl.classList.add('is-hidden')
    if (reducedMotion) {
      doorHinge.rotation.y = DOOR_OPEN_ANGLE
      camera.position.copy(CAMERA_WIDE.position)
      camera.lookAt(CAMERA_WIDE.target)
      camera.fov = camera.userData.wideFov
      camera.updateProjectionMatrix()
      enterIdle()
      return
    }
    // access granted — hold a beat in the hallway on the closed door before it
    // opens, so the knock-and-answer reads as a real moment, not a cut
    camStage = 'door-hold'
    doorHoldStart = performance.now()
  },
  ambienceLogLabel(initialAmbience),
)

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

  const now = performance.now()
  if (camStage === 'door-hold' && now - doorHoldStart >= DOOR_HOLD_MS) {
    camStage = 'intro'
    introStart = now
  }
  if (camStage === 'intro') updateIntro(now)

  if (tween) {
    const t = Math.min((performance.now() - tween.start) / tween.duration, 1)
    const eased = easeOutCubic(t)
    camera.position.lerpVectors(tween.from.position, tween.to.position, eased)
    tmpTarget.lerpVectors(tween.from.target, tween.to.target, eased)
    camera.lookAt(tmpTarget)
    camera.fov = THREE.MathUtils.lerp(tween.from.fov, tween.to.fov ?? camera.userData.wideFov, eased)
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
    const level = sprite.userData.level ?? 1
    sprite.visible = level > 0.01
    sprite.material.opacity = (0.4 + Math.sin(clock.elapsedTime * 8.0 + i * 2.1) * 0.06) * level
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
