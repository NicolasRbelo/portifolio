import * as THREE from 'three'

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ReinhardToneMapping
  renderer.toneMappingExposure = 3.1
  return renderer
}

const BASE_VERTICAL_FOV = 34
const MIN_HORIZONTAL_FOV = 72
const MAX_VERTICAL_FOV = 72

/** Keeps the room's horizontal extent visible even on tall/narrow viewports by
 * widening the vertical FOV until the implied horizontal FOV clears the floor. */
export function fovForAspect(aspect) {
  const baseRad = THREE.MathUtils.degToRad(BASE_VERTICAL_FOV)
  const horizontalRad = 2 * Math.atan(Math.tan(baseRad / 2) * aspect)
  const horizontalDeg = THREE.MathUtils.radToDeg(horizontalRad)
  if (horizontalDeg >= MIN_HORIZONTAL_FOV) return BASE_VERTICAL_FOV
  const neededHorizontalRad = THREE.MathUtils.degToRad(MIN_HORIZONTAL_FOV)
  const neededVerticalRad = 2 * Math.atan(Math.tan(neededHorizontalRad / 2) / aspect)
  return Math.min(THREE.MathUtils.radToDeg(neededVerticalRad), MAX_VERTICAL_FOV)
}

// elevated and pitched down, like looking into the room from its doorway-less
// fourth wall: the floor carries the composition, the ceiling is only a sliver
export const CAMERA_WIDE = {
  position: new THREE.Vector3(-0.45, 2.75, 4.9),
  target: new THREE.Vector3(-0.3, 1.25, -1.8),
}

// one close anchor per hotspot, framing that object's own screen/board
export const CAMERA_CLOSE_MAP = {
  projetos: {
    position: new THREE.Vector3(-3.2, 1.5, -1.45),
    target: new THREE.Vector3(-3.4, 0.98, -3.45),
  },
  experiencia: {
    position: new THREE.Vector3(-1.3, 1.4, -1.15),
    target: new THREE.Vector3(-1.3, 1.38, -3.7),
  },
  sobre: {
    position: new THREE.Vector3(2.9, 1.95, -0.9),
    target: new THREE.Vector3(3.0, 1.92, -3.75),
  },
  contato: {
    position: new THREE.Vector3(-2.9, 1.08, -1.65),
    target: new THREE.Vector3(-3.96, 0.62, -1.3),
  },
}

// the intro: the visitor stands in the hallway facing the closed door, the door
// swings into the room, and the camera walks through the doorway, turns toward
// the room and backs out to the wide framing. Position and target are sampled
// along these two curves with the same eased progress.
export const INTRO_PATH = {
  fov: 50,
  positions: [
    new THREE.Vector3(6.4, 1.62, 0.9),
    new THREE.Vector3(4.4, 1.64, 0.9),
    new THREE.Vector3(2.85, 1.85, 0.72),
    new THREE.Vector3(1.2, 2.4, 2.9),
    CAMERA_WIDE.position,
  ],
  targets: [
    new THREE.Vector3(4.3, 1.45, 0.9),
    new THREE.Vector3(2.0, 1.45, 0.6),
    new THREE.Vector3(-1.6, 1.4, -2.4),
    new THREE.Vector3(-0.7, 1.3, -2.1),
    CAMERA_WIDE.target,
  ],
}

export const ZOOM_FOV = 32

export function createCamera(aspect) {
  const camera = new THREE.PerspectiveCamera(INTRO_PATH.fov, aspect, 0.05, 50)
  camera.position.copy(INTRO_PATH.positions[0])
  camera.lookAt(INTRO_PATH.targets[0])
  camera.userData.wideFov = fovForAspect(aspect)
  return camera
}

/** Every light is tagged with its role so the day/night system can drive it:
 *  lamp   — practical room lights (LED strip, lamps): on at night, off by day
 *  screen — monitor/TV/phone glow: always on, less dominant in daylight
 *  window — city glow at night, sunlight by day
 *  fill   — artistic night fill, eased down by day
 *  hall   — the hallway ceiling light, always on */
