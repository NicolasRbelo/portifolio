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
  PORTRAIT_ASPECT,
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

const { group: roomGroup, hotspots, hitboxes, glowSprites, doorHinge, ceilings, screenContent, ambience } = buildRoom()
scene.add(roomGroup)

// dev-only "photo mode": jump the camera to any pose and read where each
// hotspot label lands in NDC — stripped from production builds
if (import.meta.env.DEV) {
  const look = (position, target, fov) => {
    camStage = 'frozen'
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
    contact,
    door: (angle) => (doorHinge.rotation.y = angle),
    time: (hour) => refreshAmbience(hour),
    // drive the real look-around: jump to rail position s (0..1) and elevation
    view: (s, elev = rig.rest.elev) => {
      hotspotLayer.style.display = ''
      Object.assign(view, { s, elev, goalS: s, goalElev: elev })
      camera.fov = camera.userData.wideFov
      camera.updateProjectionMatrix()
      camStage = 'idle'
    },
    // freeze the intro walk at progress u (0..1), door open
    intro: (u) => {
      camStage = 'frozen'
      doorHinge.rotation.y = DOOR_OPEN_ANGLE
      buildIntroPath()
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
// the walk-in ends on the resting view of whichever rig fits the screen, so the
// curves are (re)built when the walk starts
let introPositions = null
let introTargets = null
function buildIntroPath() {
  const rest = restPose()
  introPositions = new THREE.CatmullRomCurve3([...INTRO_PATH.positions.slice(0, -1), rest.position], false, 'centripetal')
  introTargets = new THREE.CatmullRomCurve3([...INTRO_PATH.targets.slice(0, -1), rest.target], false, 'centripetal')
}
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------- look around ----------
// Dragging moves the camera along a "rail" picked for the screen's shape:
//  landscape — orbits the room from its open side; the turn is capped so a
//              side wall never swings in front of the lens
//  portrait  — a steeper ¾ view from above that sweeps across the room one wall
//              at a time (bed and phone → desk and TV → corkboard), so a narrow
//              screen never has to cram the whole room in at once
// Dragging up/down (or the toggle) rises to an overhead view; the ceiling hides.

const viewToggle = document.getElementById('view-toggle')
const dragHint = document.getElementById('drag-hint')

const wideOrbit = (() => {
  const pivot = CAMERA_WIDE.target.clone()
  const offset = CAMERA_WIDE.position.clone().sub(pivot)
  const radius = offset.length()
  return { pivot, radius, yaw: Math.atan2(offset.x, offset.z), elev: Math.asin(offset.y / radius) }
})()

const RIGS = {
  landscape: {
    radius: wideOrbit.radius,
    rest: { s: (0.46 - wideOrbit.yaw) / 0.83, elev: wideOrbit.elev },
    elevRange: [0.12, 1.1],
    overheadElev: 1.0,
    // dragging right rotates the room with the finger (camera swings left)
    dragSpeed: 0.0054,
    rail: [
      { pivot: wideOrbit.pivot, yaw: 0.46 },
      { pivot: wideOrbit.pivot, yaw: -0.37 },
    ],
  },
  portrait: {
    radius: 7.0,
    rest: { s: 0.38, elev: 0.6 },
    elevRange: [0.42, 1.15],
    overheadElev: 1.05,
    // dragging left reveals what's to the right, like a panorama
    dragSpeed: -0.0028,
    rail: [
      { pivot: new THREE.Vector3(-2.6, 0.8, -1.4), yaw: 0.6 },
      { pivot: new THREE.Vector3(-1.1, 0.8, -2.0), yaw: 0.22 },
      { pivot: new THREE.Vector3(2.7, 1.0, -2.2), yaw: -0.6 },
    ],
  },
}

let rig = null
const view = { s: 0, elev: 0, goalS: 0, goalElev: 0 }

function pickRig(aspect) {
  const next = aspect < PORTRAIT_ASPECT ? RIGS.portrait : RIGS.landscape
  if (next === rig) return
  rig = next
  Object.assign(view, { s: rig.rest.s, elev: rig.rest.elev, goalS: rig.rest.s, goalElev: rig.rest.elev })
}

/** Camera pose at rail position s (0..1) and an elevation; it backs off a
 * little as it rises so the whole floor plan still fits the overhead view. */
function viewPose(s, elev, out = { position: new THREE.Vector3(), target: new THREE.Vector3() }) {
  const { rail } = rig
  const f = THREE.MathUtils.clamp(s, 0, 1) * (rail.length - 1)
  const i = Math.min(Math.floor(f), rail.length - 2)
  const t = f - i
  out.target.lerpVectors(rail[i].pivot, rail[i + 1].pivot, t)
  const yaw = THREE.MathUtils.lerp(rail[i].yaw, rail[i + 1].yaw, t)
  const rise = Math.max(0, (elev - rig.rest.elev) / (rig.elevRange[1] - rig.rest.elev))
  const radius = rig.radius + rise * 1.8
  out.position
    .set(Math.sin(yaw) * Math.cos(elev), Math.sin(elev), Math.cos(yaw) * Math.cos(elev))
    .multiplyScalar(radius)
    .add(out.target)
  return out
}

const restPose = () => viewPose(rig.rest.s, rig.rest.elev)

function steerView(dS, dElev) {
  view.goalS = THREE.MathUtils.clamp(view.goalS + dS, 0, 1)
  view.goalElev = THREE.MathUtils.clamp(view.goalElev + dElev, ...rig.elevRange)
  dragHint.classList.add('is-dismissed')
}

const isOverhead = () => view.goalElev > (rig.rest.elev + rig.overheadElev) / 2
const livePose = { position: camera.position, target: new THREE.Vector3() }

function updateView(delta) {
  const k = 1 - Math.exp(-delta * 8)
  view.s += (view.goalS - view.s) * k
  view.elev += (view.goalElev - view.elev) * k
  viewPose(view.s, view.elev, livePose)
  camera.lookAt(livePose.target)
  viewToggle.textContent = isOverhead() ? 'VISÃO FRONTAL' : 'VISÃO DE CIMA'
  viewToggle.setAttribute('aria-pressed', String(isOverhead()))
}

viewToggle.addEventListener('click', () => {
  const goUp = !isOverhead()
  view.goalS = rig.rest.s
  view.goalElev = goUp ? rig.overheadElev : rig.rest.elev
  dragHint.classList.add('is-dismissed')
})

function handleResize() {
  const { w, h } = size()
  camera.aspect = w / h
  pickRig(camera.aspect)
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
  stage.classList.remove('is-exploring')
  panelEl.dataset.theme = key
  panelKicker.textContent = content.kicker
  panelTitle.textContent = content.title
  panelBody.innerHTML = content.html
  content.mount?.(panelBody)
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
  // back to wherever the visitor was looking before opening the panel
  beginCameraTween(viewPose(view.s, view.elev), null, 'zoom-out', () => {
    activeHotspot = null
    enterIdle()
  })
}

panelRoot.addEventListener('click', (event) => {
  if (event.target.closest('[data-close]')) closePanel()
})
// left/right look toward the left/right wall on either rig
const ARROW_STEPS = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, 0.14], ArrowDown: [0, -0.14] }

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closePanel()
  const step = ARROW_STEPS[event.key]
  if (step && interactive) {
    event.preventDefault()
    steerView(...step)
  }
})

