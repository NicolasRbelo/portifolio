import * as THREE from 'three'

// the room is in São Paulo, so it follows São Paulo's clock — not the visitor's
const TIME_ZONE = 'America/Sao_Paulo'
const SUNRISE = 6.0
const SUNSET = 18.0
const BACK_WALL = -3.8
const WINDOW = { x: 0.8, width: 1.26, bottom: 1.12, top: 2.58 }

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const bell = (x, center, width) => Math.exp(-(((x - center) / width) ** 2))

/** Current hour (fractional) in São Paulo. `?hora=14` or `?hora=18:30` in the
 * URL pins it, so any time of day can be previewed. */
export function currentHour() {
  const pinned = new URLSearchParams(window.location.search).get('hora')
  if (pinned) {
    const [h, m = '0'] = pinned.replace(',', '.').split(':')
    const hour = Number(h) + Number(m) / 60
    if (Number.isFinite(hour)) return ((hour % 24) + 24) % 24
  }
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (type) => Number(parts.find((p) => p.type === type).value)
  return get('hour') + get('minute') / 60
}

export function formatHour(hour) {
  const h = Math.floor(hour)
  const m = Math.floor((hour - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** day: 0 at night → 1 in full daylight. golden: peaks around sunrise and
 * sunset. sunX/sunHeight place the sun in the window as it crosses the sky. */
export function daylightAt(hour) {
  const day = smoothstep(SUNRISE - 0.5, SUNRISE + 1.0, hour) * (1 - smoothstep(SUNSET - 1.0, SUNSET + 0.6, hour))
  const golden = Math.max(bell(hour, SUNRISE + 0.3, 0.8), bell(hour, SUNSET - 0.1, 0.8))
  const progress = clamp01((hour - SUNRISE) / (SUNSET - SUNRISE))
  return {
    hour,
    day,
    golden,
    sunUp: hour > SUNRISE - 0.25 && hour < SUNSET + 0.3,
    sunX: 0.12 + 0.76 * progress,
    sunHeight: Math.sin(progress * Math.PI),
  }
}

/** One line for the boot log, so the terminal says what the room is doing. */
export function ambienceLogLabel({ day, hour }) {
  if (day < 0.3) return 'Acendendo as luzes'
  if (day > 0.7) return 'Abrindo as cortinas'
  return hour < 12 ? 'Deixando o sol entrar' : 'Acendendo as luzes do fim de tarde'
}

const NIGHT = {
  ambient: new THREE.Color(0x4a4258),
  sky: new THREE.Color(0x6a5878),
  ground: new THREE.Color(0x14141e),
  fog: new THREE.Color(0x0a0b14),
  window: new THREE.Color(0x7aa0d8),
  tint: new THREE.Vector3(0.96, 0.98, 1.06),
}
const DAY = {
  ambient: new THREE.Color(0x9a9cac),
  sky: new THREE.Color(0xc8dcff),
  ground: new THREE.Color(0x6a5a48),
  fog: new THREE.Color(0x2c3038),
  window: new THREE.Color(0xfff0d8),
  tint: new THREE.Vector3(1.04, 1.0, 0.96),
}
const GOLDEN_WINDOW = new THREE.Color(0xffa860)
const GOLDEN_AMBIENT = new THREE.Color(0xb08878)

const lerp = THREE.MathUtils.lerp
const tmpColor = new THREE.Color()

/** Lays the sun patch and the two light shafts along the sun's angle: a low sun
 * throws a long patch deep into the room, a high one a short patch by the wall. */
function placeSunlight({ sunPatch, sunShafts }, state, strength) {
  const elevation = THREE.MathUtils.degToRad(lerp(28, 62, state.sunHeight))
  const run = 1 / Math.tan(elevation)
  const zNear = Math.min(BACK_WALL + WINDOW.bottom * run, -1.0)
  const zFar = Math.min(BACK_WALL + WINDOW.top * run, -0.3)
  // a low sun is weaker, and its long patch shouldn't dominate the floor
  strength *= lerp(0.5, 1, state.sunHeight)
  // morning sun comes from the left, so the patch drifts right, and vice versa
  const drift = (0.5 - state.sunX) * 1.1
  const xNear = WINDOW.x + drift * (zNear - BACK_WALL) * 0.5
  const xFar = WINDOW.x + drift * (zFar - BACK_WALL) * 0.5
  const color = tmpColor.set(0xffe6b8).lerp(GOLDEN_WINDOW, state.golden)

  // the texture's panes fill ~78% of it, so scale up to match the window's size
  sunPatch.position.set((xNear + xFar) / 2, 0.007, (zNear + zFar) / 2)
  sunPatch.scale.set(WINDOW.width / 0.78, Math.max(0.3, zFar - zNear) / 0.78, 1)
  sunPatch.material.opacity = 0.42 * strength
  sunPatch.material.color.copy(color)

  const half = WINDOW.width / 2
  const shaftEdges = [
    [WINDOW.top, zFar, xFar],
    [WINDOW.bottom, zNear, xNear],
  ]
  sunShafts.forEach((shaft, i) => {
    const [windowY, floorZ, floorX] = shaftEdges[i]
    const pos = shaft.geometry.attributes.position
    // PlaneGeometry corner order: top-left, top-right, bottom-left, bottom-right
    pos.setXYZ(0, WINDOW.x - half, windowY, BACK_WALL + 0.06)
    pos.setXYZ(1, WINDOW.x + half, windowY, BACK_WALL + 0.06)
    pos.setXYZ(2, floorX - half, 0.01, floorZ)
    pos.setXYZ(3, floorX + half, 0.01, floorZ)
    pos.needsUpdate = true
    shaft.material.opacity = 0.06 * strength
    shaft.material.color.copy(color)
  })
}

/** Applies the time of day to the whole room: lamps on or off, the window's sky,
 * the sunlight, fog, the post-process tint and the wall clock. */
export function applyDaylight(state, { scene, composer, rig, glowSprites, ambience }) {
  const { day, golden } = state
  // lamps come on as the light fades, and are fully off in daylight
  const lampsOn = 1 - smoothstep(0.35, 0.8, day)
  const sunStrength = state.sunUp ? clamp01(day + golden * 0.5) : 0

  rig.lights.forEach((light) => {
    const { role, base } = light.userData
    if (role === 'lamp') light.intensity = base * lampsOn
    else if (role === 'screen') light.intensity = base * lerp(1, 0.5, day)
    else if (role === 'fill') light.intensity = base * lerp(1, 0.45, day)
  })

  rig.windowLight.intensity = lerp(8, 30, day) + golden * 10
  rig.windowLight.distance = lerp(4, 9, day)
  rig.windowLight.color.copy(NIGHT.window).lerp(DAY.window, day).lerp(GOLDEN_WINDOW, golden * 0.6)

  rig.ambient.intensity = lerp(4.6, 7.2, day)
  rig.ambient.color.copy(NIGHT.ambient).lerp(DAY.ambient, day).lerp(GOLDEN_AMBIENT, golden * 0.35)
  rig.fill.intensity = lerp(2.8, 5.0, day)
  rig.fill.color.copy(NIGHT.sky).lerp(DAY.sky, day)
  rig.fill.groundColor.copy(NIGHT.ground).lerp(DAY.ground, day)

  scene.fog.color.copy(NIGHT.fog).lerp(DAY.fog, day)
  scene.fog.density = lerp(0.032, 0.022, day)

  const tint = composer.compositeMat.uniforms.tint.value
  tint.setRGB(lerp(NIGHT.tint.x, DAY.tint.x, day), lerp(NIGHT.tint.y, DAY.tint.y, day), lerp(NIGHT.tint.z, DAY.tint.z, day))

  glowSprites.forEach((sprite) => {
    const kind = sprite.userData.kind
    sprite.userData.level = kind === 'lamp' ? lampsOn : kind === 'screen' ? lerp(1, 0.55, day) : 1
  })
  ambience.lampMaterials.forEach(({ material, base, onColor, offColor }) => {
    material.emissiveIntensity = base * lampsOn
    if (offColor !== undefined) material.color.setHex(offColor).lerp(tmpColor.setHex(onColor), lampsOn)
  })
  ambience.doorLeak.material.opacity = 0.5 * lampsOn

  ambience.windowView.draw(state)
  placeSunlight(ambience, state, sunStrength)

  const minutes = (state.hour % 12) * 60
  ambience.clock.hourHand.rotation.z = -(minutes / 720) * Math.PI * 2
  ambience.clock.minuteHand.rotation.z = -((minutes % 60) / 60) * Math.PI * 2
}