export function createLights(scene) {
  const lights = []
  const add = (light, role) => {
    light.userData.role = role
    light.userData.base = light.intensity
    scene.add(light)
    if (light.target) scene.add(light.target)
    lights.push(light)
    return light
  }

  const ambient = new THREE.AmbientLight(0x4a4258, 4.6)
  scene.add(ambient)
  const fill = new THREE.HemisphereLight(0x6a5878, 0x14141e, 2.8)
  scene.add(fill)

  // the neon strip along the back wall — the room's main night light source
  add(new THREE.PointLight(0xff3ec9, 26, 9, 2), 'lamp').position.set(0, 3.2, -3.3)
  add(new THREE.PointLight(0xff3ec9, 20, 8, 2), 'lamp').position.set(-2.8, 2.8, -3.0)
  // kept off the corkboard: right above it, it bleached the paper notes
  add(new THREE.PointLight(0xff3ec9, 14, 8, 2), 'lamp').position.set(1.4, 3.0, -2.6)

  // desk lamp, standing lamp, dresser lamp (inside its shade, so it lights the
  // room and not the shade's own surface), the light by the door
  add(new THREE.PointLight(0xffd9a0, 16, 3.2, 2), 'lamp').position.set(-3.85, 1.35, -3.1)
  add(new THREE.PointLight(0xffd9a0, 10, 4, 2), 'lamp').position.set(-0.42, 1.55, -3.35)
  add(new THREE.PointLight(0xffd9a0, 7, 4, 2), 'lamp').position.set(4.05, 1.2, -1.43)
  add(new THREE.PointLight(0xe8c8b8, 7, 3.6, 2), 'lamp').position.set(3.3, 2.4, 0.9)

  // corkboard: a far, even fill plus the clip lamp's small pool on the notes
  add(new THREE.PointLight(0xe8d9b8, 2.0, 4.5, 1.6), 'lamp').position.set(3.0, 2.0, -2.2)
  const corkSpot = add(new THREE.SpotLight(0xffe0b0, 2.2, 2.6, Math.PI / 5, 0.8, 1.6), 'lamp')
  corkSpot.position.set(2.53, 2.5, -3.6)
  corkSpot.target.position.set(3.0, 1.7, -3.75)

  add(new THREE.PointLight(0x4ad9ff, 12, 3.2, 2), 'screen').position.set(-3.4, 1.3, -2.95)
  add(new THREE.PointLight(0xff3ec9, 14, 3.6, 2), 'screen').position.set(-1.3, 1.32, -3.4)
  add(new THREE.PointLight(0x4ade80, 4, 1.8, 2), 'screen').position.set(-3.72, 0.8, -1.3)

  const rim = add(new THREE.SpotLight(0x7a6898, 42, 13, Math.PI / 4.2, 0.5, 1.4), 'fill')
  rim.position.set(2.5, 3.2, 3.5)
  rim.target.position.set(0, 1, -1)
  // the bed / bookshelf wall sits far from the desk and TV lights
  add(new THREE.PointLight(0xb8a8d8, 8, 6.5, 2), 'fill').position.set(-3.0, 2.3, 0.4)

  const windowLight = add(new THREE.PointLight(0x7aa0d8, 8, 4, 2), 'window')
  windowLight.position.set(0.8, 1.9, -3.2)

  // hallway ceiling light, coned onto the door so it doesn't bleed through the
  // wall — once the door opens, its beam spills into the room like a real one
  const hallLight = add(new THREE.SpotLight(0xffe0b0, 30, 5, Math.PI / 5.5, 0.6, 1.6), 'hall')
  hallLight.position.set(6.8, 2.7, 0.9)
  hallLight.target.position.set(4.4, 1.2, 0.9)

  return { ambient, fill, windowLight, lights }
}