const labels = new HotspotLabels(hotspotLayer, hotspots, (key) => openPanel(key))

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

// a drag orbits the room; only a press that barely moved counts as a click
const DRAG_THRESHOLD = 6
let drag = null
let suppressClick = false

canvas.addEventListener('pointerdown', (event) => {
  if (!interactive) return
  drag = { x: event.clientX, y: event.clientY, moved: 0 }
  suppressClick = false
  canvas.setPointerCapture(event.pointerId)
})

canvas.addEventListener('pointermove', (event) => {
  if (!interactive) return
  updatePointer(event)
  if (!drag) return
  const dx = event.clientX - drag.x
  const dy = event.clientY - drag.y
  drag.x = event.clientX
  drag.y = event.clientY
  drag.moved += Math.abs(dx) + Math.abs(dy)
  if (drag.moved < DRAG_THRESHOLD) return
  canvas.classList.add('is-dragging')
  steerView(dx * rig.dragSpeed, dy * 0.004)
})

function endDrag() {
  if (!drag) return
  suppressClick = drag.moved >= DRAG_THRESHOLD
  drag = null
  canvas.classList.remove('is-dragging')
}
canvas.addEventListener('pointerup', endDrag)
canvas.addEventListener('pointercancel', endDrag)

canvas.addEventListener('pointerleave', () => {
  pointer.set(-10, -10)
})

canvas.addEventListener('click', (event) => {
  if (!interactive) return
  if (suppressClick) {
    suppressClick = false
    return
  }
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
  stage.classList.add('is-exploring')
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
      const rest = restPose()
      camera.position.copy(rest.position)
      camera.lookAt(rest.target)
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
    buildIntroPath()
    camStage = 'intro'
    introStart = now
  }
  if (camStage === 'intro') updateIntro(now)
  if (camStage === 'idle') updateView(delta)
  ceilings.forEach((ceiling) => (ceiling.visible = camera.position.y < 3.3))

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
      canvas.style.cursor = hovered ? 'pointer' : ''
    }
  }

  const { w, h } = size()
  if (camStage === 'idle') labels.update(camera, w, h)

  composer.render(scene, camera, delta)
}

animate()
