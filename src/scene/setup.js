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

export const CAMERA_WIDE = {
  position: new THREE.Vector3(0.1, 1.86, 6.6),
  target: new THREE.Vector3(0, 1.5, -1.2),
}

// one close anchor per hotspot, framing that object's own screen/board
export const CAMERA_CLOSE_MAP = {
  projetos: {
    position: new THREE.Vector3(-2.3, 1.27, 1.45),
    target: new THREE.Vector3(-2.3, 1.2, 0.54),
  },
  experiencia: {
    position: new THREE.Vector3(-1.35, 0.8, -1.55),
    target: new THREE.Vector3(-1.35, 0.68, -2.78),
  },
  sobre: {
    position: new THREE.Vector3(2.55, 1.82, -2.1),
    target: new THREE.Vector3(2.95, 1.78, -3.6),
  },
  contato: {
    position: new THREE.Vector3(-1.9, 1.05, 0.6),
    target: new THREE.Vector3(-2.7, 0.72, 0.9),
  },
}

// the intro opens on the door, closed, before the recognition reveal
export const CAMERA_DOOR = {
  position: new THREE.Vector3(0.6, 1.55, -1.1),
  target: new THREE.Vector3(0.6, 1.35, -3.74),
}

export const CLOSE_FOV = 32
export const ZOOM_FOV = 32

export function createCamera(aspect) {
  const camera = new THREE.PerspectiveCamera(CLOSE_FOV, aspect, 0.1, 50)
  camera.position.copy(CAMERA_DOOR.position)
  camera.lookAt(CAMERA_DOOR.target)
  camera.userData.wideFov = fovForAspect(aspect)
  return camera
}

export function createLights(scene) {
  const ambient = new THREE.AmbientLight(0x4a4258, 4.6)
  scene.add(ambient)

  const fill = new THREE.HemisphereLight(0x6a5878, 0x14141e, 2.8)
  scene.add(fill)

  // the neon strip along the back wall — the room's main ambient light source,
  // cool magenta instead of a warm overhead fixture
  const ledLight = new THREE.PointLight(0xff3ec9, 26, 9, 2)
  ledLight.position.set(0, 3.2, -3.3)
  scene.add(ledLight)
  const ledLight2 = new THREE.PointLight(0xff3ec9, 20, 8, 2)
  ledLight2.position.set(-2.8, 2.8, -3.0)
  scene.add(ledLight2)
  const ledLight3 = new THREE.PointLight(0xff3ec9, 18, 8, 2)
  ledLight3.position.set(2.8, 2.8, -3.0)
  scene.add(ledLight3)

  // the desk lamp's warm practical light
  const lampLight = new THREE.PointLight(0xffd9a0, 20, 3.2, 2)
  lampLight.position.set(-2.82, 1.96, 0.42)
  scene.add(lampLight)

  // monitor glow, cool blue-cyan
  const monitorLight = new THREE.PointLight(0x4ad9ff, 16, 3.5, 2)
  monitorLight.position.set(-2.3, 1.78, 0.1)
  scene.add(monitorLight)

  // TV glow, matching its screen
  const tvLight = new THREE.PointLight(0xff3ec9, 14, 3.5, 2)
  tvLight.position.set(-1.35, 0.68, -2.9)
  scene.add(tvLight)

  // fill for the corkboard, which otherwise only gets ambient/rim light
  const corkLight = new THREE.PointLight(0xe8d9b8, 4.5, 3.6, 1.6)
  corkLight.position.set(2.85, 1.75, -3.35)
  scene.add(corkLight)

  const rim = new THREE.SpotLight(0x7a6898, 42, 13, Math.PI / 4.2, 0.5, 1.4)
  rim.position.set(2.5, 3.2, 3.5)
  rim.target.position.set(0, 1, -1)
  scene.add(rim, rim.target)

  // the bed / nightstand corner sits far from every other light, so it needs its own
  const bedLight = new THREE.PointLight(0xb8a8d8, 8, 6.5, 2)
  bedLight.position.set(-3.2, 2.2, 1.8)
  scene.add(bedLight)

  const phoneLight = new THREE.PointLight(0x4ade80, 4, 1.8, 2)
  phoneLight.position.set(-3.6, 0.75, 2.9)
  scene.add(phoneLight)

  // cool city light through the window
  const windowLight = new THREE.PointLight(0x7aa0d8, 7, 3.5, 2)
  windowLight.position.set(3.7, 2.0, 0.6)
  scene.add(windowLight)

  return {}
}
